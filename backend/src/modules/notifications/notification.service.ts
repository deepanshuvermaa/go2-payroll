import prisma from '../../config/database';
import { config } from '../../config';
import nodemailer from 'nodemailer';

const transporter = config.smtp.host ? nodemailer.createTransport({ host: config.smtp.host, port: config.smtp.port, auth: { user: config.smtp.user, pass: config.smtp.pass } }) : null;

export class NotificationService {
  async send(userId: string, type: 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH' | 'WHATSAPP', title: string, message: string, data?: any) {
    return prisma.notification.create({ data: { userId, type, title, message, data } });
  }

  async sendBulk(userIds: string[], title: string, message: string) {
    return prisma.$transaction(userIds.map(userId => prisma.notification.create({ data: { userId, type: 'IN_APP', title, message } })));
  }

  async markRead(notificationId: string) {
    return prisma.notification.update({ where: { id: notificationId }, data: { isRead: true, readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
  }

  async getUnread(userId: string) {
    return prisma.notification.findMany({ where: { userId, isRead: false }, orderBy: { createdAt: 'desc' } });
  }

  async getAll(userId: string, page = 1, limit = 20) {
    return prisma.notification.findMany({ where: { userId }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } });
  }
}

export class EmailService {
  async send(to: string, subject: string, html: string) {
    if (!transporter) return { sent: false, reason: 'SMTP not configured' };
    await transporter.sendMail({ from: config.smtp.from, to, subject, html });
    return { sent: true };
  }

  async sendPayslip(email: string, employeeName: string, month: number, year: number, pdfBuffer?: Buffer) {
    const subject = `Payslip for ${month}/${year} - Go2-Payroll`;
    const html = `<p>Dear ${employeeName},</p><p>Your payslip for ${month}/${year} is attached.</p><p>Regards,<br>Go2-Payroll</p>`;
    if (!transporter) return { sent: false };
    const attachments = pdfBuffer ? [{ filename: `payslip_${month}_${year}.pdf`, content: pdfBuffer }] : [];
    await transporter.sendMail({ from: config.smtp.from, to: email, subject, html, attachments });
    return { sent: true };
  }

  async sendWelcomeEmail(email: string, name: string, tempPassword: string) {
    const subject = 'Welcome to Go2-Payroll';
    const html = `<p>Dear ${name},</p><p>Your account has been created. Login with:<br>Email: ${email}<br>Temporary Password: ${tempPassword}</p><p>Please change your password on first login.</p>`;
    return this.send(email, subject, html);
  }
}

export class SMSService {
  async send(phone: string, message: string) {
    if (!config.sms.apiKey) return { sent: false, reason: 'SMS not configured' };
    // Integration point for MSG91/Twilio
    console.log(`SMS to ${phone}: ${message}`);
    return { sent: true };
  }

  async sendSalaryCredit(phone: string, amount: number) {
    return this.send(phone, `Your salary of ₹${amount} has been credited. - Go2-Payroll`);
  }
}

export class WhatsAppService {
  async send(phone: string, message: string) {
    if (!config.whatsapp.token) return { sent: false, reason: 'WhatsApp not configured' };
    // Integration point for Meta Business API
    console.log(`WhatsApp to ${phone}: ${message}`);
    return { sent: true };
  }

  async sendPayslip(phone: string, month: number, year: number) {
    return this.send(phone, `Your payslip for ${month}/${year} is ready. Check your Go2-Payroll app.`);
  }
}

export const notificationService = new NotificationService();
export const emailService = new EmailService();
export const smsService = new SMSService();
export const whatsAppService = new WhatsAppService();
