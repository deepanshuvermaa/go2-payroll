import { Router } from 'express';
import { bankingService, razorpayXService } from './banking.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.post('/accounts', authenticate, authorize('ORG_ADMIN', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await bankingService.addAccount(req.user.orgId, req.body);
  sendSuccess(res, result, 'Account added', 201);
}));
router.get('/accounts', authenticate, authorize('ORG_ADMIN', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await bankingService.getAccounts(req.user.orgId);
  sendSuccess(res, result);
}));
router.post('/batch', authenticate, authorize('ORG_ADMIN', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await bankingService.createPaymentBatch(req.body.payrollRunId, req.body.bankAccountId);
  sendSuccess(res, result, 'Batch created', 201);
}));
router.get('/batch/:id/neft', authenticate, authorize('ORG_ADMIN', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await bankingService.generateNEFTFile(req.params.id);
  sendSuccess(res, result);
}));
router.get('/batch/:id/status', authenticate, authorize('ORG_ADMIN', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await bankingService.getPaymentStatus(req.params.id);
  sendSuccess(res, result);
}));
router.post('/batch/:id/retry', authenticate, authorize('ORG_ADMIN', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await bankingService.retryFailed(req.params.id);
  sendSuccess(res, result);
}));
router.post('/batch/:id/razorpayx', authenticate, authorize('ORG_ADMIN', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await razorpayXService.initiatePayout(req.params.id);
  sendSuccess(res, result);
}));
router.post('/webhook/razorpayx', asyncHandler(async (req: any, res: any) => {
  await razorpayXService.webhookHandler(req.body);
  res.status(200).json({ status: 'ok' });
}));

export default router;
