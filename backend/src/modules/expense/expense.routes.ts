import { Router } from 'express';
import { expenseService, expensePolicyService } from './expense.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/reports', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await expenseService.createReport(req.user.employeeId, req.body);
  sendSuccess(res, result, 'Report created', 201);
}));
router.post('/reports/:id/items', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await expenseService.addItem(req.params.id, req.body);
  sendSuccess(res, result, 'Item added', 201);
}));
router.post('/reports/:id/submit', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await expenseService.submitReport(req.params.id);
  sendSuccess(res, result);
}));
router.post('/reports/:id/approve', authenticate, authorize('MANAGER', 'HR_MANAGER', 'FINANCE_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await expenseService.approveReport(req.params.id, req.user.userId);
  sendSuccess(res, result);
}));
router.post('/reports/:id/reject', authenticate, authorize('MANAGER', 'HR_MANAGER', 'FINANCE_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await expenseService.rejectReport(req.params.id, req.user.userId);
  sendSuccess(res, result);
}));
router.get('/my-reports', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await expenseService.getByEmployee(req.user.employeeId);
  sendSuccess(res, result);
}));
router.get('/pending', authenticate, authorize('MANAGER', 'HR_MANAGER', 'FINANCE_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await expenseService.getPendingApprovals(req.user.orgId);
  sendSuccess(res, result);
}));
router.get('/analytics', authenticate, authorize('ORG_ADMIN', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await expenseService.getAnalytics(req.user.orgId);
  sendSuccess(res, result);
}));

// Policies
router.post('/policies', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await expensePolicyService.create(req.user.orgId, req.body);
  sendSuccess(res, result, 'Policy created', 201);
}));
router.post('/validate', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await expensePolicyService.validate(req.user.employeeId, req.body.category, +req.body.amount);
  sendSuccess(res, result);
}));

export default router;
