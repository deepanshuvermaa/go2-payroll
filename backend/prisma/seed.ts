import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default organization
  const org = await prisma.organization.create({
    data: {
      name: 'Go2 Technologies',
      legalName: 'Go2 Technologies Pvt Ltd',
      email: 'admin@go2payroll.com',
      state: 'Maharashtra',
      city: 'Mumbai',
      country: 'India',
    },
  });

  // Create admin user
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.create({
    data: { orgId: org.id, email: 'admin@go2payroll.com', passwordHash, role: 'ORG_ADMIN' },
  });

  // Create departments
  const hrDept = await prisma.department.create({ data: { orgId: org.id, name: 'Human Resources' } });
  const engDept = await prisma.department.create({ data: { orgId: org.id, name: 'Engineering' } });
  const finDept = await prisma.department.create({ data: { orgId: org.id, name: 'Finance' } });

  // Create designations
  const ceo = await prisma.designation.create({ data: { orgId: org.id, name: 'CEO', grade: 1, level: 1 } });
  const manager = await prisma.designation.create({ data: { orgId: org.id, name: 'Manager', grade: 3, level: 3 } });
  const executive = await prisma.designation.create({ data: { orgId: org.id, name: 'Executive', grade: 5, level: 5 } });

  // Create branch
  const hq = await prisma.branch.create({ data: { orgId: org.id, name: 'Head Office', city: 'Mumbai', state: 'Maharashtra' } });

  // Create admin employee
  await prisma.employee.create({
    data: { orgId: org.id, userId: adminUser.id, employeeCode: 'EMP-001', firstName: 'Admin', lastName: 'User', email: 'admin@go2payroll.com', dateOfJoining: new Date(), departmentId: hrDept.id, designationId: ceo.id, branchId: hq.id },
  });

  // Create default leave types
  const leaveTypes = [
    { orgId: org.id, name: 'Casual Leave', code: 'CL', daysPerYear: 12, carryForwardMax: 3, encashable: false },
    { orgId: org.id, name: 'Sick Leave', code: 'SL', daysPerYear: 12, carryForwardMax: 6, encashable: false, documentRequired: true },
    { orgId: org.id, name: 'Earned Leave', code: 'EL', daysPerYear: 15, carryForwardMax: 30, encashable: true },
    { orgId: org.id, name: 'Maternity Leave', code: 'ML', daysPerYear: 182, carryForwardMax: 0, encashable: false, applicableGender: 'FEMALE' as any },
    { orgId: org.id, name: 'Paternity Leave', code: 'PL', daysPerYear: 15, carryForwardMax: 0, encashable: false, applicableGender: 'MALE' as any },
  ];
  for (const lt of leaveTypes) await prisma.leaveType.create({ data: lt });

  // Create default salary components
  const components = [
    { orgId: org.id, name: 'Basic Salary', code: 'BASIC', type: 'EARNING' as any, calculationType: 'PERCENTAGE_OF_CTC' as any, percentage: 40, isTaxable: true },
    { orgId: org.id, name: 'HRA', code: 'HRA', type: 'EARNING' as any, calculationType: 'PERCENTAGE_OF_BASIC' as any, percentage: 50, isTaxable: true },
    { orgId: org.id, name: 'Special Allowance', code: 'SPECIAL', type: 'EARNING' as any, calculationType: 'FIXED' as any, isTaxable: true },
    { orgId: org.id, name: 'Conveyance', code: 'CONVEYANCE', type: 'EARNING' as any, calculationType: 'FIXED' as any, fixedAmount: 1600, isTaxable: false },
    { orgId: org.id, name: 'PF (Employee)', code: 'PF_EE', type: 'DEDUCTION' as any, calculationType: 'PERCENTAGE_OF_BASIC' as any, percentage: 12, isStatutory: true, isTaxable: false },
    { orgId: org.id, name: 'PF (Employer)', code: 'PF_ER', type: 'EMPLOYER_CONTRIBUTION' as any, calculationType: 'PERCENTAGE_OF_BASIC' as any, percentage: 12, isStatutory: true, isTaxable: false },
  ];
  for (const c of components) await prisma.salaryComponent.create({ data: c });

  // Create default shift
  await prisma.shift.create({ data: { orgId: org.id, name: 'General Shift', startTime: '09:00', endTime: '18:00', graceMinutes: 15 } });

  console.log('✅ Seed completed!');
  console.log(`   Organization: ${org.name} (${org.id})`);
  console.log(`   Admin: admin@go2payroll.com / Admin@123`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
