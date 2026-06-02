import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authenticate, authorize } from '../../middleware/auth';
import prisma from '../../config/database';

const router = Router();

// Tally Export
router.get('/tally/journal-voucher/:payrollRunId', authenticate, authorize('ORG_ADMIN', 'FINANCE_MANAGER'), asyncHandler(async (req: any, res: any) => {
  const records = await prisma.payrollRecord.findMany({ where: { payrollRunId: req.params.payrollRunId }, include: { employee: { select: { firstName: true, lastName: true } } } });
  const totalSalary = records.reduce((s, r) => s + r.grossEarnings, 0);
  const totalPF = records.reduce((s, r) => s + r.pfEmployee + r.pfEmployer, 0);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER>
  <BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC>
  <REQUESTDATA><TALLYMESSAGE>
    <VOUCHER VCHTYPE="Journal" ACTION="Create">
      <DATE>${new Date().toISOString().split('T')[0].replace(/-/g, '')}</DATE>
      <NARRATION>Salary for payroll run</NARRATION>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>Salary Expense</LEDGERNAME><ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE><AMOUNT>-${totalSalary}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>PF Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${totalPF}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>Salary Payable</LEDGERNAME><ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE><AMOUNT>${totalSalary - totalPF}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>
    </VOUCHER>
  </TALLYMESSAGE></REQUESTDATA></IMPORTDATA></BODY>
</ENVELOPE>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
}));

// Slack notification (stub)
router.post('/slack/notify', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  // In production: call Slack API with config.slack.botToken
  sendSuccess(res, { sent: true, channel: req.body.channel, message: req.body.message }, 'Notification queued');
}));

// Google Calendar sync (stub)
router.post('/google/sync-calendar', authenticate, asyncHandler(async (req: any, res: any) => {
  sendSuccess(res, { synced: true }, 'Calendar sync initiated');
}));

// Insurance (stub)
router.post('/insurance/add-employee', authenticate, authorize('ORG_ADMIN', 'HR_MANAGER'), asyncHandler(async (req: any, res: any) => {
  sendSuccess(res, { added: true, employeeId: req.body.employeeId }, 'Added to group policy');
}));

export default router;
