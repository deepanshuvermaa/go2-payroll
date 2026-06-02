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

// Standup logs (simple in-memory/DB via Notification model reuse as workaround)
// Store standup notes as a JSON in a notification record keyed by employee+date
router.get('/standup', authenticate, asyncHandler(async (req: any, res: any) => {
  const prisma = (await import('../../config/database')).default;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const logs = await prisma.notification.findMany({
    where: { userId: req.user.userId, title: 'STANDUP_LOG', createdAt: { gte: today } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  sendSuccess(res, logs.map(l => ({ employeeId: req.user.employeeId, note: l.message, date: l.createdAt })));
}));

router.post('/standup', authenticate, asyncHandler(async (req: any, res: any) => {
  const prisma = (await import('../../config/database')).default;
  const { note } = req.body;
  const log = await prisma.notification.create({
    data: { userId: req.user.userId, type: 'IN_APP', title: 'STANDUP_LOG', message: note || '' },
  });
  sendSuccess(res, { employeeId: req.user.employeeId, note: log.message, date: log.createdAt }, 'Standup logged', 201);
}));

export default router;
