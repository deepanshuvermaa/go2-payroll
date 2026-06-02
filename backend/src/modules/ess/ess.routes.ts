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

// My team (reportees with attendance status today)
router.get('/my-team', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await essService.getMyTeam(req.user.employeeId, req.user.orgId);
  sendSuccess(res, result);
}));

// Announcements
router.get('/announcements', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await essService.getAnnouncements(req.user.orgId);
  sendSuccess(res, result);
}));

// My documents
router.get('/documents', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await essService.getMyDocuments(req.user.employeeId);
  sendSuccess(res, result);
}));

// My requests
router.get('/my-requests', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await essService.getMyRequests(req.user.userId);
  sendSuccess(res, result);
}));

// Raise a request
router.post('/requests', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await essService.raiseRequest(req.user.userId, req.user.employeeId, req.body);
  sendSuccess(res, result, 'Request raised', 201);
}));

export default router;
