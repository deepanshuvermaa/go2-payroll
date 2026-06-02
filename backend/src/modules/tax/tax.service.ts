import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class TaxService {
  async calculateIncomeTax(employeeId: string, fy: string, regime: 'OLD' | 'NEW') {
    const structure = await prisma.employeeSalaryStructure.findFirst({ where: { employeeId, isActive: true } });
    if (!structure) throw new AppError(400, 'No salary structure');

    const annualGross = structure.grossSalary * 12;
    let taxableIncome = annualGross;

    if (regime === 'OLD') {
      const declaration = await prisma.taxDeclaration.findFirst({ where: { employeeId, fy } });
      const deductions = declaration?.totalApproved || 0;
      taxableIncome -= 50000; // Standard deduction
      taxableIncome -= deductions;
      taxableIncome = Math.max(0, taxableIncome);
    } else {
      taxableIncome -= 75000; // New regime standard deduction (Budget 2024)
      taxableIncome = Math.max(0, taxableIncome);
    }

    const tax = regime === 'NEW' ? this.newRegimeTax(taxableIncome) : this.oldRegimeTax(taxableIncome);
    const cess = Math.round(tax * 0.04);
    const surcharge = this.calculateSurcharge(taxableIncome, tax);
    const totalTax = tax + cess + surcharge;

    return { annualGross, taxableIncome, tax, cess, surcharge, totalTax, monthlyTDS: Math.round(totalTax / 12), regime };
  }

  async compareRegimes(employeeId: string, fy: string) {
    const oldRegime = await this.calculateIncomeTax(employeeId, fy, 'OLD');
    const newRegime = await this.calculateIncomeTax(employeeId, fy, 'NEW');
    return { oldRegime, newRegime, recommendation: oldRegime.totalTax < newRegime.totalTax ? 'OLD' : 'NEW', saving: Math.abs(oldRegime.totalTax - newRegime.totalTax) };
  }

  async submitDeclaration(employeeId: string, fy: string, declarations: any) {
    const totalDeclared = Object.values(declarations).reduce((s: number, v: any) => s + (typeof v === 'number' ? v : 0), 0);
    return prisma.taxDeclaration.upsert({
      where: { employeeId_fy: { employeeId, fy } },
      create: { employeeId, fy, declarations, totalDeclared },
      update: { declarations, totalDeclared },
    });
  }

  async submitProof(declarationId: string, section: string, amount: number, proofUrl: string) {
    return prisma.taxProof.create({ data: { declarationId, section, declaredAmount: amount, proofUrl } });
  }

  async verifyProof(proofId: string, verifiedBy: string, approvedAmount: number) {
    const proof = await prisma.taxProof.update({ where: { id: proofId }, data: { verifiedBy, approvedAmount, verifiedAt: new Date(), status: 'VERIFIED' } });
    // Update total approved in declaration
    const proofs = await prisma.taxProof.findMany({ where: { declarationId: proof.declarationId, status: 'VERIFIED' } });
    const totalApproved = proofs.reduce((s, p) => s + (p.approvedAmount || 0), 0);
    await prisma.taxDeclaration.update({ where: { id: proof.declarationId }, data: { totalApproved } });
    return proof;
  }

  async calculateHRAExemption(employeeId: string) {
    const structure = await prisma.employeeSalaryStructure.findFirst({ where: { employeeId, isActive: true } });
    if (!structure) return { exemption: 0 };
    const breakdown = structure.breakdown as any;
    const basic = breakdown.earnings?.basic || 0;
    const hra = breakdown.earnings?.HRA || breakdown.earnings?.hra || 0;
    // Assuming metro city, rent = 40% of salary (placeholder)
    const rent = basic * 0.4;
    const exemption = Math.min(hra, rent - basic * 0.1, basic * 0.5);
    return { exemption: Math.max(0, Math.round(exemption)) };
  }

  private newRegimeTax(income: number): number {
    if (income <= 300000) return 0;
    if (income <= 700000) return Math.round((income - 300000) * 0.05);
    if (income <= 1000000) return 20000 + Math.round((income - 700000) * 0.10);
    if (income <= 1200000) return 50000 + Math.round((income - 1000000) * 0.15);
    if (income <= 1500000) return 80000 + Math.round((income - 1200000) * 0.20);
    return 140000 + Math.round((income - 1500000) * 0.30);
  }

  private oldRegimeTax(income: number): number {
    if (income <= 250000) return 0;
    if (income <= 500000) return Math.round((income - 250000) * 0.05);
    if (income <= 1000000) return 12500 + Math.round((income - 500000) * 0.20);
    return 112500 + Math.round((income - 1000000) * 0.30);
  }

  private calculateSurcharge(income: number, tax: number): number {
    if (income <= 5000000) return 0;
    if (income <= 10000000) return Math.round(tax * 0.10);
    if (income <= 20000000) return Math.round(tax * 0.15);
    if (income <= 50000000) return Math.round(tax * 0.25);
    return Math.round(tax * 0.37);
  }
}

export class PFService {
  async calculatePF(basicWage: number) {
    const ceiling = 15000;
    const base = Math.min(basicWage, ceiling);
    const employeeShare = Math.round(base * 0.12);
    const employerPF = Math.round(base * 0.0367);
    const eps = Math.round(base * 0.0833);
    const edli = Math.round(base * 0.005);
    return { employeeShare, employerShare: employerPF + eps + edli, eps, edli, employerPF, base };
  }

  async generateECR(orgId: string, month: number, year: number) {
    const records = await prisma.payrollRecord.findMany({
      where: { payrollRun: { orgId, month, year } },
      include: { employee: { select: { uanNumber: true, firstName: true, lastName: true, pfNumber: true } } },
    });

    let ecr = '#~#~#~#~#~#~#~#\n';
    for (const r of records) {
      const basic = (r.earnings as any)?.basic || 0;
      ecr += `${r.employee.uanNumber || ''}~${r.employee.firstName} ${r.employee.lastName}~${basic}~${basic}~${basic}~${r.pfEmployee}~${r.pfEmployer}~0~0\n`;
    }
    return { content: ecr, filename: `ECR_${orgId}_${month}_${year}.txt` };
  }
}

export class ESIService {
  isApplicable(grossWage: number): boolean {
    return grossWage <= 21000;
  }

  calculateESI(grossWage: number) {
    if (!this.isApplicable(grossWage)) return { employeeShare: 0, employerShare: 0, applicable: false };
    return { employeeShare: Math.round(grossWage * 0.0075), employerShare: Math.round(grossWage * 0.0325), applicable: true };
  }
}

export class PTService {
  calculatePT(state: string, grossSalary: number): number {
    const slabs = this.getStateSlabs(state);
    for (const slab of slabs) {
      if (grossSalary >= slab.from && grossSalary <= slab.to) return slab.tax;
    }
    return 0;
  }

  getStateSlabs(state: string) {
    const slabs: Record<string, { from: number; to: number; tax: number }[]> = {
      MAHARASHTRA: [{ from: 0, to: 7500, tax: 0 }, { from: 7501, to: 10000, tax: 175 }, { from: 10001, to: Infinity, tax: 200 }],
      KARNATAKA: [{ from: 0, to: 15000, tax: 0 }, { from: 15001, to: Infinity, tax: 200 }],
      TELANGANA: [{ from: 0, to: 15000, tax: 0 }, { from: 15001, to: 20000, tax: 150 }, { from: 20001, to: Infinity, tax: 200 }],
      TAMIL_NADU: [{ from: 0, to: 21000, tax: 0 }, { from: 21001, to: 30000, tax: 135 }, { from: 30001, to: 45000, tax: 315 }, { from: 45001, to: 60000, tax: 690 }, { from: 60001, to: 75000, tax: 1025 }, { from: 75001, to: Infinity, tax: 1250 }],
      WEST_BENGAL: [{ from: 0, to: 10000, tax: 0 }, { from: 10001, to: 15000, tax: 110 }, { from: 15001, to: 25000, tax: 130 }, { from: 25001, to: 40000, tax: 150 }, { from: 40001, to: Infinity, tax: 200 }],
      DEFAULT: [{ from: 0, to: 15000, tax: 0 }, { from: 15001, to: Infinity, tax: 200 }],
    };
    return slabs[state.toUpperCase()] || slabs['DEFAULT'];
  }
}

export class GratuityService {
  async calculate(employeeId: string) {
    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new AppError(404, 'Employee not found');

    const years = (Date.now() - emp.dateOfJoining.getTime()) / (365.25 * 86400000);
    const eligible = years >= 5;

    const structure = await prisma.employeeSalaryStructure.findFirst({ where: { employeeId, isActive: true } });
    const basic = structure ? ((structure.breakdown as any)?.earnings?.basic || 0) : 0;
    const amount = eligible ? Math.round(basic * 15 * Math.floor(years) / 26) : 0;

    return { eligible, years: Math.floor(years), amount, basic };
  }
}

export class LWFService {
  calculate(state: string, _grossSalary: number) {
    const rates: Record<string, { employee: number; employer: number }> = {
      MAHARASHTRA: { employee: 12, employer: 36 },
      KARNATAKA: { employee: 20, employer: 40 },
      TAMIL_NADU: { employee: 10, employer: 20 },
      DEFAULT: { employee: 10, employer: 20 },
    };
    const rate = rates[state.toUpperCase()] || rates['DEFAULT'];
    return { employeeShare: rate.employee, employerShare: rate.employer };
  }
}

export const taxService = new TaxService();
export const pfService = new PFService();
export const esiService = new ESIService();
export const ptService = new PTService();
export const gratuityService = new GratuityService();
export const lwfService = new LWFService();
