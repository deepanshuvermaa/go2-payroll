import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import {
  submitPulse,
  getPulseTrend,
  giveKudos,
  getKudosFeed,
  getLeaderboard,
  getENPS,
  submitENPS,
  getMoodHeatmap,
} from './engagement.service';

const router = Router();

// ─── Pulse ───────────────────────────────────────────────────────────────────

/**
 * POST /pulse
 * Body: { mood: number, energy: number, productivity: number }
 * Records today's pulse check-in for the authenticated employee.
 */
router.post(
  '/pulse',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { orgId, employeeId } = req.user;
    const { mood, energy, productivity } = req.body;
    const result = await submitPulse(orgId, employeeId, +mood, +energy, +productivity);
    sendSuccess(res, result, 'Pulse submitted', 201);
  }),
);

/**
 * GET /pulse/trend
 * Returns last 30 days of aggregated pulse data for the org.
 */
router.get(
  '/pulse/trend',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { orgId } = req.user;
    const result = await getPulseTrend(orgId);
    sendSuccess(res, result);
  }),
);

// ─── Kudos / Recognition ─────────────────────────────────────────────────────

/**
 * POST /kudos
 * Body: { toId: string, badge: string, message: string, points: number }
 * Awards kudos from the authenticated employee to another.
 */
router.post(
  '/kudos',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { employeeId } = req.user;
    const { toId, badge, message, points } = req.body;
    const result = await giveKudos(employeeId, toId, badge, message ?? '', +(points ?? 0));
    sendSuccess(res, result, 'Kudos given', 201);
  }),
);

/**
 * GET /kudos/feed
 * Returns the last 50 recognitions across the org.
 */
router.get(
  '/kudos/feed',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { orgId } = req.user;
    const result = await getKudosFeed(orgId);
    sendSuccess(res, result);
  }),
);

// ─── Leaderboard ─────────────────────────────────────────────────────────────

/**
 * GET /leaderboard
 * Returns the top 10 employees by recognition points for the org.
 */
router.get(
  '/leaderboard',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { orgId } = req.user;
    const result = await getLeaderboard(orgId);
    sendSuccess(res, result);
  }),
);

// ─── eNPS ────────────────────────────────────────────────────────────────────

/**
 * GET /enps
 * Returns eNPS score breakdown and individual responses for the org.
 */
router.get(
  '/enps',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { orgId } = req.user;
    const result = await getENPS(orgId);
    sendSuccess(res, result);
  }),
);

/**
 * POST /enps
 * Body: { score: number (0-10), comment?: string }
 * Submits an eNPS response for the authenticated employee.
 */
router.post(
  '/enps',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { orgId, employeeId } = req.user;
    const { score, comment } = req.body;
    const result = await submitENPS(orgId, employeeId, +score, comment ?? '');
    sendSuccess(res, result, 'eNPS response submitted', 201);
  }),
);

// ─── Mood Heatmap ─────────────────────────────────────────────────────────────

/**
 * GET /mood/heatmap
 * Returns a 12-week mood heatmap grid for the org.
 */
router.get(
  '/mood/heatmap',
  authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { orgId } = req.user;
    const result = await getMoodHeatmap(orgId);
    sendSuccess(res, result);
  }),
);

export default router;
