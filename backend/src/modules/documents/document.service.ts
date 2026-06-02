import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export class DocumentTemplateService {
  async create(orgId: string, data: { type: string; name: string; htmlContent: string; variables: string[] }) {
    return prisma.documentTemplate.create({ data: { orgId, ...data } });
  }

  async list(orgId: string) {
    return prisma.documentTemplate.findMany({ where: { orgId, isActive: true } });
  }

  async preview(templateId: string, sampleData: Record<string, string>) {
    const template = await prisma.documentTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new AppError(404, 'Template not found');
    let html = template.htmlContent;
    for (const [key, value] of Object.entries(sampleData)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return { html };
  }
}

export class DocumentGenerationService {
  async generate(employeeId: string, templateId: string, customVariables?: Record<string, string>) {
    const [template, employee] = await Promise.all([
      prisma.documentTemplate.findUnique({ where: { id: templateId } }),
      prisma.employee.findUnique({ where: { id: employeeId }, include: { department: true, designation: true, branch: true } }),
    ]);
    if (!template || !employee) throw new AppError(404, 'Template or employee not found');

    const variables: Record<string, string> = {
      employee_name: `${employee.firstName} ${employee.lastName}`,
      employee_code: employee.employeeCode,
      department: employee.department?.name || '',
      designation: employee.designation?.name || '',
      date_of_joining: employee.dateOfJoining.toISOString().split('T')[0],
      current_date: new Date().toISOString().split('T')[0],
      ...customVariables,
    };

    let html = template.htmlContent;
    for (const [key, value] of Object.entries(variables)) {
      html = html.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return { html, type: template.type, employeeId };
  }

  async getByEmployee(employeeId: string) {
    return prisma.employeeDocument.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } });
  }

  async upload(employeeId: string, docType: string, name: string, fileUrl: string, expiryDate?: Date) {
    return prisma.employeeDocument.create({ data: { employeeId, docType, name, fileUrl, expiryDate } });
  }

  async verify(documentId: string, verifiedBy: string) {
    return prisma.employeeDocument.update({ where: { id: documentId }, data: { status: 'VERIFIED', verifiedBy, verifiedAt: new Date() } });
  }

  async checkExpiring(orgId: string, daysAhead: number) {
    const futureDate = new Date(Date.now() + daysAhead * 86400000);
    return prisma.employeeDocument.findMany({
      where: { employee: { orgId }, expiryDate: { lte: futureDate, gte: new Date() }, status: { not: 'EXPIRED' } },
      include: { employee: { select: { firstName: true, lastName: true, email: true } } },
    });
  }
}

export const documentTemplateService = new DocumentTemplateService();
export const documentGenerationService = new DocumentGenerationService();
