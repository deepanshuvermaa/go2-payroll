import { Router } from 'express';
import { attendanceService, geofenceService, regularizationService } from './attendance.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/check-in', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await attendanceService.checkIn(req.user.employeeId, req.body.source || 'WEB', req.body.location, req.body.selfieUrl);
  sendSuccess(res, result);
}));
router.post('/check-out', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await attendanceService.checkOut(req.user.employeeId, req.body.location);
  sendSuccess(res, result);
}));
router.post('/mark', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'), asyncHandler(async (req: any, res: any) => {
  const result = await attendanceService.markAttendance(req.body.employeeId, new Date(req.body.date), req.body.status, req.user.userId);
  sendSuccess(res, result);
}));
router.post('/bulk-mark', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await attendanceService.bulkMark(req.user.orgId, new Date(req.body.date), req.body.employeeIds, req.body.status, req.user.userId);
  sendSuccess(res, result);
}));
router.get('/date/:date', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await attendanceService.getByDate(req.user.orgId, new Date(req.params.date));
  sendSuccess(res, result);
}));
router.get('/employee/:id/monthly', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await attendanceService.getByEmployee(req.params.id, +req.query.month, +req.query.year);
  sendSuccess(res, result);
}));
router.get('/employee/:id/summary', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await attendanceService.getMonthlySummary(req.params.id, +req.query.month, +req.query.year);
  sendSuccess(res, result);
}));
router.get('/org-summary', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await attendanceService.getOrgSummary(req.user.orgId, new Date(req.query.date as string));
  sendSuccess(res, result);
}));
router.post('/auto-absent', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await attendanceService.autoMarkAbsent(req.user.orgId, new Date(req.body.date));
  sendSuccess(res, result, `Marked ${result.length} absent`);
}));
router.post('/lock', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  await attendanceService.lockAttendance(req.user.orgId, +req.body.month, +req.body.year, req.user.userId);
  sendSuccess(res, null, 'Attendance locked');
}));

// Geofence
router.post('/geofences', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await geofenceService.addGeofence(req.user.orgId, req.body.branchId, req.body);
  sendSuccess(res, result, 'Geofence created', 201);
}));
router.get('/geofences', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await geofenceService.getGeofences(req.user.orgId);
  sendSuccess(res, result);
}));
router.post('/validate-location', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await geofenceService.validateLocation(req.user.employeeId, req.body.latitude, req.body.longitude);
  sendSuccess(res, result);
}));

// Regularization
router.post('/regularization', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await regularizationService.apply(req.user.employeeId, new Date(req.body.date), req.body.status, req.body.reason);
  sendSuccess(res, result, 'Regularization applied', 201);
}));
router.post('/regularization/:id/approve', authenticate, authorize('MANAGER', 'HR_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await regularizationService.approve(req.params.id, req.user.userId);
  sendSuccess(res, result);
}));
router.post('/regularization/:id/reject', authenticate, authorize('MANAGER', 'HR_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await regularizationService.reject(req.params.id, req.user.userId, req.body.reason);
  sendSuccess(res, result);
}));
router.get('/regularization/pending', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await regularizationService.getPending(req.user.employeeId);
  sendSuccess(res, result);
}));

export default router;
