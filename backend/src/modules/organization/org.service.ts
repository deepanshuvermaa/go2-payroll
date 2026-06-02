import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class OrgService {
  async create(data: any) {
    return prisma.organization.create({ data });
  }

  async update(orgId: string, data: any) {
    return prisma.organization.update({ where: { id: orgId }, data });
  }

  async get(orgId: string) {
    return prisma.organization.findUnique({ where: { id: orgId }, include: { branches: true, departments: true, designations: true } });
  }

  async createBranch(orgId: string, data: any) {
    return prisma.branch.create({ data: { ...data, orgId } });
  }

  async getBranches(orgId: string) {
    return prisma.branch.findMany({ where: { orgId, isActive: true } });
  }

  async createDepartment(orgId: string, data: any) {
    return prisma.department.create({ data: { ...data, orgId } });
  }

  async getDepartments(orgId: string) {
    return prisma.department.findMany({ where: { orgId, isActive: true }, include: { children: true } });
  }

  async createDesignation(orgId: string, data: any) {
    return prisma.designation.create({ data: { ...data, orgId } });
  }

  async getDesignations(orgId: string) {
    return prisma.designation.findMany({ where: { orgId, isActive: true }, orderBy: { level: 'asc' } });
  }

  async getOrgChart(orgId: string) {
    const departments = await prisma.department.findMany({
      where: { orgId, isActive: true },
      include: { children: true, employees: { where: { status: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, designationId: true } } },
    });
    return this.buildTree(departments, null);
  }

  private buildTree(depts: any[], parentId: string | null): any[] {
    return depts.filter(d => d.parentId === parentId).map(d => ({ ...d, children: this.buildTree(depts, d.id) }));
  }
}

export const orgService = new OrgService();
