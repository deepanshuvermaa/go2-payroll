import { Router } from 'express';
import { leaveService, leaveAccrualService, leaveEncashmentService, compOffService } from './leave.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/apply', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await leaveService.apply(req.user.employeeId, req.body);
  sendSuccess(res, result, 'Leave applied', 201);
}));
router.post('/:id/approve', authenticate, authorize('MANAGER', 'HR_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await leaveService.approve(req.params.id, req.user.userId);
  sendSuccess(res, result);
}));
router.post('/:id/reject', authenticate, authorize('MANAGER', 'HR_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await leaveService.reject(req.params.id, req.user.userId, req.body.reason);
  sendSuccess(res, result);
}));
router.post('/:id/cancel', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await leaveService.cancel(req.params.id, req.user.employeeId);
  sendSuccess(res, result);
}));
router.get('/balance', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await leaveService.getBalance(req.user.employeeId, req.query.year ? +req.query.year : undefined);
  sendSuccess(res, result);
}));
router.get('/balance/:employeeId', authenticate, authorize('HR_MANAGER', 'ORG_ADMIN', 'MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await leaveService.getBalance(req.params.employeeId, req.query.year ? +req.query.year : undefined);
  sendSuccess(res, result);
}));
router.get('/calendar', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await leaveService.getCalendar(req.user.orgId, +req.query.month, +req.query.year);
  sendSuccess(res, result);
}));
router.get('/team', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await leaveService.getTeamLeaves(req.user.employeeId, +req.query.month, +req.query.year);
  sendSuccess(res, result);
}));
router.get('/check-conflict', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await leaveService.checkConflict(req.user.employeeId, req.query.fromDate as string, req.query.toDate as string);
  sendSuccess(res, result);
}));

// Accrual
router.post('/accrual/run', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await leaveAccrualService.runMonthlyAccrual(req.user.orgId, +req.body.month, +req.body.year);
  sendSuccess(res, result);
}));
router.post('/accrual/reset', authenticate, authorize('ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  await leaveAccrualService.runAnnualReset(req.user.orgId, +req.body.year);
  sendSuccess(res, null, 'Annual reset completed');
}));

// Encashment
router.post('/encashment/calculate', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await leaveEncashmentService.calculate(req.user.employeeId, req.body.leaveTypeId, +req.body.days);
  sendSuccess(res, result);
}));
router.post('/encashment/process', authenticate, authorize('HR_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await leaveEncashmentService.process(req.body.employeeId, req.body.leaveTypeId, +req.body.days);
  sendSuccess(res, result);
}));

// Comp-Off
router.post('/comp-off/credit', authenticate, authorize('MANAGER', 'HR_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await compOffService.credit(req.body.employeeId, new Date(req.body.workedDate), req.body.reason, req.body.days);
  sendSuccess(res, result, 'Comp-off credited', 201);
}));
router.post('/comp-off/:id/approve', authenticate, authorize('MANAGER', 'HR_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await compOffService.approve(req.params.id, req.user.userId);
  sendSuccess(res, result);
}));
router.get('/comp-off/balance', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await compOffService.getBalance(req.user.employeeId);
  sendSuccess(res, result);
}));

export default router;
