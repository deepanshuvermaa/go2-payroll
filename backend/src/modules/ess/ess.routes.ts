import { Router } from 'express';
import { essService } from './ess.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await essService.getDashboard(req.user.employeeId);
  sendSuccess(res, result);
}));
router.get('/payslips', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await essService.getPayslips(req.user.employeeId, req.query.year ? +req.query.year : undefined);
  sendSuccess(res, result);
}));
router.get('/attendance', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await essService.getAttendanceSummary(req.user.employeeId, +req.query.month, +req.query.year);
  sendSuccess(res, result);
}));
router.get('/tax-summary', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await essService.getTaxSummary(req.user.employeeId, req.query.fy as string);
  sendSuccess(res, result);
}));
router.get('/holidays', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await essService.getHolidayCalendar(req.user.employeeId);
  sendSuccess(res, result);
}));
router.put('/profile', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await essService.updateProfile(req.user.employeeId, req.body);
  sendSuccess(res, result);
}));

export default router;
