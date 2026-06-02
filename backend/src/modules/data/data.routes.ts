import { Router } from 'express';
import prisma from '../../config/database';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Save a data key for the user's org
router.post('/sync', authenticate, asyncHandler(async (req: any, res: any) => {
  const { key, value } = req.body;
  const orgId = req.user.orgId;
  if (!key) return res.status(400).json({ success: false, message: 'Key required' });

  // Upsert into a simple key-value table (using raw query since we don't have a dedicated model)
  await prisma.$executeRaw`
    INSERT INTO org_data_store (org_id, key, value, updated_at)
    VALUES (${orgId}, ${key}, ${JSON.stringify(value)}::jsonb, NOW())
    ON CONFLICT (org_id, key) DO UPDATE SET value = ${JSON.stringify(value)}::jsonb, updated_at = NOW()
  `;
  sendSuccess(res, null, 'Synced');
}));

// Load all data for the user's org
router.get('/load', authenticate, asyncHandler(async (req: any, res: any) => {
  const orgId = req.user.orgId;
  const rows: any[] = await prisma.$queryRaw`
    SELECT key, value FROM org_data_store WHERE org_id = ${orgId}
  `;
  const data: Record<string, any> = {};
  rows.forEach((r: any) => { data[r.key] = r.value; });
  sendSuccess(res, data);
}));

export default router;
