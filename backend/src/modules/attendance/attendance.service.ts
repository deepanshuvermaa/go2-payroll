import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { AttendanceStatus, AttendanceSource } from '@prisma/client';

export class AttendanceService {
  async checkIn(employeeId: string, source: AttendanceSource, location?: string, selfieUrl?: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const existing = await prisma.attendanceRecord.findUnique({ where: { employeeId_date: { employeeId, date: today } } });
    if (existing?.checkIn) throw new AppError(400, 'Already checked in today');

    return prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date: today } },
      create: { employeeId, date: today, checkIn: new Date(), status: 'PRESENT', source, locationIn: location, selfieUrl },
      update: { checkIn: new Date(), status: 'PRESENT', source, locationIn: location, selfieUrl },
    });
  }

  async checkOut(employeeId: string, location?: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const record = await prisma.attendanceRecord.findUnique({ where: { employeeId_date: { employeeId, date: today } } });
    if (!record?.checkIn) throw new AppError(400, 'Not checked in today');

    const workHours = (Date.now() - record.checkIn.getTime()) / 3600000;
    const status: AttendanceStatus = workHours >= 4 ? (workHours >= 8 ? 'PRESENT' : 'HALF_DAY') : 'PRESENT';

    return prisma.attendanceRecord.update({
      where: { id: record.id },
      data: { checkOut: new Date(), workHours: Math.round(workHours * 100) / 100, status, locationOut: location },
    });
  }

  async markAttendance(employeeId: string, date: Date, status: AttendanceStatus, markedBy: string) {
    return prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: { employeeId, date, status, source: 'MANUAL', markedBy },
      update: { status, markedBy, source: 'MANUAL' },
    });
  }

  async bulkMark(orgId: string, date: Date, employeeIds: string[], status: AttendanceStatus, markedBy: string) {
    const ops = employeeIds.map(employeeId =>
      prisma.attendanceRecord.upsert({
        where: { employeeId_date: { employeeId, date } },
        create: { employeeId, date, status, source: 'BULK', markedBy },
        update: { status, markedBy, source: 'BULK' },
      })
    );
    return prisma.$transaction(ops);
  }

  async getByDate(orgId: string, date: Date) {
    return prisma.attendanceRecord.findMany({
      where: { date, employee: { orgId } },
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true, departmentId: true } } },
    });
  }

  async getByEmployee(employeeId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return prisma.attendanceRecord.findMany({ where: { employeeId, date: { gte: start, lte: end } }, orderBy: { date: 'asc' } });
  }

  async getMonthlySummary(employeeId: string, month: number, year: number) {
    const records = await this.getByEmployee(employeeId, month, year);
    return {
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      halfDay: records.filter(r => r.status === 'HALF_DAY').length,
      onLeave: records.filter(r => r.status === 'ON_LEAVE').length,
      holiday: records.filter(r => r.status === 'HOLIDAY').length,
      weekOff: records.filter(r => r.status === 'WEEK_OFF').length,
      lateMarks: records.filter(r => r.isLate).length,
      otHours: records.reduce((sum, r) => sum + (r.otHours || 0), 0),
      totalWorkHours: records.reduce((sum, r) => sum + (r.workHours || 0), 0),
    };
  }

  async getOrgSummary(orgId: string, date: Date) {
    const total = await prisma.employee.count({ where: { orgId, status: 'ACTIVE' } });
    const records = await this.getByDate(orgId, date);
    return {
      total,
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      onLeave: records.filter(r => r.status === 'ON_LEAVE').length,
      halfDay: records.filter(r => r.status === 'HALF_DAY').length,
      notMarked: total - records.length,
    };
  }

  async autoMarkAbsent(orgId: string, date: Date) {
    const employees = await prisma.employee.findMany({ where: { orgId, status: 'ACTIVE' }, select: { id: true } });
    const marked = await prisma.attendanceRecord.findMany({ where: { date, employee: { orgId } }, select: { employeeId: true } });
    const markedIds = new Set(marked.map(m => m.employeeId));
    const unmarked = employees.filter(e => !markedIds.has(e.id));

    const ops = unmarked.map(e =>
      prisma.attendanceRecord.create({ data: { employeeId: e.id, date, status: 'ABSENT', source: 'BULK', markedBy: 'SYSTEM' } })
    );
    return prisma.$transaction(ops);
  }

  async lockAttendance(orgId: string, month: number, year: number, lockedBy: string) {
    await prisma.attendanceLock.create({ data: { orgId, month, year, lockedBy } });
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    await prisma.attendanceRecord.updateMany({ where: { employee: { orgId }, date: { gte: start, lte: end } }, data: { isLocked: true } });
  }

  async calculateOvertime(employeeId: string, month: number, year: number) {
    const records = await this.getByEmployee(employeeId, month, year);
    const otHours = records.reduce((sum, r) => sum + (r.otHours || 0), 0);
    return { hours: otHours };
  }
}

export class GeofenceService {
  async addGeofence(orgId: string, branchId: string | null, data: { name: string; latitude: number; longitude: number; radiusMeters: number }) {
    return prisma.geofence.create({ data: { orgId, branchId, ...data } });
  }

  async validateLocation(employeeId: string, lat: number, lng: number) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { orgId: true, branchId: true } });
    if (!emp) throw new AppError(404, 'Employee not found');

    const geofences = await prisma.geofence.findMany({ where: { orgId: emp.orgId, isActive: true } });
    for (const gf of geofences) {
      const distance = this.haversine(lat, lng, gf.latitude, gf.longitude);
      if (distance <= gf.radiusMeters) return { valid: true, distance: Math.round(distance), geofence: gf.name };
    }
    const nearest = geofences.reduce((min, gf) => {
      const d = this.haversine(lat, lng, gf.latitude, gf.longitude);
      return d < min.distance ? { distance: d, name: gf.name } : min;
    }, { distance: Infinity, name: '' });
    return { valid: false, distance: Math.round(nearest.distance), nearest: nearest.name };
  }

  async getGeofences(orgId: string) {
    return prisma.geofence.findMany({ where: { orgId, isActive: true } });
  }

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}

export class RegularizationService {
  async apply(employeeId: string, date: Date, requestedStatus: AttendanceStatus, reason: string) {
    return prisma.attendanceRegularization.create({ data: { employeeId, date, requestedStatus, reason } });
  }

  async approve(requestId: string, approverId: string) {
    const req = await prisma.attendanceRegularization.update({ where: { id: requestId }, data: { status: 'APPROVED', approverId } });
    await prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: req.employeeId, date: req.date } },
      create: { employeeId: req.employeeId, date: req.date, status: req.requestedStatus, source: 'MANUAL', markedBy: approverId },
      update: { status: req.requestedStatus },
    });
    return req;
  }

  async reject(requestId: string, approverId: string, reason: string) {
    return prisma.attendanceRegularization.update({ where: { id: requestId }, data: { status: 'REJECTED', approverId, approverRemarks: reason } });
  }

  async getPending(approverId: string) {
    const reportees = await prisma.employee.findMany({ where: { reportingManagerId: approverId }, select: { id: true } });
    return prisma.attendanceRegularization.findMany({
      where: { employeeId: { in: reportees.map(r => r.id) }, status: 'PENDING' },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } },
    });
  }
}

export const attendanceService = new AttendanceService();
export const geofenceService = new GeofenceService();
export const regularizationService = new RegularizationService();
