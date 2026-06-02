import prisma from '../../config/database';

export class ESSService {
  async getDashboard(employeeId: string) {
    const [employee, leaveBalances, notifications] = await Promise.all([
      prisma.employee.findUnique({ where: { id: employeeId }, include: { department: true, designation: true } }),
      prisma.leaveBalance.findMany({ where: { employeeId, year: new Date().getFullYear() }, include: { leaveType: { select: { name: true } } } }),
      prisma.notification.findMany({ where: { user: { employee: { id: employeeId } } }, take: 5, orderBy: { createdAt: 'desc' } }),
    ]);
    return { employee, leaveBalances, recentNotifications: notifications };
  }

  async getPayslips(employeeId: string, year?: number) {
    const where: any = { employeeId };
    if (year) where.payrollRun = { year };
    return prisma.payrollRecord.findMany({ where, include: { payrollRun: { select: { month: true, year: true, status: true } } }, orderBy: { createdAt: 'desc' } });
  }

  async getAttendanceSummary(employeeId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const records = await prisma.attendanceRecord.findMany({ where: { employeeId, date: { gte: start, lte: end } }, orderBy: { date: 'asc' } });
    return {
      records,
      summary: {
        present: records.filter(r => r.status === 'PRESENT').length,
        absent: records.filter(r => r.status === 'ABSENT').length,
        halfDay: records.filter(r => r.status === 'HALF_DAY').length,
        onLeave: records.filter(r => r.status === 'ON_LEAVE').length,
      },
    };
  }

  async getTaxSummary(employeeId: string, fy: string) {
    const declaration = await prisma.taxDeclaration.findFirst({ where: { employeeId, fy }, include: { proofs: true } });
    return declaration;
  }

  async getHolidayCalendar(employeeId: string) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { orgId: true } });
    if (!emp) return [];
    return prisma.holiday.findMany({ where: { orgId: emp.orgId, date: { gte: new Date() } }, orderBy: { date: 'asc' } });
  }

  async updateProfile(employeeId: string, data: { phone?: string; currentAddress?: string; emergencyContact?: string; emergencyPhone?: string; bloodGroup?: string }) {
    return prisma.employee.update({ where: { id: employeeId }, data });
  }

  async getMyTeam(employeeId: string, orgId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get reportees (employees who report to this employee)
    const reportees = await prisma.employee.findMany({
      where: { orgId, reportingManagerId: employeeId, status: 'ACTIVE' },
      include: { designation: { select: { name: true } }, department: { select: { name: true } } },
    });

    // Get today's attendance for each reportee
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { employeeId: { in: reportees.map(r => r.id) }, date: { gte: today, lt: tomorrow } },
    });

    const attMap: Record<string, any> = {};
    attendanceRecords.forEach(a => { attMap[a.employeeId] = a; });

    // Get employees on leave today
    const onLeave = await prisma.leaveApplication.findMany({
      where: { employeeId: { in: reportees.map(r => r.id) }, status: 'APPROVED', startDate: { lte: today }, endDate: { gte: today } },
      select: { employeeId: true },
    });
    const onLeaveIds = new Set(onLeave.map(l => l.employeeId));

    return reportees.map(r => {
      const att = attMap[r.id];
      let status = 'Absent';
      if (onLeaveIds.has(r.id)) status = 'On Leave';
      else if (att?.status === 'PRESENT') status = 'Present';
      else if (att?.status === 'HALF_DAY') status = 'Half Day';
      return {
        id: r.id, name: `${r.firstName} ${r.lastName}`, designation: r.designation?.name || '',
        department: r.department?.name || '', status,
        checkIn: att?.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
        checkOut: att?.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      };
    });
  }

  async getAnnouncements(orgId: string) {
    // Return recent notifications marked as announcements, or create sample ones
    const notifs = await prisma.notification.findMany({
      where: { user: { orgId }, type: 'IN_APP' },
      take: 20,
      orderBy: { createdAt: 'desc' },
      distinct: ['title'],
    });
    return notifs.map(n => ({ id: n.id, title: n.title, body: n.message, date: n.createdAt, category: 'Company', isRead: n.isRead }));
  }

  async getMyDocuments(employeeId: string) {
    return prisma.employeeDocument.findMany({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyRequests(userId: string) {
    return prisma.approvalRequest.findMany({
      where: { requestedById: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async raiseRequest(userId: string, employeeId: string, data: { type: string; description: string; amount?: number; metadata?: any }) {
    return prisma.approvalRequest.create({
      data: {
        module: data.type,
        recordId: employeeId,
        requestedById: userId,
        status: 'PENDING',
        requestData: data,
      },
    });
  }
}

export const essService = new ESSService();
