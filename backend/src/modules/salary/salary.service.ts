import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class SalaryStructureService {
  async createTemplate(orgId: string, name: string, components: { componentId: string; calculationType: string; percentage?: number; fixedAmount?: number }[]) {
    const template = await prisma.salaryTemplate.create({ data: { orgId, name } });
    for (let i = 0; i < components.length; i++) {
      await prisma.salaryTemplateItem.create({
        data: { templateId: template.id, componentId: components[i].componentId, calculationType: components[i].calculationType as any, percentage: components[i].percentage, fixedAmount: components[i].fixedAmount, order: i },
      });
    }
    return prisma.salaryTemplate.findUnique({ where: { id: template.id }, include: { items: { include: { component: true }, orderBy: { order: 'asc' } } } });
  }

  async assignToEmployee(employeeId: string, templateId: string, ctc: number, effectiveFrom: Date) {
    // Deactivate current structure
    await prisma.employeeSalaryStructure.updateMany({ where: { employeeId, isActive: true }, data: { isActive: false, effectiveTo: effectiveFrom } });

    const template = await prisma.salaryTemplate.findUnique({ where: { id: templateId }, include: { items: { include: { component: true } } } });
    if (!template) throw new AppError(404, 'Template not found');

    const breakdown = this.calculateBreakdownFromTemplate(template.items, ctc);
    const grossSalary = Object.values(breakdown.earnings).reduce((s: number, v: any) => s + v, 0);
    const totalDeductions = Object.values(breakdown.deductions).reduce((s: number, v: any) => s + v, 0);

    return prisma.employeeSalaryStructure.create({
      data: { employeeId, templateId, ctc, grossSalary, netSalary: grossSalary - totalDeductions, effectiveFrom, breakdown },
    });
  }

  async revise(employeeId: string, newCtc: number, effectiveFrom: Date, reason: string) {
    const current = await prisma.employeeSalaryStructure.findFirst({ where: { employeeId, isActive: true }, include: { template: { include: { items: { include: { component: true } } } } } });
    if (!current) throw new AppError(400, 'No existing structure');

    await prisma.employeeTimeline.create({ data: { employeeId, eventType: 'SALARY_REVISION', description: reason, oldValue: String(current.ctc), newValue: String(newCtc), effectiveDate: effectiveFrom } });

    return this.assignToEmployee(employeeId, current.templateId, newCtc, effectiveFrom);
  }

  async getHistory(employeeId: string) {
    return prisma.employeeSalaryStructure.findMany({ where: { employeeId }, orderBy: { effectiveFrom: 'desc' } });
  }

  async simulateCTC(templateId: string, ctc: number) {
    const template = await prisma.salaryTemplate.findUnique({ where: { id: templateId }, include: { items: { include: { component: true } } } });
    if (!template) throw new AppError(404, 'Template not found');
    return this.calculateBreakdownFromTemplate(template.items, ctc);
  }

  private calculateBreakdownFromTemplate(items: any[], ctc: number) {
    const monthly = ctc / 12;
    const earnings: Record<string, number> = {};
    const deductions: Record<string, number> = {};
    const employerContributions: Record<string, number> = {};

    // First pass: calculate basic
    let basic = 0;
    for (const item of items) {
      if (item.component.code === 'BASIC') {
        basic = item.calculationType === 'PERCENTAGE_OF_CTC' ? Math.round(monthly * (item.percentage || 40) / 100) : (item.fixedAmount || Math.round(monthly * 0.4));
        earnings['basic'] = basic;
      }
    }
    if (!basic) { basic = Math.round(monthly * 0.4); earnings['basic'] = basic; }

    // Second pass: other components
    for (const item of items) {
      if (item.component.code === 'BASIC') continue;
      let amount = 0;
      switch (item.calculationType) {
        case 'PERCENTAGE_OF_BASIC': amount = Math.round(basic * (item.percentage || 0) / 100); break;
        case 'PERCENTAGE_OF_GROSS': amount = Math.round(monthly * (item.percentage || 0) / 100); break;
        case 'PERCENTAGE_OF_CTC': amount = Math.round(monthly * (item.percentage || 0) / 100); break;
        case 'FIXED': amount = item.fixedAmount || 0; break;
      }
      if (item.component.type === 'EARNING') earnings[item.component.code] = amount;
      else if (item.component.type === 'DEDUCTION') deductions[item.component.code] = amount;
      else employerContributions[item.component.code] = amount;
    }

    return { earnings, deductions, employerContributions, monthly, annual: ctc };
  }
}

export class SalaryComponentService {
  async create(orgId: string, data: any) {
    return prisma.salaryComponent.create({ data: { ...data, orgId } });
  }

  async list(orgId: string) {
    return prisma.salaryComponent.findMany({ where: { orgId, isActive: true }, orderBy: { type: 'asc' } });
  }

  async getStandard() {
    return [
      { code: 'BASIC', name: 'Basic Salary', type: 'EARNING', calculationType: 'PERCENTAGE_OF_CTC', percentage: 40, isTaxable: true },
      { code: 'HRA', name: 'House Rent Allowance', type: 'EARNING', calculationType: 'PERCENTAGE_OF_BASIC', percentage: 50, isTaxable: true },
      { code: 'DA', name: 'Dearness Allowance', type: 'EARNING', calculationType: 'PERCENTAGE_OF_BASIC', percentage: 10, isTaxable: true },
      { code: 'CONVEYANCE', name: 'Conveyance Allowance', type: 'EARNING', calculationType: 'FIXED', fixedAmount: 1600, isTaxable: false },
      { code: 'MEDICAL', name: 'Medical Allowance', type: 'EARNING', calculationType: 'FIXED', fixedAmount: 1250, isTaxable: false },
      { code: 'SPECIAL', name: 'Special Allowance', type: 'EARNING', calculationType: 'FIXED', fixedAmount: 0, isTaxable: true },
      { code: 'PF_EMPLOYEE', name: 'PF (Employee)', type: 'DEDUCTION', calculationType: 'PERCENTAGE_OF_BASIC', percentage: 12, isTaxable: false, isStatutory: true },
      { code: 'PF_EMPLOYER', name: 'PF (Employer)', type: 'EMPLOYER_CONTRIBUTION', calculationType: 'PERCENTAGE_OF_BASIC', percentage: 12, isTaxable: false, isStatutory: true },
      { code: 'ESI_EMPLOYEE', name: 'ESI (Employee)', type: 'DEDUCTION', calculationType: 'PERCENTAGE_OF_GROSS', percentage: 0.75, isTaxable: false, isStatutory: true },
      { code: 'ESI_EMPLOYER', name: 'ESI (Employer)', type: 'EMPLOYER_CONTRIBUTION', calculationType: 'PERCENTAGE_OF_GROSS', percentage: 3.25, isTaxable: false, isStatutory: true },
      { code: 'PT', name: 'Professional Tax', type: 'DEDUCTION', calculationType: 'FIXED', fixedAmount: 200, isTaxable: false, isStatutory: true },
    ];
  }
}

export class FlexiBenefitsService {
  async getEligibleComponents(employeeId: string) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { orgId: true } });
    if (!emp) throw new AppError(404, 'Employee not found');
    return prisma.salaryComponent.findMany({ where: { orgId: emp.orgId, isActive: true, isTaxable: false, type: 'EARNING' } });
  }

  async submitDeclaration(employeeId: string, allocations: { componentId: string; amount: number }[]) {
    const structure = await prisma.employeeSalaryStructure.findFirst({ where: { employeeId, isActive: true } });
    if (!structure) throw new AppError(400, 'No salary structure');
    const breakdown = structure.breakdown as any;
    breakdown.flexiAllocations = allocations;
    return prisma.employeeSalaryStructure.update({ where: { id: structure.id }, data: { breakdown } });
  }
}

export const salaryStructureService = new SalaryStructureService();
export const salaryComponentService = new SalaryComponentService();
export const flexiBenefitsService = new FlexiBenefitsService();
