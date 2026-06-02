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
}

export const essService = new ESSService();
