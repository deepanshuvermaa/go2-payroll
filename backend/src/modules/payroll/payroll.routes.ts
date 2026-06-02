import { Router } from 'express';
import { payrollService, payrollValidationService } from './payroll.service';
import { generatePayslipPDF } from './payslipPdf';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';
import prisma from '../../config/database';

const router = Router();

router.post('/initialize', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await payrollService.initializeRun(req.user.orgId, +req.body.month, +req.body.year, req.user.userId);
  sendSuccess(res, result, 'Payroll run initialized', 201);
}));
router.post('/:id/process-all', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await payrollService.processAll(req.params.id);
  sendSuccess(res, result, 'Payroll processed');
}));
router.post('/:id/process-employee', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await payrollService.processEmployee(req.params.id, req.body.employeeId);
  sendSuccess(res, result);
}));
router.post('/:id/finalize', authenticate, authorize('ORG_ADMIN', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await payrollService.finalizeRun(req.params.id, req.user.userId);
  sendSuccess(res, result, 'Payroll finalized');
}));
router.post('/:id/revert', authenticate, authorize('ORG_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await payrollService.revertRun(req.params.id);
  sendSuccess(res, result, 'Payroll reverted');
}));
router.get('/payslip/:recordId', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await payrollService.getPayslip(req.params.recordId);
  sendSuccess(res, result);
}));
router.get('/payslip/:recordId/pdf', authenticate, asyncHandler(async (req: any, res: any) => {
  const record = await payrollService.getPayslip(req.params.recordId);
  const org = await prisma.organization.findFirst({ where: { id: req.user.orgId } });
  const pdf = await generatePayslipPDF(record, record?.employee, org);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=payslip_${req.params.recordId}.pdf`);
  res.send(pdf);
}));
router.get('/variance', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await payrollService.getVarianceReport(req.user.orgId, +req.query.month1, +req.query.year1, +req.query.month2, +req.query.year2);
  sendSuccess(res, result);
}));

// Validation
router.get('/pre-checks', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await payrollValidationService.preRunChecks(req.user.orgId, +req.query.month, +req.query.year);
  sendSuccess(res, result);
}));
router.get('/:id/anomalies', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await payrollValidationService.flagAnomalies(req.params.id);
  sendSuccess(res, result);
}));

export default router;
