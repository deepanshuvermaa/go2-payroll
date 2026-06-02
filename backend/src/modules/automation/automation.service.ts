import prisma from '../../config/database';
import { NotificationService, EmailService } from '../notifications/notification.service';
import cron from 'node-cron';

const notifService = new NotificationService();
const emailService = new EmailService();

export class AutomationService {
  // Run on 28th of every month at 8am — auto-schedule payroll
  schedulePayrollCron() {
    cron.schedule('0 8 28 * *', async () => {
      console.log('[CRON] Running scheduled payroll for all orgs...');
      try {
        const orgs = await prisma.organization.findMany({ where: { isActive: true } });
        const now = new Date();
        for (const org of orgs) {
          const existing = await prisma.payrollRun.findFirst({
            where: { orgId: org.id, month: now.getMonth() + 1, year: now.getFullYear(), status: { not: 'CANCELLED' } }
          });
          if (!existing) {
            await prisma.payrollRun.create({
              data: { orgId: org.id, month: now.getMonth() + 1, year: now.getFullYear(), status: 'DRAFT', initiatedById: 'SYSTEM' }
            });
            // Notify admins
            const admins = await prisma.user.findMany({ where: { orgId: org.id, role: { in: ['ORG_ADMIN', 'HR_MANAGER'] } } });
            for (const admin of admins) {
              await notifService.send(admin.id, 'IN_APP', 'Scheduled Payroll Initiated', `Payroll for ${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()} has been auto-initiated. Please review and process.`);
            }
          }
        }
      } catch (e) { console.error('[CRON] Payroll cron failed:', e); }
    });
  }

  // Run on 1st of every month at 1am — auto leave accrual
  scheduleLeaveAccrualCron() {
    cron.schedule('0 1 1 * *', async () => {
      console.log('[CRON] Running leave accrual for all orgs...');
      try {
        const orgs = await prisma.organization.findMany({ where: { isActive: true } });
        const now = new Date();
        for (const org of orgs) {
          const leaveTypes = await prisma.leaveType.findMany({ where: { orgId: org.id, accrualBased: true } });
          const employees = await prisma.employee.findMany({ where: { orgId: org.id, status: 'ACTIVE' } });
          for (const lt of leaveTypes) {
            const monthlyAccrual = (lt.maxDays || 12) / 12;
            for (const emp of employees) {
              await prisma.leaveBalance.upsert({
                where: { employeeId_leaveTypeId_year: { employeeId: emp.id, leaveTypeId: lt.id, year: now.getFullYear() } },
                create: { employeeId: emp.id, leaveTypeId: lt.id, year: now.getFullYear(), totalDays: monthlyAccrual, usedDays: 0, balance: monthlyAccrual },
                update: { totalDays: { increment: monthlyAccrual }, balance: { increment: monthlyAccrual } },
              });
            }
          }
        }
      } catch (e) { console.error('[CRON] Leave accrual cron failed:', e); }
    });
  }

  // Run daily at 9am — birthday & anniversary emails
  scheduleBirthdayAnniversaryCron() {
    cron.schedule('0 9 * * *', async () => {
      console.log('[CRON] Checking birthdays & anniversaries...');
      try {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const employees = await prisma.employee.findMany({
          where: { status: 'ACTIVE' },
          include: { user: { select: { email: true } } },
        });
        for (const emp of employees) {
          // Birthday
          if (emp.dateOfBirth) {
            const dob = new Date(emp.dateOfBirth);
            if (dob.getMonth() + 1 === month && dob.getDate() === day) {
              if (emp.user?.email) {
                await emailService.send(emp.user.email, '🎂 Happy Birthday!', `<p>Dear ${emp.firstName},</p><p>Wishing you a very Happy Birthday! 🎉 Hope you have a wonderful day!</p><p>With warm wishes,<br>Go2-Payroll Team</p>`);
              }
              if (emp.userId) {
                await notifService.send(emp.userId, 'IN_APP', '🎂 Happy Birthday!', `Happy Birthday, ${emp.firstName}! Wishing you a wonderful day!`);
              }
            }
          }
          // Work anniversary
          if (emp.dateOfJoining) {
            const doj = new Date(emp.dateOfJoining);
            if (doj.getMonth() + 1 === month && doj.getDate() === day && doj.getFullYear() !== today.getFullYear()) {
              const years = today.getFullYear() - doj.getFullYear();
              if (emp.user?.email) {
                await emailService.send(emp.user.email, `🎉 ${years} Year Work Anniversary!`, `<p>Dear ${emp.firstName},</p><p>Congratulations on completing ${years} ${years === 1 ? 'year' : 'years'} with us! 🎊 Thank you for your valuable contribution.</p><p>Best regards,<br>Go2-Payroll Team</p>`);
              }
            }
          }
        }
      } catch (e) { console.error('[CRON] Birthday cron failed:', e); }
    });
  }

  // Run daily at 10am — probation reminder 7 days before end
  scheduleProbationReminderCron() {
    cron.schedule('0 10 * * *', async () => {
      console.log('[CRON] Checking probation end dates...');
      try {
        const sevenDaysLater = new Date();
        sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
        const start = new Date(sevenDaysLater); start.setHours(0,0,0,0);
        const end = new Date(sevenDaysLater); end.setHours(23,59,59,999);
        const employees = await prisma.employee.findMany({
          where: { probationEndDate: { gte: start, lte: end }, status: 'ACTIVE' },
        });
        for (const emp of employees) {
          const hrAdmins = await prisma.user.findMany({ where: { orgId: emp.orgId, role: { in: ['ORG_ADMIN', 'HR_MANAGER'] } } });
          for (const admin of hrAdmins) {
            await notifService.send(admin.id, 'IN_APP', 'Probation Ending Soon', `${emp.firstName} ${emp.lastName}'s probation period ends on ${new Date(emp.probationEndDate!).toLocaleDateString()}. Please take action.`);
          }
        }
      } catch (e) { console.error('[CRON] Probation cron failed:', e); }
    });
  }

  // Run daily at 11am — document expiry alerts (30 days before)
  scheduleDocumentExpiryCron() {
    cron.schedule('0 11 * * *', async () => {
      console.log('[CRON] Checking document expiry...');
      try {
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        const docs = await prisma.employeeDocument.findMany({
          where: { expiryDate: { lte: thirtyDaysLater, gte: new Date() } },
          include: { employee: { include: { user: { select: { id: true, email: true } } } } },
        });
        for (const doc of docs) {
          if (doc.employee?.userId) {
            await notifService.send(doc.employee.userId, 'IN_APP', 'Document Expiring Soon', `Your ${doc.type} document expires on ${new Date(doc.expiryDate!).toLocaleDateString()}. Please renew it.`);
          }
          // Notify HR too
          const hrs = await prisma.user.findMany({ where: { orgId: doc.employee.orgId, role: 'HR_MANAGER' } });
          for (const hr of hrs) {
            await notifService.send(hr.id, 'IN_APP', 'Employee Document Expiring', `${doc.employee.firstName} ${doc.employee.lastName}'s ${doc.type} expires on ${new Date(doc.expiryDate!).toLocaleDateString()}.`);
          }
        }
      } catch (e) { console.error('[CRON] Doc expiry cron failed:', e); }
    });
  }

  // 6-month confirmation check — run on 1st of every month
  scheduleConfirmationCheckCron() {
    cron.schedule('0 2 1 * *', async () => {
      console.log('[CRON] Checking 6-month confirmations...');
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const start = new Date(sixMonthsAgo); start.setDate(1); start.setHours(0,0,0,0);
        const end = new Date(sixMonthsAgo); end.setDate(new Date(end.getFullYear(), end.getMonth()+1,0).getDate()); end.setHours(23,59,59,999);
        const employees = await prisma.employee.findMany({
          where: { dateOfJoining: { gte: start, lte: end }, status: 'ACTIVE', employmentType: 'PROBATION' },
        });
        for (const emp of employees) {
          const hrAdmins = await prisma.user.findMany({ where: { orgId: emp.orgId, role: { in: ['ORG_ADMIN', 'HR_MANAGER'] } } });
          for (const admin of hrAdmins) {
            await notifService.send(admin.id, 'IN_APP', 'Confirmation Due', `${emp.firstName} ${emp.lastName} has completed 6 months. Please initiate confirmation process.`);
          }
        }
      } catch (e) { console.error('[CRON] Confirmation check failed:', e); }
    });
  }

  startAll() {
    this.schedulePayrollCron();
    this.scheduleLeaveAccrualCron();
    this.scheduleBirthdayAnniversaryCron();
    this.scheduleProbationReminderCron();
    this.scheduleDocumentExpiryCron();
    this.scheduleConfirmationCheckCron();
    console.log('[AUTOMATION] All cron jobs scheduled');
  }
}

export const automationService = new AutomationService();
