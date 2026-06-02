import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class ApprovalWorkflowService {
  async createWorkflow(orgId: string, data: { module: string; name: string; levels: any[]; conditions?: any[] }) {
    return prisma.approvalWorkflow.create({ data: { orgId, module: data.module, name: data.name, levels: data.levels, conditions: data.conditions } });
  }

  async getWorkflows(orgId: string) {
    return prisma.approvalWorkflow.findMany({ where: { orgId, isActive: true } });
  }

  async triggerApproval(module: string, recordId: string, employeeId: string, orgId: string) {
    const workflow = await prisma.approvalWorkflow.findFirst({ where: { orgId, module, isActive: true } });
    if (!workflow) return null; // No workflow configured, auto-approve

    return prisma.approvalRequest.create({ data: { workflowId: workflow.id, module, recordId, employeeId } });
  }

  async processAction(requestId: string, approverId: string, action: 'APPROVED' | 'REJECTED', comments?: string) {
    const request = await prisma.approvalRequest.findUnique({ where: { id: requestId }, include: { workflow: true } });
    if (!request) throw new AppError(404, 'Request not found');

    await prisma.approvalAction.create({ data: { requestId, level: request.currentLevel, approverId, action, comments } });

    const levels = request.workflow.levels as any[];
    if (action === 'REJECTED') {
      return prisma.approvalRequest.update({ where: { id: requestId }, data: { status: 'REJECTED' } });
    }

    if (request.currentLevel >= levels.length) {
      return prisma.approvalRequest.update({ where: { id: requestId }, data: { status: 'APPROVED' } });
    }

    return prisma.approvalRequest.update({ where: { id: requestId }, data: { currentLevel: { increment: 1 } } });
  }

  async getPendingForUser(userId: string) {
    return prisma.approvalRequest.findMany({
      where: { status: 'PENDING' },
      include: { workflow: { select: { name: true, module: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHistory(module: string, recordId: string) {
    return prisma.approvalRequest.findFirst({
      where: { module, recordId },
      include: { actions: { include: { approver: { select: { email: true } } }, orderBy: { actedAt: 'asc' } } },
    });
  }

  async delegate(approverId: string, delegateId: string, fromDate: Date, toDate: Date) {
    // Store delegation info (simplified - in production would be a separate table)
    return { approverId, delegateId, fromDate, toDate, active: true };
  }
}

export const approvalWorkflowService = new ApprovalWorkflowService();
