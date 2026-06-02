import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class EmployeeService {
  async create(orgId: string, data: any) {
    return prisma.employee.create({ data: { ...data, orgId } });
  }

  async update(employeeId: string, data: any) {
    return prisma.employee.update({ where: { id: employeeId }, data });
  }

  async getById(employeeId: string) {
    return prisma.employee.findUnique({
      where: { id: employeeId },
      include: { department: true, designation: true, branch: true, reportingManager: true },
    });
  }

  async list(orgId: string, filters: any = {}) {
    const where: any = { orgId };
    if (filters.status) where.status = filters.status;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.branchId) where.branchId = filters.branchId;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { employeeCode: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const [data, total] = await Promise.all([
      prisma.employee.findMany({ where, skip: (page - 1) * limit, take: limit, include: { department: true, designation: true, branch: true }, orderBy: { firstName: 'asc' } }),
      prisma.employee.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async transfer(employeeId: string, newDeptId: string, newBranchId: string, effectiveDate: Date) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new AppError(404, 'Employee not found');

    await prisma.employeeTimeline.create({
      data: { employeeId, eventType: 'TRANSFER', description: `Transferred to new department/branch`, oldValue: `${emp.departmentId}/${emp.branchId}`, newValue: `${newDeptId}/${newBranchId}`, effectiveDate },
    });

    return prisma.employee.update({ where: { id: employeeId }, data: { departmentId: newDeptId, branchId: newBranchId } });
  }

  async promote(employeeId: string, newDesignationId: string, effectiveDate: Date, newSalary?: number) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new AppError(404, 'Employee not found');

    await prisma.employeeTimeline.create({
      data: { employeeId, eventType: 'PROMOTION', description: `Promoted`, oldValue: emp.designationId || '', newValue: newDesignationId, effectiveDate },
    });

    return prisma.employee.update({ where: { id: employeeId }, data: { designationId: newDesignationId } });
  }

  async getTimeline(employeeId: string) {
    return prisma.employeeTimeline.findMany({ where: { employeeId }, orderBy: { effectiveDate: 'desc' } });
  }

  async getReportees(managerId: string) {
    return prisma.employee.findMany({ where: { reportingManagerId: managerId, status: 'ACTIVE' }, include: { designation: true } });
  }
}

export const employeeService = new EmployeeService();
