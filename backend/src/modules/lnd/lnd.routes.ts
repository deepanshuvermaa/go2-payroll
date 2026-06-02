import { Router } from 'express';
import { lndService } from './lnd.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// ── Trainings ──────────────────────────────────────────────────────────────

// GET /trainings — list all trainings for org with enrollment counts
router.get(
  '/trainings',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const result = await lndService.getTrainings(req.user.orgId);
    sendSuccess(res, result);
  }),
);

// GET /trainings/mine — get current employee's enrollments with training details
// Must be declared BEFORE /trainings/:id/enroll to avoid "mine" being parsed as an id
router.get(
  '/trainings/mine',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const result = await lndService.getMyTrainings(req.user.employeeId);
    sendSuccess(res, result);
  }),
);

// POST /trainings/:id/enroll — enroll current employee into a training
router.post(
  '/trainings/:id/enroll',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const result = await lndService.enrollTraining(req.params.id, req.user.employeeId);
    sendSuccess(res, result, 'Enrolled successfully', 201);
  }),
);

// POST /trainings/:id/complete — mark enrollment as completed
router.post(
  '/trainings/:id/complete',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const result = await lndService.completeTraining(req.params.id, req.user.employeeId);
    sendSuccess(res, result, 'Training marked as completed');
  }),
);

// ── Assessments ────────────────────────────────────────────────────────────

// GET /assessments — list all assessments for org
router.get(
  '/assessments',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const result = await lndService.getAssessments(req.user.orgId);
    sendSuccess(res, result);
  }),
);

// POST /assessments/:id/start — create a new in-progress attempt
router.post(
  '/assessments/:id/start',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const result = await lndService.startAssessment(req.params.id, req.user.employeeId);
    sendSuccess(res, result, 'Assessment started', 201);
  }),
);

// POST /attempts/:id/submit — submit answers and score for an attempt
router.post(
  '/attempts/:id/submit',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { answers, score } = req.body;
    const result = await lndService.submitAssessment(req.params.id, answers, Number(score));
    sendSuccess(res, result, 'Assessment submitted');
  }),
);

// ── Certificates ───────────────────────────────────────────────────────────

// GET /certificates/mine — list current employee's certificates with expiry info
// Must be declared BEFORE /certificates (POST) so it doesn't conflict
router.get(
  '/certificates/mine',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const result = await lndService.getMyCertificates(req.user.employeeId);
    sendSuccess(res, result);
  }),
);

// GET /certificates/expiring — get certs expiring within N days (admin/HR only)
router.get(
  '/certificates/expiring',
  authenticate,
  authorize('ORG_ADMIN', 'HR_MANAGER'),
  asyncHandler(async (req: any, res: any) => {
    const days = req.query.days ? Number(req.query.days) : 30;
    const result = await lndService.getExpiringCertificates(req.user.orgId, days);
    sendSuccess(res, result);
  }),
);

// POST /certificates — add a certificate for current employee
router.post(
  '/certificates',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const result = await lndService.addCertificate(
      req.user.employeeId,
      req.user.orgId,
      req.body,
    );
    sendSuccess(res, result, 'Certificate added', 201);
  }),
);

export default router;
