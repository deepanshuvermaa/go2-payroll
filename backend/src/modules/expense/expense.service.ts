import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class ExpenseService {
  async createReport(employeeId: string, data: { title: string; fromDate: string; toDate: string }) {
    return prisma.expenseReport.create({ data: { employeeId, title: data.title, fromDate: new Date(data.fromDate), toDate: new Date(data.toDate) } });
  }

  async addItem(reportId: string, data: { category: string; description: string; amount: number; date: string; receiptUrl?: string; merchant?: string }) {
    const item = await prisma.expenseItem.create({ data: { reportId, ...data, date: new Date(data.date) } });
    await prisma.expenseReport.update({ where: { id: reportId }, data: { totalAmount: { increment: data.amount } } });
    return item;
  }

  async submitReport(reportId: string) {
    return prisma.expenseReport.update({ where: { id: reportId }, data: { status: 'SUBMITTED' } });
  }

  async approveReport(reportId: string, approverId: string) {
    return prisma.expenseReport.update({ where: { id: reportId }, data: { status: 'APPROVED', approverId, approvedAt: new Date() } });
  }

  async rejectReport(reportId: string, approverId: string) {
    return prisma.expenseReport.update({ where: { id: reportId }, data: { status: 'REJECTED', approverId } });
  }

  async getByEmployee(employeeId: string) {
    return prisma.expenseReport.findMany({ where: { employeeId }, include: { items: true }, orderBy: { createdAt: 'desc' } });
  }

  async getPendingApprovals(orgId: string) {
    return prisma.expenseReport.findMany({ where: { status: 'SUBMITTED', employee: { orgId } }, include: { employee: { select: { firstName: true, lastName: true } }, items: true } });
  }

  async getAnalytics(orgId: string) {
    const reports = await prisma.expenseReport.findMany({ where: { employee: { orgId }, status: 'APPROVED' }, include: { items: true } });
    const byCategory: Record<string, number> = {};
    for (const r of reports) {
      for (const item of r.items) {
        byCategory[item.category] = (byCategory[item.category] || 0) + item.amount;
      }
    }
    return { totalSpent: reports.reduce((s, r) => s + r.totalAmount, 0), reportCount: reports.length, byCategory };
  }
}

export class ExpensePolicyService {
  async create(orgId: string, data: any) {
    return prisma.expensePolicy.create({ data: { ...data, orgId } });
  }

  async validate(employeeId: string, category: string, amount: number) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { orgId: true } });
    if (!emp) throw new AppError(404, 'Employee not found');
    const policy = await prisma.expensePolicy.findFirst({ where: { orgId: emp.orgId, category, isActive: true } });
    if (!policy) return { valid: true, violations: [] };
    const violations: string[] = [];
    if (policy.maxAmount && amount > policy.maxAmount) violations.push(`Exceeds max amount ₹${policy.maxAmount}`);
    return { valid: violations.length === 0, violations, policy };
  }
}

export const expenseService = new ExpenseService();
export const expensePolicyService = new ExpensePolicyService();
