import { Router } from 'express';
import { reportService, exportService, analyticsService } from './reports.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const adminRoles = ['ORG_ADMIN', 'HR_MANAGER', 'FINANCE_MANAGER'] as const;

router.get('/salary-register', authenticate, authorize(...adminRoles), asyncHandler(async (req: any, res: any) => {
  const result = await reportService.salaryRegister(req.user.orgId, +req.query.month, +req.query.year);
  sendSuccess(res, result);
}));
router.get('/attendance-register', authenticate, authorize(...adminRoles), asyncHandler(async (req: any, res: any) => {
  const result = await reportService.attendanceRegister(req.user.orgId, +req.query.month, +req.query.year);
  sendSuccess(res, result);
}));
router.get('/pf-register', authenticate, authorize(...adminRoles), asyncHandler(async (req: any, res: any) => {
  const result = await reportService.pfRegister(req.user.orgId, +req.query.month, +req.query.year);
  sendSuccess(res, result);
}));
router.get('/headcount', authenticate, authorize(...adminRoles), asyncHandler(async (req: any, res: any) => {
  const result = await reportService.headcountReport(req.user.orgId);
  sendSuccess(res, result);
}));
router.get('/attrition', authenticate, authorize(...adminRoles), asyncHandler(async (req: any, res: any) => {
  const result = await reportService.attritionReport(req.user.orgId, +req.query.year);
  sendSuccess(res, result);
}));

// Export
router.post('/export/excel', authenticate, authorize(...adminRoles), asyncHandler(async (req: any, res: any) => {
  const buffer = await exportService.toExcel(req.body.data, req.body.columns, req.body.sheetName || 'Report');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
  res.send(buffer);
}));
router.post('/export/csv', authenticate, authorize(...adminRoles), asyncHandler(async (req: any, res: any) => {
  const csv = exportService.toCSV(req.body.data, req.body.columns);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
  res.send(csv);
}));
router.post('/export/pdf', authenticate, authorize(...adminRoles), asyncHandler(async (req: any, res: any) => {
  const buffer = await exportService.toPDF(req.body.title || 'Report', req.body.data, req.body.columns);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
  res.send(buffer);
}));

// Analytics
router.get('/analytics/cost-trend', authenticate, authorize(...adminRoles), asyncHandler(async (req: any, res: any) => {
  const result = await analyticsService.payrollCostTrend(req.user.orgId, +(req.query.months || 12));
  sendSuccess(res, result);
}));
router.get('/analytics/dept-cost', authenticate, authorize(...adminRoles), asyncHandler(async (req: any, res: any) => {
  const result = await analyticsService.departmentCostBreakdown(req.user.orgId, +req.query.month, +req.query.year);
  sendSuccess(res, result);
}));

export default router;
