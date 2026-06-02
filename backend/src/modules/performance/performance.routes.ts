import { Router } from 'express';
import { performanceService, goalService, okrService } from './performance.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Cycles
router.post('/cycles', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await performanceService.createCycle(req.user.orgId, req.body);
  sendSuccess(res, result, 'Cycle created', 201);
}));
router.post('/cycles/:id/initialize', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await performanceService.initializeReviews(req.params.id);
  sendSuccess(res, result);
}));
router.get('/cycles/:id/status', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await performanceService.getReviewStatus(req.params.id);
  sendSuccess(res, result);
}));

// Reviews
router.post('/reviews/:id/self', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await performanceService.submitSelfReview(req.params.id, +req.body.rating, req.body.comments);
  sendSuccess(res, result);
}));
router.post('/reviews/:id/manager', authenticate, authorize('MANAGER', 'HR_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await performanceService.submitManagerReview(req.params.id, +req.body.rating, req.body.comments, +req.body.finalRating);
  sendSuccess(res, result);
}));
router.get('/reviews/team/:cycleId', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await performanceService.getTeamReviews(req.user.employeeId, req.params.cycleId);
  sendSuccess(res, result);
}));

// Goals
router.post('/goals', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await goalService.create(req.user.employeeId, req.body);
  sendSuccess(res, result, 'Goal created', 201);
}));
router.put('/goals/:id', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await goalService.update(req.params.id, +req.body.progress);
  sendSuccess(res, result);
}));
router.get('/goals', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await goalService.getByEmployee(req.user.employeeId);
  sendSuccess(res, result);
}));

// OKRs
router.post('/okrs', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await okrService.createObjective(req.user.employeeId, +req.body.quarter, +req.body.year, req.body.objective);
  sendSuccess(res, result, 'OKR created', 201);
}));
router.post('/okrs/:id/key-results', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await okrService.addKeyResult(req.params.id, req.body.title, +req.body.targetValue, req.body.unit);
  sendSuccess(res, result, 'Key result added', 201);
}));
router.put('/okrs/key-results/:id', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await okrService.updateProgress(req.params.id, +req.body.currentValue);
  sendSuccess(res, result);
}));
router.get('/okrs', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await okrService.getByQuarter(req.user.orgId, +req.query.quarter, +req.query.year);
  sendSuccess(res, result);
}));

export default router;
