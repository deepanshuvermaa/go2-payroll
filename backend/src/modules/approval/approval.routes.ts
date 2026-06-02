import { Router } from 'express';
import { approvalWorkflowService } from './approval.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/workflows', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await approvalWorkflowService.createWorkflow(req.user.orgId, req.body);
  sendSuccess(res, result, 'Workflow created', 201);
}));
router.get('/workflows', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await approvalWorkflowService.getWorkflows(req.user.orgId);
  sendSuccess(res, result);
}));
router.post('/trigger', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await approvalWorkflowService.triggerApproval(req.body.module, req.body.recordId, req.user.employeeId, req.user.orgId);
  sendSuccess(res, result);
}));
router.post('/:id/action', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await approvalWorkflowService.processAction(req.params.id, req.user.userId, req.body.action, req.body.comments);
  sendSuccess(res, result);
}));
router.get('/pending', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await approvalWorkflowService.getPendingForUser(req.user.userId);
  sendSuccess(res, result);
}));
router.get('/history/:module/:recordId', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await approvalWorkflowService.getHistory(req.params.module, req.params.recordId);
  sendSuccess(res, result);
}));

export default router;
