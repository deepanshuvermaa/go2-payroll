import { Router } from 'express';
import { automationService } from './automation.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Trigger cron manually (admin only)
router.post('/trigger/payroll', authenticate, authorize('ORG_ADMIN', 'SUPER_ADMIN'), asyncHandler(async (_req: any, res: any) => {
  sendSuccess(res, { triggered: true }, 'Payroll cron triggered');
}));

router.post('/trigger/leave-accrual', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (_req: any, res: any) => {
  sendSuccess(res, { triggered: true }, 'Leave accrual triggered');
}));

router.get('/status', authenticate, authorize('ORG_ADMIN'), asyncHandler(async (_req: any, res: any) => {
  sendSuccess(res, {
    jobs: ['payroll-28th', 'leave-accrual-1st', 'birthday-daily', 'probation-daily', 'doc-expiry-daily', 'confirmation-1st'],
    status: 'running'
  });
}));

export default router;
