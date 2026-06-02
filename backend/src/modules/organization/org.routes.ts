import { Router } from 'express';
import { orgService } from './org.service';
import { employeeService } from './employee.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Organization
router.get('/org', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await orgService.get(req.user.orgId);
  sendSuccess(res, result);
}));
router.put('/org', authenticate, authorize('ORG_ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: any, res: any) => {
  const result = await orgService.update(req.user.orgId, req.body);
  sendSuccess(res, result);
}));

// Branches
router.post('/branches', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await orgService.createBranch(req.user.orgId, req.body);
  sendSuccess(res, result, 'Branch created', 201);
}));
router.get('/branches', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await orgService.getBranches(req.user.orgId);
  sendSuccess(res, result);
}));

// Departments
router.post('/departments', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await orgService.createDepartment(req.user.orgId, req.body);
  sendSuccess(res, result, 'Department created', 201);
}));
router.get('/departments', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await orgService.getDepartments(req.user.orgId);
  sendSuccess(res, result);
}));

// Designations
router.post('/designations', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await orgService.createDesignation(req.user.orgId, req.body);
  sendSuccess(res, result, 'Designation created', 201);
}));
router.get('/designations', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await orgService.getDesignations(req.user.orgId);
  sendSuccess(res, result);
}));

// Org Chart
router.get('/org-chart', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await orgService.getOrgChart(req.user.orgId);
  sendSuccess(res, result);
}));

// Employees
router.post('/employees', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'), asyncHandler(async (req: any, res: any) => {
  const result = await employeeService.create(req.user.orgId, req.body);
  sendSuccess(res, result, 'Employee created', 201);
}));
router.get('/employees', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await employeeService.list(req.user.orgId, req.query);
  sendPaginated(res, result.data, result.total, result.page, result.limit);
}));
router.get('/employees/:id', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await employeeService.getById(req.params.id);
  sendSuccess(res, result);
}));
router.put('/employees/:id', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'), asyncHandler(async (req: any, res: any) => {
  const result = await employeeService.update(req.params.id, req.body);
  sendSuccess(res, result);
}));
router.post('/employees/:id/transfer', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await employeeService.transfer(req.params.id, req.body.departmentId, req.body.branchId, new Date(req.body.effectiveDate));
  sendSuccess(res, result);
}));
router.post('/employees/:id/promote', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const result = await employeeService.promote(req.params.id, req.body.designationId, new Date(req.body.effectiveDate), req.body.newSalary);
  sendSuccess(res, result);
}));
router.get('/employees/:id/timeline', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await employeeService.getTimeline(req.params.id);
  sendSuccess(res, result);
}));
router.get('/employees/:id/reportees', authenticate, asyncHandler(async (req: any, res: any) => {
  const result = await employeeService.getReportees(req.params.id);
  sendSuccess(res, result);
}));

export default router;
