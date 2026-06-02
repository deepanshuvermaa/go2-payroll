import { Router } from 'express';
import { aiService, automationService } from './ai.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/anomalies/:payrollRunId', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await aiService.detectPayrollAnomalies(req.params.payrollRunId);
  sendSuccess(res, result);
}));
router.get('/attrition-risk', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await aiService.predictAttrition(req.user.orgId);
  sendSuccess(res, result);
}));
router.post('/chatbot', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await aiService.chatbot(req.user.employeeId, req.body.query);
  sendSuccess(res, result);
}));
router.post('/automation/run', authenticate, authorize('ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await automationService.runScheduledJobs(req.user.orgId);
  sendSuccess(res, result);
}));

export default router;
