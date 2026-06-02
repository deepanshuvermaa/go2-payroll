import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class PayrollService {
  async initializeRun(orgId: string, month: number, year: number, initiatedBy: string) {
    const existing = await prisma.payrollRun.findUnique({ where: { orgId_month_year: { orgId, month, year } } });
    if (existing && existing.status === 'FINALIZED') throw new AppError(400, 'Payroll already finalized for this period');
    if (existing) return existing;

    const totalEmployees = await prisma.employee.count({ where: { orgId, status: { in: ['ACTIVE', 'ON_NOTICE'] } } });
    return prisma.payrollRun.create({ data: { orgId, month, year, initiatedBy, totalEmployees } });
  }

  async processEmployee(payrollRunId: string, employeeId: string) {
    const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new AppError(404, 'Payroll run not found');

    const emp = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new AppError(404, 'Employee not found');

    const structure = await prisma.employeeSalaryStructure.findFirst({ where: { employeeId, isActive: true } });
    if (!structure) throw new AppError(400, `No salary structure for ${emp.employeeCode}`);

    const breakdown = structure.breakdown as any;
    const workingDays = this.getWorkingDays(run.month, run.year);
    const attendance = await this.getAttendanceSummary(employeeId, run.month, run.year);
    const paidDays = attendance.present + attendance.halfDay * 0.5 + attendance.onLeave + attendance.holiday + attendance.weekOff;
    const lopDays = Math.max(0, workingDays - paidDays);

    // Calculate earnings
    const earnings: Record<string, number> = {};
    let grossEarnings = 0;
    for (const [key, value] of Object.entries(breakdown.earnings || {})) {
      const monthly = (value as number);
      const prorated = lopDays > 0 ? Math.round(monthly * (workingDays - lopDays) / workingDays) : monthly;
      earnings[key] = prorated;
      grossEarnings += prorated;
    }

    // Calculate deductions
    const deductions: Record<string, number> = {};
    const basic = earnings['basic'] || grossEarnings * 0.4;

    // PF
    const pfEmployee = Math.min(Math.round(basic * 0.12), 1800);
    const pfEmployer = pfEmployee;
    deductions['pf'] = pfEmployee;

    // ESI (if gross <= 21000)
    let esiEmployee = 0, esiEmployer = 0;
    if (grossEarnings <= 21000) {
      esiEmployee = Math.round(grossEarnings * 0.0075);
      esiEmployer = Math.round(grossEarnings * 0.0325);
      deductions['esi'] = esiEmployee;
    }

    // PT
    const pt = this.calculatePT(grossEarnings, '');
    deductions['pt'] = pt;

    // TDS
    const tds = await this.calculateMonthlyTDS(employeeId, grossEarnings, run.year);
    deductions['tds'] = tds;

    // Loan & Advance recovery
    const loanRecovery = await this.recoverLoans(employeeId);
    const advanceRecovery = await this.recoverAdvances(employeeId);
    if (loanRecovery > 0) deductions['loan'] = loanRecovery;
    if (advanceRecovery > 0) deductions['advance'] = advanceRecovery;

    const totalDeductions = Object.values(deductions).reduce((s, v) => s + v, 0);
    const netPay = grossEarnings - totalDeductions;

    const employerContributions = { pf: pfEmployer, esi: esiEmployer };

    return prisma.payrollRecord.upsert({
      where: { payrollRunId_employeeId: { payrollRunId, employeeId } },
      create: {
        payrollRunId, employeeId, workingDays, paidDays, lopDays, presentDays: attendance.present,
        earnings, deductions, employerContributions, grossEarnings, totalDeductions, netPay,
        ctc: structure.ctc, pfEmployee, pfEmployer, esiEmployee, esiEmployer, pt, tds, loanRecovery, advanceRecovery,
      },
      update: {
        workingDays, paidDays, lopDays, presentDays: attendance.present,
        earnings, deductions, employerContributions, grossEarnings, totalDeductions, netPay,
        pfEmployee, pfEmployer, esiEmployee, esiEmployer, pt, tds, loanRecovery, advanceRecovery,
      },
    });
  }

  async processAll(payrollRunId: string) {
    const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) throw new AppError(404, 'Payroll run not found');

    await prisma.payrollRun.update({ where: { id: payrollRunId }, data: { status: 'PROCESSING' } });

    const employees = await prisma.employee.findMany({ where: { orgId: run.orgId, status: { in: ['ACTIVE', 'ON_NOTICE'] } }, select: { id: true } });

    for (const emp of employees) {
      await this.processEmployee(payrollRunId, emp.id);
    }

    const records = await prisma.payrollRecord.findMany({ where: { payrollRunId } });
    const totals = records.reduce((acc, r) => ({
      gross: acc.gross + r.grossEarnings,
      deductions: acc.deductions + r.totalDeductions,
      net: acc.net + r.netPay,
      employerCost: acc.employerCost + r.grossEarnings + r.pfEmployer + r.esiEmployer,
    }), { gross: 0, deductions: 0, net: 0, employerCost: 0 });

    return prisma.payrollRun.update({
      where: { id: payrollRunId },
      data: { status: 'PROCESSED', totalGross: totals.gross, totalDeductions: totals.deductions, totalNet: totals.net, totalEmployerCost: totals.employerCost, processedAt: new Date() },
    });
  }

  async finalizeRun(payrollRunId: string, approvedBy: string) {
    return prisma.payrollRun.update({ where: { id: payrollRunId }, data: { status: 'FINALIZED', approvedBy, finalizedAt: new Date() } });
  }

  async revertRun(payrollRunId: string) {
    const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (run?.status === 'PAID') throw new AppError(400, 'Cannot revert paid payroll');
    return prisma.payrollRun.update({ where: { id: payrollRunId }, data: { status: 'DRAFT' } });
  }

  async getPayslip(payrollRecordId: string) {
    return prisma.payrollRecord.findUnique({
      where: { id: payrollRecordId },
      include: { employee: { include: { department: true, designation: true } }, payrollRun: { select: { month: true, year: true } } },
    });
  }

  async getVarianceReport(orgId: string, month1: number, year1: number, month2: number, year2: number) {
    const [run1, run2] = await Promise.all([
      prisma.payrollRun.findUnique({ where: { orgId_month_year: { orgId, month: month1, year: year1 } } }),
      prisma.payrollRun.findUnique({ where: { orgId_month_year: { orgId, month: month2, year: year2 } } }),
    ]);
    if (!run1 || !run2) throw new AppError(404, 'Payroll runs not found');
    return {
      period1: { month: month1, year: year1, gross: run1.totalGross, net: run1.totalNet, employees: run1.totalEmployees },
      period2: { month: month2, year: year2, gross: run2.totalGross, net: run2.totalNet, employees: run2.totalEmployees },
      variance: { gross: run2.totalGross - run1.totalGross, net: run2.totalNet - run1.totalNet, employees: run2.totalEmployees - run1.totalEmployees },
    };
  }

  private getWorkingDays(month: number, year: number): number {
    const daysInMonth = new Date(year, month, 0).getDate();
    let working = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const day = new Date(year, month - 1, d).getDay();
      if (day !== 0) working++; // Exclude Sundays
    }
    return working;
  }

  private async getAttendanceSummary(employeeId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    const records = await prisma.attendanceRecord.findMany({ where: { employeeId, date: { gte: start, lte: end } } });
    return {
      present: records.filter(r => r.status === 'PRESENT').length,
      halfDay: records.filter(r => r.status === 'HALF_DAY').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      onLeave: records.filter(r => r.status === 'ON_LEAVE').length,
      holiday: records.filter(r => r.status === 'HOLIDAY').length,
      weekOff: records.filter(r => r.status === 'WEEK_OFF').length,
    };
  }

  private calculatePT(gross: number, _state: string): number {
    // Default Maharashtra slabs
    if (gross <= 7500) return 0;
    if (gross <= 10000) return 175;
    return 200; // Max ₹200/month (₹300 in Feb)
  }

  private async calculateMonthlyTDS(employeeId: string, monthlyGross: number, year: number): Promise<number> {
    const annualIncome = monthlyGross * 12;
    // New regime default
    let tax = 0;
    if (annualIncome <= 300000) tax = 0;
    else if (annualIncome <= 700000) tax = (annualIncome - 300000) * 0.05;
    else if (annualIncome <= 1000000) tax = 20000 + (annualIncome - 700000) * 0.10;
    else if (annualIncome <= 1200000) tax = 50000 + (annualIncome - 1000000) * 0.15;
    else if (annualIncome <= 1500000) tax = 80000 + (annualIncome - 1200000) * 0.20;
    else tax = 140000 + (annualIncome - 1500000) * 0.30;

    // Rebate u/s 87A for income up to 7L
    if (annualIncome <= 700000) tax = 0;

    const cess = tax * 0.04;
    return Math.round((tax + cess) / 12);
  }

  private async recoverLoans(employeeId: string): Promise<number> {
    const loans = await prisma.loan.findMany({ where: { employeeId, isActive: true } });
    let total = 0;
    for (const loan of loans) {
      if (loan.paidEmis < loan.tenure) {
        total += loan.emiAmount;
        await prisma.loan.update({ where: { id: loan.id }, data: { paidEmis: { increment: 1 }, outstanding: { decrement: loan.emiAmount } } });
      }
    }
    return total;
  }

  private async recoverAdvances(employeeId: string): Promise<number> {
    const advances = await prisma.advance.findMany({ where: { employeeId, isActive: true } });
    let total = 0;
    for (const adv of advances) {
      if (adv.paidInstallments < adv.installments) {
        total += adv.recoveryAmount;
        const newPaid = adv.paidInstallments + 1;
        await prisma.advance.update({
          where: { id: adv.id },
          data: { paidInstallments: newPaid, recoveredAmount: { increment: adv.recoveryAmount }, isActive: newPaid < adv.installments },
        });
      }
    }
    return total;
  }
}

export class PayrollValidationService {
  async preRunChecks(orgId: string, month: number, year: number) {
    const issues: string[] = [];

    // Check attendance locked
    const lock = await prisma.attendanceLock.findUnique({ where: { orgId_month_year: { orgId, month, year } } });
    if (!lock) issues.push('Attendance not locked for this period');

    // Check pending leaves
    const pendingLeaves = await prisma.leaveApplication.count({ where: { employee: { orgId }, status: 'PENDING', fromDate: { gte: new Date(year, month - 1, 1), lte: new Date(year, month, 0) } } });
    if (pendingLeaves > 0) issues.push(`${pendingLeaves} pending leave applications`);

    // Check employees without salary structure
    const noStructure = await prisma.employee.count({
      where: { orgId, status: 'ACTIVE', salaryStructures: { none: { isActive: true } } },
    });
    if (noStructure > 0) issues.push(`${noStructure} employees without salary structure`);

    return { ready: issues.length === 0, issues };
  }

  async flagAnomalies(payrollRunId: string) {
    const records = await prisma.payrollRecord.findMany({ where: { payrollRunId } });
    const avgNet = records.reduce((s, r) => s + r.netPay, 0) / records.length;
    const stdDev = Math.sqrt(records.reduce((s, r) => s + (r.netPay - avgNet) ** 2, 0) / records.length);

    return records.filter(r => Math.abs(r.netPay - avgNet) > 2 * stdDev).map(r => ({
      employeeId: r.employeeId, netPay: r.netPay, deviation: Math.round(((r.netPay - avgNet) / avgNet) * 100),
    }));
  }
}

export const payrollService = new PayrollService();
export const payrollValidationService = new PayrollValidationService();
