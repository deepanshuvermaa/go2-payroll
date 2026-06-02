import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { config } from '../../config';

export class BankingService {
  async addAccount(orgId: string, data: any) {
    return prisma.orgBankAccount.create({ data: { ...data, orgId } });
  }

  async getAccounts(orgId: string) {
    return prisma.orgBankAccount.findMany({ where: { orgId, isActive: true } });
  }

  async createPaymentBatch(payrollRunId: string, bankAccountId: string) {
    const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run || run.status !== 'FINALIZED') throw new AppError(400, 'Payroll must be finalized');

    const records = await prisma.payrollRecord.findMany({
      where: { payrollRunId },
      include: { employee: { select: { id: true, bankAccountNo: true, bankIfsc: true, firstName: true, lastName: true } } },
    });

    const batch = await prisma.paymentBatch.create({
      data: { payrollRunId, bankAccountId, totalAmount: run.totalNet, totalTransactions: records.length },
    });

    for (const r of records) {
      if (r.employee.bankAccountNo && r.employee.bankIfsc) {
        await prisma.paymentTransaction.create({
          data: { batchId: batch.id, employeeId: r.employeeId, amount: r.netPay, bankAccount: r.employee.bankAccountNo, ifsc: r.employee.bankIfsc },
        });
      }
    }
    return batch;
  }

  async generateNEFTFile(batchId: string) {
    const batch = await prisma.paymentBatch.findUnique({ where: { id: batchId }, include: { transactions: true, bankAccount: true } });
    if (!batch) throw new AppError(404, 'Batch not found');

    let content = `H~${batch.bankAccount.accountNo}~${batch.bankAccount.ifsc}~NEFT~${new Date().toISOString().split('T')[0]}\n`;
    for (const txn of batch.transactions) {
      content += `D~${txn.bankAccount}~${txn.ifsc}~${txn.amount}~${txn.employeeId}~SALARY\n`;
    }
    return { content, filename: `NEFT_${batchId}.txt` };
  }

  async getPaymentStatus(batchId: string) {
    const batch = await prisma.paymentBatch.findUnique({ where: { id: batchId }, include: { transactions: true } });
    if (!batch) throw new AppError(404, 'Batch not found');
    return {
      ...batch,
      completed: batch.transactions.filter(t => t.status === 'SUCCESS').length,
      pending: batch.transactions.filter(t => t.status === 'PENDING').length,
      failed: batch.transactions.filter(t => t.status === 'FAILED').length,
    };
  }

  async retryFailed(batchId: string) {
    const failed = await prisma.paymentTransaction.findMany({ where: { batchId, status: 'FAILED' } });
    for (const txn of failed) {
      await prisma.paymentTransaction.update({ where: { id: txn.id }, data: { status: 'PENDING', failureReason: null } });
    }
    return { retried: failed.length };
  }
}

export class RazorpayXService {
  private baseUrl = 'https://api.razorpay.com/v1';

  async initiatePayout(batchId: string) {
    if (!config.razorpayX.keyId) throw new AppError(500, 'RazorpayX not configured');

    const transactions = await prisma.paymentTransaction.findMany({ where: { batchId, status: 'PENDING' } });

    for (const txn of transactions) {
      try {
        // In production, this would call RazorpayX API
        await prisma.paymentTransaction.update({ where: { id: txn.id }, data: { status: 'PROCESSING' } });
      } catch (err: any) {
        await prisma.paymentTransaction.update({ where: { id: txn.id }, data: { status: 'FAILED', failureReason: err.message } });
      }
    }

    await prisma.paymentBatch.update({ where: { id: batchId }, data: { status: 'PROCESSING' } });
    return { initiated: transactions.length };
  }

  async webhookHandler(event: any) {
    if (event.event === 'payout.processed') {
      const refNo = event.payload?.payout?.entity?.reference_id;
      if (refNo) {
        await prisma.paymentTransaction.updateMany({ where: { referenceNo: refNo }, data: { status: 'SUCCESS', processedAt: new Date() } });
      }
    }
    if (event.event === 'payout.failed') {
      const refNo = event.payload?.payout?.entity?.reference_id;
      if (refNo) {
        await prisma.paymentTransaction.updateMany({ where: { referenceNo: refNo }, data: { status: 'FAILED', failureReason: event.payload?.payout?.entity?.failure_reason } });
      }
    }
  }
}

export const bankingService = new BankingService();
export const razorpayXService = new RazorpayXService();
