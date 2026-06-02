import { Router } from 'express';
import { onboardingService, offboardingService } from './onboarding.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/checklists', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await onboardingService.createChecklist(req.user.orgId, req.body.name, req.body.items);
  sendSuccess(res, result, 'Checklist created', 201);
}));
router.post('/initiate/:employeeId', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await onboardingService.initiateOnboarding(req.params.employeeId, req.body.checklistId);
  sendSuccess(res, result);
}));
router.post('/tasks/:id/complete', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await onboardingService.completeTask(req.params.id, req.user.userId);
  sendSuccess(res, result);
}));
router.get('/progress/:employeeId', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await onboardingService.getProgress(req.params.employeeId);
  sendSuccess(res, result);
}));

// Offboarding
router.post('/exit/initiate', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await offboardingService.initiateExit(req.body.employeeId, req.body);
  sendSuccess(res, result, 'Exit initiated', 201);
}));
router.post('/exit/:id/approve', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await offboardingService.approveExit(req.params.id, req.user.userId);
  sendSuccess(res, result);
}));
router.get('/exit/fnf/:employeeId', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await offboardingService.calculateFnF(req.params.employeeId);
  sendSuccess(res, result);
}));
router.post('/exit/fnf/:employeeId/process', authenticate, authorize('ORG_ADMIN', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  await offboardingService.processFnF(req.params.employeeId);
  sendSuccess(res, null, 'FnF processed');
}));
router.get('/exit/analytics', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await offboardingService.getExitAnalytics(req.user.orgId);
  sendSuccess(res, result);
}));

export default router;
