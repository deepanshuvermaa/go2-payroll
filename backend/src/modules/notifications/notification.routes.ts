import { Router } from 'express';
import { notificationService } from './notification.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.get('/unread', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await notificationService.getUnread(req.user.userId);
  sendSuccess(res, result);
}));
router.get('/', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await notificationService.getAll(req.user.userId, +(req.query.page || 1), +(req.query.limit || 20));
  sendSuccess(res, result);
}));
router.post('/:id/read', authenticate, asyncHandler(async (req: any, res: any) => {
  await notificationService.markRead(req.params.id);
  sendSuccess(res, null);
}));
router.post('/read-all', authenticate, asyncHandler(async (req: any, res: any) => {
  await notificationService.markAllRead(req.user.userId);
  sendSuccess(res, null);
}));

export default router;
