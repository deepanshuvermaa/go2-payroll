import { Router } from 'express';
import { recruitmentService } from './recruitment.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/jobs', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await recruitmentService.createJobPosting(req.user.orgId, req.body);
  sendSuccess(res, result, 'Job posted', 201);
}));
router.post('/jobs/:id/publish', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await recruitmentService.publishJob(req.params.id);
  sendSuccess(res, result);
}));
router.post('/candidates', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'), asyncHandler(async (req: any, res: any) => {
  const result = await recruitmentService.addCandidate(req.body.jobId, req.body);
  sendSuccess(res, result, 'Candidate added', 201);
}));
router.post('/candidates/:id/move', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'), asyncHandler(async (req: any, res: any) => {
  const result = await recruitmentService.moveStage(req.params.id, req.body.stage);
  sendSuccess(res, result);
}));
router.post('/interviews', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'), asyncHandler(async (req: any, res: any) => {
  const result = await recruitmentService.scheduleInterview(req.body.candidateId, +req.body.round, req.body.interviewerId, new Date(req.body.scheduledAt));
  sendSuccess(res, result, 'Interview scheduled', 201);
}));
router.post('/interviews/:id/feedback', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await recruitmentService.submitFeedback(req.params.id, +req.body.rating, req.body.feedback);
  sendSuccess(res, result);
}));
router.get('/pipeline', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await recruitmentService.getHiringPipeline(req.user.orgId);
  sendSuccess(res, result);
}));
router.post('/candidates/:id/convert', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await recruitmentService.convertToEmployee(req.params.id, req.user.orgId);
  sendSuccess(res, result, 'Employee created from candidate', 201);
}));

export default router;
