import { z } from 'zod';

// Auth
export const loginSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(4) }) });
export const registerSchema = z.object({ body: z.object({ email: z.string().email(), password: z.string().min(6), orgId: z.string().optional(), firstName: z.string().min(1), lastName: z.string().optional(), role: z.string().optional() }) });

// Employee
export const createEmployeeSchema = z.object({ body: z.object({ employeeCode: z.string().min(1), firstName: z.string().min(1), lastName: z.string(), email: z.string().email(), dateOfJoining: z.string(), phone: z.string().optional(), gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(), employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'CONSULTANT']).optional(), departmentId: z.string().optional(), designationId: z.string().optional(), branchId: z.string().optional() }) });

// Attendance
export const markAttendanceSchema = z.object({ body: z.object({ employeeId: z.string().uuid(), date: z.string(), status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF']) }) });
export const bulkMarkSchema = z.object({ body: z.object({ date: z.string(), employeeIds: z.array(z.string()), status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEK_OFF']) }) });

// Leave
export const applyLeaveSchema = z.object({ body: z.object({ leaveTypeId: z.string(), fromDate: z.string(), toDate: z.string(), reason: z.string().min(1), isHalfDay: z.boolean().optional(), documentUrl: z.string().optional() }) });

// Payroll
export const initializePayrollSchema = z.object({ body: z.object({ month: z.number().min(1).max(12), year: z.number().min(2020).max(2100) }) });

// Salary
export const assignSalarySchema = z.object({ body: z.object({ employeeId: z.string(), templateId: z.string(), ctc: z.number().positive(), effectiveFrom: z.string() }) });
export const reviseSalarySchema = z.object({ body: z.object({ employeeId: z.string(), newCtc: z.number().positive(), effectiveFrom: z.string(), reason: z.string().min(1) }) });

// Tax
export const taxDeclarationSchema = z.object({ body: z.object({ fy: z.string(), declarations: z.record(z.any()) }) });

// Banking
export const addBankAccountSchema = z.object({ body: z.object({ bankName: z.string().min(1), accountNo: z.string().min(5), ifsc: z.string().min(11).max(11), accountType: z.string().optional() }) });

// Expense
export const createExpenseSchema = z.object({ body: z.object({ title: z.string().min(1), fromDate: z.string(), toDate: z.string() }) });

// Approval
export const approvalActionSchema = z.object({ body: z.object({ action: z.enum(['APPROVED', 'REJECTED']), comments: z.string().optional() }) });
