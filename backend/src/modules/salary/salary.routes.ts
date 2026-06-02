import { Router } from 'express';
import { salaryStructureService, salaryComponentService, flexiBenefitsService } from './salary.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Templates
router.post('/templates', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await salaryStructureService.createTemplate(req.user.orgId, req.body.name, req.body.components);
  sendSuccess(res, result, 'Template created', 201);
}));
router.post('/assign', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await salaryStructureService.assignToEmployee(req.body.employeeId, req.body.templateId, +req.body.ctc, new Date(req.body.effectiveFrom));
  sendSuccess(res, result);
}));
router.post('/revise', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await salaryStructureService.revise(req.body.employeeId, +req.body.newCtc, new Date(req.body.effectiveFrom), req.body.reason);
  sendSuccess(res, result);
}));
router.get('/history/:employeeId', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await salaryStructureService.getHistory(req.params.employeeId);
  sendSuccess(res, result);
}));
router.post('/simulate', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await salaryStructureService.simulateCTC(req.body.templateId, +req.body.ctc);
  sendSuccess(res, result);
}));

// Components
router.post('/components', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await salaryComponentService.create(req.user.orgId, req.body);
  sendSuccess(res, result, 'Component created', 201);
}));
router.get('/components', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await salaryComponentService.list(req.user.orgId);
  sendSuccess(res, result);
}));
router.get('/components/standard', authenticate, asyncHandler(async (_req: any, res: any) => {
  const result = await salaryComponentService.getStandard();
  sendSuccess(res, result);
}));

// Flexi Benefits
router.get('/flexi/eligible', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await flexiBenefitsService.getEligibleComponents(req.user.employeeId);
  sendSuccess(res, result);
}));
router.post('/flexi/declare', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await flexiBenefitsService.submitDeclaration(req.user.employeeId, req.body.allocations);
  sendSuccess(res, result);
}));

export default router;
