import { Router } from 'express';
import { orgService } from './org.service';
import { employeeService } from './employee.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess, sendPaginated } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';
import prisma from '../../config/database';

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

// Get manager's team (reportees) with today's attendance
router.get('/my-team', authenticate, asyncHandler(async (req: any, res: any) => {
  if (!req.user.employeeId) return sendSuccess(res, []);
  const today = new Date();
  today.setHours(0,0,0,0);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);

  const reportees = await prisma.employee.findMany({
    where: { orgId: req.user.orgId, reportingManagerId: req.user.employeeId, status: 'ACTIVE' },
    include: { designation: { select: { name: true } }, department: { select: { name: true } } },
  });
  const attendance = await prisma.attendanceRecord.findMany({
    where: { employeeId: { in: reportees.map((r:any) => r.id) }, date: { gte: today, lt: tomorrow } },
  });
  const attMap: Record<string,any> = {};
  attendance.forEach((a:any) => { attMap[a.employeeId] = a; });
  const onLeave = await prisma.leaveApplication.findMany({
    where: { employeeId: { in: reportees.map((r:any)=>r.id) }, status: 'APPROVED', fromDate: { lte: today }, toDate: { gte: today } },
    select: { employeeId: true },
  });
  const onLeaveSet = new Set(onLeave.map((l:any)=>l.employeeId));
  const result = reportees.map((r:any) => {
    const att = attMap[r.id];
    let status = 'Absent';
    if (onLeaveSet.has(r.id)) status = 'On Leave';
    else if (att?.status === 'PRESENT') status = 'Present';
    else if (att?.status === 'HALF_DAY') status = 'Half Day';
    return { id: r.id, name: `${r.firstName} ${r.lastName}`, designation: r.designation?.name, department: r.department?.name, status, checkIn: att?.checkIn, checkOut: att?.checkOut };
  });
  sendSuccess(res, result);
}));

export default router;
