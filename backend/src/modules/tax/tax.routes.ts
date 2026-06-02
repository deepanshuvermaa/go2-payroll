import { Router } from 'express';
import { taxService, pfService, esiService, ptService, gratuityService, lwfService } from './tax.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.get('/calculate/:employeeId', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await taxService.calculateIncomeTax(req.params.employeeId, req.query.fy as string, req.query.regime as any || 'NEW');
  sendSuccess(res, result);
}));
router.get('/compare-regimes/:employeeId', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await taxService.compareRegimes(req.params.employeeId, req.query.fy as string);
  sendSuccess(res, result);
}));
router.post('/declaration', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await taxService.submitDeclaration(req.user.employeeId, req.body.fy, req.body.declarations);
  sendSuccess(res, result);
}));
router.post('/proof', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await taxService.submitProof(req.body.declarationId, req.body.section, +req.body.amount, req.body.proofUrl);
  sendSuccess(res, result, 'Proof submitted', 201);
}));
router.post('/proof/:id/verify', authenticate, authorize('HR_MANAGER', 'FINANCE_MANAGER', 'ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await taxService.verifyProof(req.params.id, req.user.userId, +req.body.approvedAmount);
  sendSuccess(res, result);
}));
router.get('/hra-exemption/:employeeId', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await taxService.calculateHRAExemption(req.params.employeeId);
  sendSuccess(res, result);
}));

// PF
router.get('/pf/calculate', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await pfService.calculatePF(+req.query.basicWage);
  sendSuccess(res, result);
}));
router.get('/pf/ecr', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await pfService.generateECR(req.user.orgId, +req.query.month, +req.query.year);
  sendSuccess(res, result);
}));

// ESI
router.get('/esi/calculate', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = esiService.calculateESI(+req.query.grossWage);
  sendSuccess(res, result);
}));

// PT
router.get('/pt/calculate', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = ptService.calculatePT(req.query.state as string, +req.query.grossSalary);
  sendSuccess(res, { amount: result });
}));
router.get('/pt/slabs/:state', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = ptService.getStateSlabs(req.params.state);
  sendSuccess(res, result);
}));

// Gratuity
router.get('/gratuity/:employeeId', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await gratuityService.calculate(req.params.employeeId);
  sendSuccess(res, result);
}));

// LWF
router.get('/lwf/calculate', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = lwfService.calculate(req.query.state as string, +req.query.grossSalary);
  sendSuccess(res, result);
}));

export default router;
