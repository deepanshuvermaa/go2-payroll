import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { NotificationService, EmailService } from '../notifications/notification.service';
const notifService = new NotificationService();
const emailService = new EmailService();

export class LeaveService {
  async apply(employeeId: string, data: { leaveTypeId: string; fromDate: string; toDate: string; reason: string; isHalfDay?: boolean; documentUrl?: string }) {
    const days = this.calculateDays(new Date(data.fromDate), new Date(data.toDate), data.isHalfDay);
    const balance = await prisma.leaveBalance.findFirst({ where: { employeeId, leaveTypeId: data.leaveTypeId, year: new Date().getFullYear() } });
    if (!balance || balance.balance < days) throw new AppError(400, 'Insufficient leave balance');

    return prisma.leaveApplication.create({
      data: { employeeId, leaveTypeId: data.leaveTypeId, fromDate: new Date(data.fromDate), toDate: new Date(data.toDate), days, reason: data.reason, isHalfDay: data.isHalfDay || false, documentUrl: data.documentUrl },
    });
  }

  async approve(applicationId: string, approverId: string) {
    const app = await prisma.leaveApplication.findUnique({ where: { id: applicationId } });
    if (!app || app.status !== 'PENDING') throw new AppError(400, 'Invalid application');

    await prisma.leaveBalance.updateMany({
      where: { employeeId: app.employeeId, leaveTypeId: app.leaveTypeId, year: app.fromDate.getFullYear() },
      data: { used: { increment: app.days }, balance: { decrement: app.days } },
    });

    // Mark attendance as ON_LEAVE for leave dates
    const dates = this.getDateRange(app.fromDate, app.toDate);
    for (const date of dates) {
      await prisma.attendanceRecord.upsert({
        where: { employeeId_date: { employeeId: app.employeeId, date } },
        create: { employeeId: app.employeeId, date, status: 'ON_LEAVE', source: 'MANUAL' },
        update: { status: 'ON_LEAVE' },
      });
    }

    const leave = await prisma.leaveApplication.update({ where: { id: applicationId }, data: { status: 'APPROVED', approverId, approvedAt: new Date() } });

    // Notify employee of leave approval
    try {
      const emp = await prisma.employee.findUnique({ where: { id: leave.employeeId }, include: { user: true } });
      if (emp?.user?.email) {
        await emailService.send(emp.user.email, 'Leave Request Approved', `<p>Dear ${emp.firstName},</p><p>Your leave request from ${leave.fromDate.toLocaleDateString()} to ${leave.toDate.toLocaleDateString()} has been <strong>approved</strong>.</p><p>Regards,<br>HR Team</p>`);
      }
      if (emp?.userId) {
        await notifService.send(emp.userId, 'IN_APP', 'Leave Approved ✓', `Your leave from ${leave.fromDate.toLocaleDateString()} to ${leave.toDate.toLocaleDateString()} has been approved.`);
      }
    } catch (notifErr) { console.error('Notification failed:', notifErr); }

    return leave;
  }

  async reject(applicationId: string, approverId: string, reason: string) {
    const leave = await prisma.leaveApplication.update({ where: { id: applicationId }, data: { status: 'REJECTED', approverId, approverRemarks: reason } });

    // Notify employee of rejection
    try {
      const emp = await prisma.employee.findUnique({ where: { id: leave.employeeId }, include: { user: true } });
      if (emp?.user?.email) {
        await emailService.send(emp.user.email, 'Leave Request Update', `<p>Dear ${emp.firstName},</p><p>Your leave request from ${leave.fromDate.toLocaleDateString()} to ${leave.toDate.toLocaleDateString()} has been <strong>rejected</strong>.</p><p>Reason: ${reason || 'Not specified'}</p><p>If you have questions, please contact HR.</p><p>Regards,<br>HR Team</p>`);
      }
      if (emp?.userId) {
        await notifService.send(emp.userId, 'IN_APP', 'Leave Request Update', `Your leave request from ${leave.fromDate.toLocaleDateString()} to ${leave.toDate.toLocaleDateString()} was not approved. Reason: ${reason || 'Not specified'}`);
      }
    } catch (notifErr) { console.error('Reject notification failed:', notifErr); }

    return leave;
  }

  async cancel(applicationId: string, employeeId: string) {
    const app = await prisma.leaveApplication.findUnique({ where: { id: applicationId } });
    if (!app || app.employeeId !== employeeId) throw new AppError(403, 'Not authorized');
    if (app.status === 'APPROVED') {
      await prisma.leaveBalance.updateMany({
        where: { employeeId, leaveTypeId: app.leaveTypeId, year: app.fromDate.getFullYear() },
        data: { used: { decrement: app.days }, balance: { increment: app.days } },
      });
    }
    return prisma.leaveApplication.update({ where: { id: applicationId }, data: { status: 'CANCELLED' } });
  }

  async getBalance(employeeId: string, year?: number) {
    return prisma.leaveBalance.findMany({
      where: { employeeId, year: year || new Date().getFullYear() },
      include: { leaveType: { select: { name: true, code: true } } },
    });
  }

  async getCalendar(orgId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return prisma.leaveApplication.findMany({
      where: { employee: { orgId }, status: 'APPROVED', fromDate: { lte: end }, toDate: { gte: start } },
      include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } }, leaveType: { select: { name: true } } },
    });
  }

  async getTeamLeaves(managerId: string, month: number, year: number) {
    const reportees = await prisma.employee.findMany({ where: { reportingManagerId: managerId }, select: { id: true } });
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return prisma.leaveApplication.findMany({
      where: { employeeId: { in: reportees.map(r => r.id) }, status: 'APPROVED', fromDate: { lte: end }, toDate: { gte: start } },
      include: { employee: { select: { firstName: true, lastName: true } }, leaveType: { select: { name: true } } },
    });
  }

  async checkConflict(employeeId: string, fromDate: string, toDate: string) {
    const existing = await prisma.leaveApplication.findMany({
      where: { employeeId, status: { in: ['PENDING', 'APPROVED'] }, fromDate: { lte: new Date(toDate) }, toDate: { gte: new Date(fromDate) } },
    });
    return { hasConflict: existing.length > 0, existingLeaves: existing };
  }

  private calculateDays(from: Date, to: Date, isHalfDay?: boolean): number {
    if (isHalfDay) return 0.5;
    let days = 0;
    const current = new Date(from);
    while (current <= to) {
      const day = current.getDay();
      if (day !== 0) days++; // Skip Sundays
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  private getDateRange(from: Date, to: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(from);
    while (current <= to) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }
}

export class LeaveAccrualService {
  async runMonthlyAccrual(orgId: string, month: number, year: number) {
    const employees = await prisma.employee.findMany({ where: { orgId, status: 'ACTIVE' }, select: { id: true } });
    const leaveTypes = await prisma.leaveType.findMany({ where: { orgId, isActive: true } });

    for (const emp of employees) {
      for (const lt of leaveTypes) {
        const monthly = lt.daysPerYear / 12;
        await prisma.leaveBalance.upsert({
          where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: lt.id, year } },
          create: { employeeId: emp.id, leaveTypeId: lt.id, year, accrued: monthly, balance: monthly },
          update: { accrued: { increment: monthly }, balance: { increment: monthly } },
        });
      }
    }
    await prisma.leaveAccrualLog.create({ data: { orgId, month, year, processedCount: employees.length } });
    return { processed: employees.length };
  }

  async runAnnualReset(orgId: string, year: number) {
    const balances = await prisma.leaveBalance.findMany({
      where: { employee: { orgId }, year: year - 1 },
      include: { leaveType: true },
    });

    for (const bal of balances) {
      const carryForward = Math.min(bal.balance, bal.leaveType.carryForwardMax);
      await prisma.leaveBalance.upsert({
        where: { employeeId_leaveTypeId_year: { employeeId: bal.employeeId, leaveTypeId: bal.leaveTypeId, year } },
        create: { employeeId: bal.employeeId, leaveTypeId: bal.leaveTypeId, year, opening: carryForward, carriedForward: carryForward, balance: carryForward },
        update: { opening: carryForward, carriedForward: carryForward, balance: { increment: carryForward } },
      });
    }
  }
}

export class LeaveEncashmentService {
  async calculate(employeeId: string, leaveTypeId: string, days: number) {
    const structure = await prisma.employeeSalaryStructure.findFirst({ where: { employeeId, isActive: true } });
    if (!structure) throw new AppError(400, 'No salary structure found');
    const dailySalary = (structure.grossSalary / 30);
    return { days, dailyRate: dailySalary, amount: Math.round(dailySalary * days) };
  }

  async process(employeeId: string, leaveTypeId: string, days: number) {
    const calc = await this.calculate(employeeId, leaveTypeId, days);
    await prisma.leaveBalance.updateMany({
      where: { employeeId, leaveTypeId, year: new Date().getFullYear() },
      data: { encashed: { increment: days }, balance: { decrement: days } },
    });
    return calc;
  }
}

export class CompOffService {
  async credit(employeeId: string, workedDate: Date, reason: string, days: number = 1) {
    return prisma.compOff.create({ data: { employeeId, workedDate, reason, days, expiryDate: new Date(Date.now() + 90 * 86400000) } });
  }

  async approve(compOffId: string, approverId: string) {
    return prisma.compOff.update({ where: { id: compOffId }, data: { status: 'APPROVED', approverId } });
  }

  async getBalance(employeeId: string) {
    const compOffs = await prisma.compOff.findMany({ where: { employeeId, status: 'APPROVED', usedDate: null, expiryDate: { gte: new Date() } } });
    return { available: compOffs.reduce((sum, c) => sum + c.days, 0), records: compOffs };
  }

  async expireOld(orgId: string) {
    return prisma.compOff.updateMany({
      where: { employee: { orgId }, status: 'APPROVED', usedDate: null, expiryDate: { lt: new Date() } },
      data: { status: 'REJECTED' },
    });
  }
}

export const leaveService = new LeaveService();
export const leaveAccrualService = new LeaveAccrualService();
export const leaveEncashmentService = new LeaveEncashmentService();
export const compOffService = new CompOffService();
