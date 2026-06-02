import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class PerformanceService {
  async createCycle(orgId: string, data: { name: string; type: string; startDate: string; endDate: string }) {
    return prisma.performanceCycle.create({ data: { orgId, name: data.name, type: data.type, startDate: new Date(data.startDate), endDate: new Date(data.endDate) } });
  }

  async initializeReviews(cycleId: string) {
    const cycle = await prisma.performanceCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) throw new AppError(404, 'Cycle not found');
    const employees = await prisma.employee.findMany({ where: { orgId: cycle.orgId, status: 'ACTIVE' }, select: { id: true, reportingManagerId: true } });
    const ops = employees.map(e => prisma.performanceReview.create({ data: { cycleId, employeeId: e.id, managerId: e.reportingManagerId } }));
    return prisma.$transaction(ops);
  }

  async submitSelfReview(reviewId: string, rating: number, comments: string) {
    return prisma.performanceReview.update({ where: { id: reviewId }, data: { selfRating: rating, selfComments: comments, status: 'MANAGER_REVIEW' } });
  }

  async submitManagerReview(reviewId: string, rating: number, comments: string, finalRating: number) {
    return prisma.performanceReview.update({ where: { id: reviewId }, data: { managerRating: rating, managerComments: comments, finalRating, status: 'COMPLETED', completedAt: new Date() } });
  }

  async getReviewStatus(cycleId: string) {
    const reviews = await prisma.performanceReview.findMany({ where: { cycleId } });
    return { total: reviews.length, notStarted: reviews.filter(r => r.status === 'NOT_STARTED').length, selfDone: reviews.filter(r => r.status !== 'NOT_STARTED').length, completed: reviews.filter(r => r.status === 'COMPLETED').length };
  }

  async getTeamReviews(managerId: string, cycleId: string) {
    return prisma.performanceReview.findMany({ where: { cycleId, managerId }, include: { employee: { select: { firstName: true, lastName: true, employeeCode: true } } } });
  }
}

export class GoalService {
  async create(employeeId: string, data: { title: string; description?: string; targetDate?: string; weight?: number }) {
    return prisma.goal.create({ data: { employeeId, title: data.title, description: data.description, targetDate: data.targetDate ? new Date(data.targetDate) : undefined, weight: data.weight } });
  }

  async update(goalId: string, progress: number) {
    return prisma.goal.update({ where: { id: goalId }, data: { progress, status: progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS' } });
  }

  async getByEmployee(employeeId: string) {
    return prisma.goal.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
  }
}

export class OKRService {
  async createObjective(employeeId: string, quarter: number, year: number, objective: string) {
    return prisma.oKR.create({ data: { employeeId, quarter, year, objective } });
  }

  async addKeyResult(okrId: string, title: string, targetValue: number, unit: string) {
    return prisma.keyResult.create({ data: { okrId, title, targetValue, unit } });
  }

  async updateProgress(keyResultId: string, currentValue: number) {
    const kr = await prisma.keyResult.update({ where: { id: keyResultId }, data: { currentValue } });
    // Update OKR progress
    const allKRs = await prisma.keyResult.findMany({ where: { okrId: kr.okrId } });
    const progress = allKRs.reduce((s, k) => s + (k.currentValue / k.targetValue) * 100, 0) / allKRs.length;
    await prisma.oKR.update({ where: { id: kr.okrId }, data: { progress: Math.min(100, Math.round(progress)) } });
    return kr;
  }

  async getByQuarter(orgId: string, quarter: number, year: number) {
    return prisma.oKR.findMany({ where: { employee: { orgId }, quarter, year }, include: { keyResults: true, employee: { select: { firstName: true, lastName: true } } } });
  }
}

export const performanceService = new PerformanceService();
export const goalService = new GoalService();
export const okrService = new OKRService();
