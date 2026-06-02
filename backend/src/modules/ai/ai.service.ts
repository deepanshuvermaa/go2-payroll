import prisma from '../../config/database';

export class AIService {
  async detectPayrollAnomalies(payrollRunId: string) {
    const records = await prisma.payrollRecord.findMany({ where: { payrollRunId }, include: { employee: { select: { employeeCode: true, firstName: true, lastName: true } } } });
    if (records.length === 0) return { anomalies: [] };

    const avgNet = records.reduce((s, r) => s + r.netPay, 0) / records.length;
    const stdDev = Math.sqrt(records.reduce((s, r) => s + (r.netPay - avgNet) ** 2, 0) / records.length);

    const anomalies = records
      .filter(r => Math.abs(r.netPay - avgNet) > 2 * stdDev)
      .map(r => ({
        employee: `${r.employee.firstName} ${r.employee.lastName} (${r.employee.employeeCode})`,
        netPay: r.netPay, avgNet: Math.round(avgNet),
        deviation: `${Math.round(((r.netPay - avgNet) / avgNet) * 100)}%`,
        severity: Math.abs(r.netPay - avgNet) > 3 * stdDev ? 'HIGH' : 'MEDIUM',
      }));

    return { anomalies, stats: { avg: Math.round(avgNet), stdDev: Math.round(stdDev), total: records.length } };
  }

  async predictAttrition(orgId: string) {
    // Simplified attrition risk scoring based on available data
    const employees = await prisma.employee.findMany({
      where: { orgId, status: 'ACTIVE' },
      include: { salaryStructures: { where: { isActive: true } }, leaveBalances: { where: { year: new Date().getFullYear() } } },
    });

    const risks = employees.map(emp => {
      let score = 0;
      const tenure = (Date.now() - emp.dateOfJoining.getTime()) / (365.25 * 86400000);

      // Tenure risk (1-2 years highest attrition)
      if (tenure >= 1 && tenure <= 2) score += 30;
      else if (tenure < 1) score += 20;

      // No salary revision in 18+ months
      const structure = emp.salaryStructures[0];
      if (structure) {
        const monthsSinceRevision = (Date.now() - structure.effectiveFrom.getTime()) / (30 * 86400000);
        if (monthsSinceRevision > 18) score += 25;
      }

      // High leave usage
      const totalLeave = emp.leaveBalances.reduce((s, b) => s + b.used, 0);
      if (totalLeave > 15) score += 15;

      return { employeeId: emp.id, name: `${emp.firstName} ${emp.lastName}`, riskScore: Math.min(100, score), tenure: Math.round(tenure * 10) / 10 };
    });

    return risks.filter(r => r.riskScore > 30).sort((a, b) => b.riskScore - a.riskScore);
  }

  async chatbot(employeeId: string, query: string) {
    const q = query.toLowerCase();

    if (q.includes('leave') && q.includes('balance')) {
      const balances = await prisma.leaveBalance.findMany({ where: { employeeId, year: new Date().getFullYear() }, include: { leaveType: { select: { name: true } } } });
      return { answer: `Your leave balances:\n${balances.map(b => `${b.leaveType.name}: ${b.balance} days`).join('\n')}` };
    }

    if (q.includes('salary') || q.includes('payslip')) {
      const latest = await prisma.payrollRecord.findFirst({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
      if (latest) return { answer: `Your last salary: Gross ₹${latest.grossEarnings}, Deductions ₹${latest.totalDeductions}, Net ₹${latest.netPay}` };
      return { answer: 'No payslip found yet.' };
    }

    if (q.includes('holiday')) {
      const emp = await prisma.employee.findUnique({ where: { id: employeeId }, select: { orgId: true } });
      const holidays = await prisma.holiday.findMany({ where: { orgId: emp!.orgId, date: { gte: new Date() } }, take: 5, orderBy: { date: 'asc' } });
      return { answer: `Upcoming holidays:\n${holidays.map(h => `${h.name} - ${h.date.toISOString().split('T')[0]}`).join('\n')}` };
    }

    return { answer: 'I can help with leave balance, salary/payslip info, and holiday queries. Please try asking about those.' };
  }
}

export class AutomationService {
  async runScheduledJobs(orgId: string) {
    const results: string[] = [];

    // Auto mark absent
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const employees = await prisma.employee.findMany({ where: { orgId, status: 'ACTIVE' }, select: { id: true } });
    const marked = await prisma.attendanceRecord.findMany({ where: { date: today, employee: { orgId } }, select: { employeeId: true } });
    const markedIds = new Set(marked.map(m => m.employeeId));
    const unmarked = employees.filter(e => !markedIds.has(e.id));

    if (unmarked.length > 0) {
      await prisma.$transaction(unmarked.map(e => prisma.attendanceRecord.create({ data: { employeeId: e.id, date: today, status: 'ABSENT', source: 'BULK', markedBy: 'SYSTEM' } })));
      results.push(`Marked ${unmarked.length} employees absent`);
    }

    // Expire old comp-offs
    const expired = await prisma.compOff.updateMany({ where: { employee: { orgId }, status: 'APPROVED', usedDate: null, expiryDate: { lt: new Date() } }, data: { status: 'REJECTED' } });
    if (expired.count > 0) results.push(`Expired ${expired.count} comp-offs`);

    return { results };
  }
}

export const aiService = new AIService();
export const automationService = new AutomationService();
