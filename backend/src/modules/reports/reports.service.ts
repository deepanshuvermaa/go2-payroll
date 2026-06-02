import prisma from '../../config/database';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

export class ReportService {
  async salaryRegister(orgId: string, month: number, year: number) {
    return prisma.payrollRecord.findMany({
      where: { payrollRun: { orgId, month, year } },
      include: { employee: { select: { employeeCode: true, firstName: true, lastName: true, departmentId: true } } },
      orderBy: { employee: { employeeCode: 'asc' } },
    });
  }

  async attendanceRegister(orgId: string, month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return prisma.attendanceRecord.findMany({
      where: { employee: { orgId }, date: { gte: start, lte: end } },
      include: { employee: { select: { employeeCode: true, firstName: true, lastName: true } } },
      orderBy: [{ employee: { employeeCode: 'asc' } }, { date: 'asc' }],
    });
  }

  async pfRegister(orgId: string, month: number, year: number) {
    return prisma.payrollRecord.findMany({
      where: { payrollRun: { orgId, month, year }, pfEmployee: { gt: 0 } },
      select: { employeeId: true, pfEmployee: true, pfEmployer: true, grossEarnings: true, employee: { select: { employeeCode: true, firstName: true, lastName: true, uanNumber: true } } },
    });
  }

  async headcountReport(orgId: string) {
    const employees = await prisma.employee.findMany({ where: { orgId, status: 'ACTIVE' }, include: { department: true, designation: true } });
    const byDept: Record<string, number> = {};
    const byDesignation: Record<string, number> = {};
    for (const e of employees) {
      const dept = e.department?.name || 'Unassigned';
      const desig = e.designation?.name || 'Unassigned';
      byDept[dept] = (byDept[dept] || 0) + 1;
      byDesignation[desig] = (byDesignation[desig] || 0) + 1;
    }
    return { total: employees.length, byDepartment: byDept, byDesignation };
  }

  async attritionReport(orgId: string, year: number) {
    const exits = await prisma.exitRequest.findMany({ where: { employee: { orgId }, createdAt: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) } }, include: { employee: { select: { departmentId: true } } } });
    const totalActive = await prisma.employee.count({ where: { orgId, status: 'ACTIVE' } });
    return { exits: exits.length, attritionRate: totalActive > 0 ? Math.round((exits.length / totalActive) * 100) : 0 };
  }
}

export class ExportService {
  async toExcel(data: any[], columns: { header: string; key: string }[], sheetName: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns.map(c => ({ header: c.header, key: c.key, width: 20 }));
    data.forEach(row => sheet.addRow(row));
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  toCSV(data: any[], columns: { header: string; key: string }[]): string {
    const header = columns.map(c => c.header).join(',');
    const rows = data.map(row => columns.map(c => `"${row[c.key] ?? ''}"`).join(','));
    return [header, ...rows].join('\n');
  }

  toPDF(title: string, data: any[], columns: { header: string; key: string }[]): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(16).text(title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(8);

      // Header
      const colWidth = 700 / columns.length;
      let x = 30;
      columns.forEach(c => { doc.text(c.header, x, doc.y, { width: colWidth }); x += colWidth; });
      doc.moveDown();

      // Rows
      for (const row of data.slice(0, 50)) { // Limit for PDF
        x = 30;
        columns.forEach(c => { doc.text(String(row[c.key] ?? ''), x, doc.y, { width: colWidth }); x += colWidth; });
        doc.moveDown(0.5);
      }
      doc.end();
    });
  }
}

export class AnalyticsService {
  async payrollCostTrend(orgId: string, months: number) {
    const runs = await prisma.payrollRun.findMany({ where: { orgId, status: { in: ['FINALIZED', 'PAID'] } }, orderBy: [{ year: 'desc' }, { month: 'desc' }], take: months });
    return runs.map(r => ({ month: r.month, year: r.year, gross: r.totalGross, net: r.totalNet, employerCost: r.totalEmployerCost, employees: r.totalEmployees }));
  }

  async departmentCostBreakdown(orgId: string, month: number, year: number) {
    const records = await prisma.payrollRecord.findMany({
      where: { payrollRun: { orgId, month, year } },
      include: { employee: { include: { department: true } } },
    });
    const byDept: Record<string, number> = {};
    for (const r of records) {
      const dept = r.employee.department?.name || 'Unassigned';
      byDept[dept] = (byDept[dept] || 0) + r.grossEarnings;
    }
    return byDept;
  }
}

export const reportService = new ReportService();
export const exportService = new ExportService();
export const analyticsService = new AnalyticsService();
