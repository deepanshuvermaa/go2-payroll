import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class OnboardingService {
  async createChecklist(orgId: string, name: string, items: string[]) {
    return prisma.onboardingChecklist.create({ data: { orgId, name, items } });
  }

  async initiateOnboarding(employeeId: string, checklistId: string) {
    const checklist = await prisma.onboardingChecklist.findUnique({ where: { id: checklistId } });
    if (!checklist) throw new AppError(404, 'Checklist not found');

    const items = checklist.items as string[];
    const tasks = items.map(item => prisma.onboardingTask.create({ data: { employeeId, checklistId, taskName: item } }));
    return prisma.$transaction(tasks);
  }

  async completeTask(taskId: string, completedBy: string) {
    return prisma.onboardingTask.update({ where: { id: taskId }, data: { status: 'COMPLETED', completedBy, completedAt: new Date() } });
  }

  async getProgress(employeeId: string) {
    const tasks = await prisma.onboardingTask.findMany({ where: { employeeId } });
    return { total: tasks.length, completed: tasks.filter(t => t.status === 'COMPLETED').length, pending: tasks.filter(t => t.status === 'PENDING').length, overdue: tasks.filter(t => t.status === 'OVERDUE').length, tasks };
  }
}

export class OffboardingService {
  async initiateExit(employeeId: string, data: { resignationDate: string; lastWorkingDate: string; reason: string }) {
    await prisma.employee.update({ where: { id: employeeId }, data: { status: 'ON_NOTICE' } });
    return prisma.exitRequest.create({ data: { employeeId, resignationDate: new Date(data.resignationDate), lastWorkingDate: new Date(data.lastWorkingDate), reason: data.reason } });
  }

  async approveExit(exitRequestId: string, approverId: string) {
    return prisma.exitRequest.update({ where: { id: exitRequestId }, data: { status: 'APPROVED', approverId } });
  }

  async calculateFnF(employeeId: string) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    const structure = await prisma.employeeSalaryStructure.findFirst({ where: { employeeId, isActive: true } });
    const exit = await prisma.exitRequest.findUnique({ where: { employeeId } });
    if (!emp || !structure || !exit) throw new AppError(400, 'Missing data for FnF');

    const dailySalary = structure.grossSalary / 30;
    const lastDay = exit.lastWorkingDate;
    const daysWorked = lastDay.getDate();
    const basicDues = Math.round(dailySalary * daysWorked);

    // Leave encashment
    const balances = await prisma.leaveBalance.findMany({ where: { employeeId, year: new Date().getFullYear() }, include: { leaveType: true } });
    const encashable = balances.filter(b => b.leaveType.encashable);
    const leaveEncashment = Math.round(encashable.reduce((s, b) => s + b.balance, 0) * dailySalary);

    // Gratuity
    const years = (Date.now() - emp.dateOfJoining.getTime()) / (365.25 * 86400000);
    const basic = (structure.breakdown as any)?.earnings?.basic || structure.grossSalary * 0.4;
    const gratuity = years >= 5 ? Math.round(basic * 15 * Math.floor(years) / 26) : 0;

    // Notice pay
    const noticeDays = emp.noticePeriodDays;
    const servedDays = Math.round((lastDay.getTime() - exit.resignationDate.getTime()) / 86400000);
    const noticePay = servedDays < noticeDays ? -Math.round((noticeDays - servedDays) * dailySalary) : 0;

    // Pending loans/advances
    const loans = await prisma.loan.findMany({ where: { employeeId, isActive: true } });
    const advances = await prisma.advance.findMany({ where: { employeeId, isActive: true } });
    const loanDeduction = loans.reduce((s, l) => s + l.outstanding, 0);
    const advanceDeduction = advances.reduce((s, a) => s + (a.amount - a.recoveredAmount), 0);

    const netPayable = basicDues + leaveEncashment + gratuity + noticePay - loanDeduction - advanceDeduction;

    const breakdown = { basicDues, leaveEncashment, gratuity, noticePay, loanDeduction, advanceDeduction, netPayable };
    await prisma.exitRequest.update({ where: { employeeId }, data: { fnfAmount: netPayable, fnfBreakdown: breakdown, status: 'FNF_CALCULATED' } });
    return breakdown;
  }

  async processFnF(employeeId: string) {
    await prisma.employee.update({ where: { id: employeeId }, data: { status: 'EXITED', dateOfExit: new Date() } });
    await prisma.exitRequest.update({ where: { employeeId }, data: { status: 'FNF_PROCESSED', fnfProcessedAt: new Date() } });
    // Deactivate user
    const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { userId: true } });
    if (emp?.userId) await prisma.user.update({ where: { id: emp.userId }, data: { isActive: false } });
  }

  async getExitAnalytics(orgId: string) {
    const exits = await prisma.exitRequest.findMany({ where: { employee: { orgId } }, include: { employee: { select: { departmentId: true } } } });
    const reasons = exits.reduce((acc: any, e) => { acc[e.reason] = (acc[e.reason] || 0) + 1; return acc; }, {});
    return { total: exits.length, reasons };
  }
}

export const onboardingService = new OnboardingService();
export const offboardingService = new OffboardingService();
