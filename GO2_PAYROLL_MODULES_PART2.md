## PART 2: COMPLETE MODULE BREAKDOWN (Functions & Methods)

---

### MODULE 1: AUTHENTICATION & AUTHORIZATION

#### Functions:
```
AuthService:
  - register(orgName, email, password, phone) → creates org + admin user
  - login(email, password) → returns {accessToken, refreshToken, user, org}
  - refreshToken(refreshToken) → new accessToken
  - forgotPassword(email) → sends reset link via email
  - resetPassword(token, newPassword) → updates password
  - enableMFA(userId) → generates QR code for authenticator app
  - verifyMFA(userId, code) → validates TOTP code
  - logout(userId, deviceId) → invalidates session
  - changePassword(userId, oldPassword, newPassword)

RBACService:
  - createRole(orgId, name, permissions[])
  - assignRole(userId, roleId, branchId?)
  - removeRole(userId, roleId)
  - checkPermission(userId, module, action) → boolean
  - getPermissions(userId) → permission[]
  - getRoleHierarchy(orgId) → role tree

SessionService:
  - createSession(userId, device, ip) → sessionId
  - validateSession(sessionId) → boolean
  - listActiveSessions(userId) → session[]
  - terminateSession(sessionId)
  - terminateAllSessions(userId)
```

#### Middleware:
```
  - authMiddleware → validates JWT, attaches user to request
  - rbacMiddleware(module, action) → checks permission
  - orgMiddleware → ensures user belongs to org
  - rateLimiter → prevents brute force (100 req/15min)
  - auditMiddleware → logs all write operations
```

---

### MODULE 2: EMPLOYEE MANAGEMENT (Core HR)

#### Functions:
```
EmployeeService:
  - create(orgId, employeeData) → employee
  - update(employeeId, data) → employee
  - deactivate(employeeId, reason, lastDate)
  - getById(employeeId) → employee with relations
  - list(orgId, filters, pagination, sort) → {employees[], total}
  - search(orgId, query) → employees[]
  - bulkImport(orgId, csvFile) → {success: n, errors: []}
  - export(orgId, filters, format) → file buffer
  - getOrgChart(orgId) → tree structure
  - transfer(employeeId, newDeptId, newBranchId, effectiveDate)
  - promote(employeeId, newDesignationId, effectiveDate, newSalary?)
  - getTimeline(employeeId) → events[] (joins, promotions, transfers, exits)

DocumentService:
  - upload(employeeId, docType, file) → document
  - verify(documentId, verifiedBy) → document
  - getByEmployee(employeeId) → documents[]
  - checkExpiring(orgId, daysAhead) → documents[] (visa, license expiry alerts)
  - delete(documentId)

NominationService:
  - addNomination(employeeId, data)
  - updateNomination(nominationId, data)
  - getNominations(employeeId) → nominations[]
```

---

### MODULE 3: ATTENDANCE MANAGEMENT

#### Functions:
```
AttendanceService:
  - checkIn(employeeId, source, location?, selfieUrl?) → record
  - checkOut(employeeId) → record (calculates work hours)
  - markAttendance(employeeId, date, status, adminId) → record
  - bulkMark(orgId, date, employeeIds[], status) → records[]
  - getByDate(orgId, date) → records[]
  - getByEmployee(employeeId, month, year) → records[]
  - getMonthlySummary(employeeId, month, year) → {present, absent, halfDay, leave, lateMarks, otHours}
  - getOrgSummary(orgId, date) → {total, present, absent, onLeave, notMarked}
  - autoMarkAbsent(orgId, date) → marks unmarked employees as absent
  - calculateOvertime(employeeId, month, year) → {hours, amount}
  - lockAttendance(orgId, month, year) → prevents further edits

AttendanceRegularizationService:
  - apply(employeeId, date, requestedStatus, reason) → request
  - approve(requestId, approverId) → updates attendance record
  - reject(requestId, approverId, reason)
  - getPending(approverId) → requests[]

GeofenceService:
  - addGeofence(orgId, branchId, lat, lng, radiusMeters)
  - validateLocation(employeeId, lat, lng) → {valid, distance, branch}
  - getGeofences(orgId) → geofences[]

BiometricIntegrationService:
  - syncDevice(orgId, deviceId, deviceType) → registers device
  - processLog(deviceId, employeeCode, timestamp, type) → attendance record
  - getDeviceStatus(orgId) → devices[]
  - mapEmployeeToDevice(employeeId, biometricId)
```

---

### MODULE 4: LEAVE MANAGEMENT

#### Functions:
```
LeaveService:
  - apply(employeeId, leaveTypeId, fromDate, toDate, reason, docUrl?) → application
  - approve(applicationId, approverId) → updates balance, marks attendance
  - reject(applicationId, approverId, reason)
  - cancel(applicationId, employeeId) → restores balance
  - getBalance(employeeId, year?) → balances[]
  - getCalendar(orgId, month, year) → who's on leave per day
  - getTeamLeaves(managerId, month, year) → team leave calendar
  - checkConflict(employeeId, fromDate, toDate) → {hasConflict, existingLeaves}
  - calculateDays(fromDate, toDate, halfDay?, holidays[]) → number

LeaveAccrualService:
  - runMonthlyAccrual(orgId, month, year) → credits leave balances
  - runAnnualReset(orgId, year) → resets/carries forward/lapses
  - carryForward(orgId, fromYear, toYear) → processes carry forward
  - getAccrualHistory(employeeId) → accrual records[]

LeaveEncashmentService:
  - calculate(employeeId, leaveTypeId, days) → amount
  - process(employeeId, leaveTypeId, days) → encashment record
  - bulkProcess(orgId, leaveTypeId) → processes for all eligible

CompOffService:
  - credit(employeeId, workedDate, reason, days) → comp_off record
  - approve(compOffId, approverId)
  - getBalance(employeeId) → available comp-offs
  - expire(orgId) → expires old comp-offs past expiry date
```

---

### MODULE 5: PAYROLL PROCESSING

#### Functions:
```
PayrollService:
  - initializeRun(orgId, month, year, initiatedBy) → payroll_run
  - processEmployee(payrollRunId, employeeId) → payroll_record
  - processAll(payrollRunId) → processes all active employees
  - calculateGross(employeeId, paidDays, workingDays) → earnings breakdown
  - calculateDeductions(employeeId, grossEarnings, month, year) → deductions breakdown
  - calculateEmployerContributions(employeeId, gross) → {pf, esi, gratuity}
  - applyLOP(employeeId, lopDays, workingDays) → deduction amount
  - applyOvertime(employeeId, otHours, otRate) → earning amount
  - applyArrears(employeeId, month, year) → arrears amount
  - recoverAdvance(employeeId, payrollRecordId) → deduction
  - recoverLoanEMI(employeeId, payrollRecordId) → deduction
  - addBonus(employeeId, payrollRecordId, amount, type)
  - addIncentive(employeeId, payrollRecordId, amount, schemeId)
  - finalizeRun(payrollRunId, approvedBy) → locks payroll
  - revertRun(payrollRunId) → unlocks (only if not paid)
  - getPayslip(payrollRecordId) → formatted payslip data
  - generatePayslipPDF(payrollRecordId) → PDF buffer
  - emailPayslips(payrollRunId) → sends to all employees
  - whatsappPayslips(payrollRunId) → sends via WhatsApp API
  - getVarianceReport(orgId, month1, year1, month2, year2) → differences

PayrollValidationService:
  - preRunChecks(orgId, month, year) → {ready, issues[]}
    -- checks: attendance locked, leaves approved, new joiners configured, exits processed
  - validateRecord(payrollRecordId) → {valid, warnings[], errors[]}
  - flagAnomalies(payrollRunId) → records with unusual amounts

PayrollSchedulerService:
  - scheduleRun(orgId, dayOfMonth, autoApprove) → cron job
  - getSchedule(orgId) → schedule config
  - cancelSchedule(orgId)
  - runPrePayrollChecklist(orgId) → sends reminders for pending items
```

---

### MODULE 6: SALARY STRUCTURE & CTC

#### Functions:
```
SalaryStructureService:
  - createTemplate(orgId, name, components[]) → template
  - assignToEmployee(employeeId, templateId, ctc, effectiveFrom) → structure
  - revise(employeeId, newCtc, effectiveFrom, reason) → new structure
  - bulkRevise(orgId, revisions[]) → results
  - calculateBreakdown(templateId, ctc) → component-wise breakdown
  - getHistory(employeeId) → salary revisions timeline
  - compareStructures(structureId1, structureId2) → differences
  - simulateCTC(templateId, ctc) → full breakdown with tax estimate

SalaryComponentService:
  - create(orgId, componentData) → component
  - update(componentId, data)
  - list(orgId) → components[]
  - getStandard() → default Indian components (Basic, HRA, DA, Conveyance, etc.)

FlexiBenefitsService:
  - getEligibleComponents(employeeId) → flexi components with limits
  - submitDeclaration(employeeId, allocations[]) → saves choices
  - getDeclaration(employeeId, fy) → current allocation
  - calculateTaxSaving(employeeId, allocations[]) → estimated saving
```

---

### MODULE 7: TAX & COMPLIANCE

#### Functions:
```
TaxService:
  - calculateIncomeTax(employeeId, fy, regime) → {taxable, tax, cess, surcharge, monthly_tds}
  - compareRegimes(employeeId, fy) → {oldRegime, newRegime, recommendation}
  - submitDeclaration(employeeId, fy, declarations) → declaration record
  - submitProof(declarationId, section, amount, proofFile) → proof record
  - verifyProof(proofId, verifiedBy, approvedAmount) → updates TDS
  - recalculateTDS(employeeId, fy) → updated monthly TDS
  - generateForm16PartA(employeeId, fy) → PDF
  - generateForm16PartB(employeeId, fy) → PDF
  - bulkGenerateForm16(orgId, fy) → zip file
  - getForm12BB(employeeId, fy) → investment declaration form
  - calculateHRAExemption(employeeId) → exemption amount
  - calculateLTAExemption(employeeId, claimAmount) → exemption

PFService:
  - calculatePF(employeeId, basicWage) → {employeeShare, employerShare, eps, edli}
  - generateECR(orgId, month, year) → ECR file (text format for EPFO upload)
  - getMonthlyStatement(orgId, month, year) → PF summary
  - getEmployeeStatement(employeeId, fy) → annual PF statement
  - fileECR(orgId, month, year) → submits to EPFO (if API available)

ESIService:
  - calculateESI(employeeId, grossWage) → {employeeShare, employerShare}
  - isApplicable(employeeId) → boolean (based on wage ceiling ₹21,000)
  - generateChallan(orgId, month, year) → ESI challan data
  - getContributionRegister(orgId, halfYear) → register

PTService:
  - calculatePT(employeeId, state, grossSalary) → amount (state-wise slabs)
  - generateChallan(orgId, state, month, year) → PT challan
  - getStateSlabs(state) → slab table

TDSService:
  - calculate24Q(orgId, quarter, fy) → Form 24Q data
  - generateFVU(orgId, quarter, fy) → FVU file for TDS return filing
  - getChallanDetails(orgId, month, year) → TDS challan info

GratuityService:
  - calculate(employeeId) → {eligible, years, amount}
  - isEligible(employeeId) → boolean (5+ years)
  - getProjected(employeeId) → projected gratuity at retirement

LWFService:  -- Labour Welfare Fund
  - calculate(employeeId, state) → {employeeShare, employerShare}
  - generateChallan(orgId, state, halfYear) → LWF challan
```

---

### MODULE 8: BANKING & PAYMENTS

#### Functions:
```
BankingService:
  - addAccount(orgId, accountData) → bank account
  - createPaymentBatch(payrollRunId, bankAccountId) → batch
  - generateNEFTFile(batchId) → NEFT text file
  - generateRTGSFile(batchId) → RTGS text file
  - generateIMPSFile(batchId) → IMPS file
  - processViaRazorpayX(batchId) → initiates payout via API
  - processViaICICI(batchId) → initiates via ICICI Corporate Banking API
  - getPaymentStatus(batchId) → {completed, pending, failed, transactions[]}
  - reconcile(batchId, bankStatement) → matches payments
  - retryFailed(batchId) → retries failed transactions
  - downloadBankAdvice(batchId) → PDF bank advice letter

RazorpayXIntegration:
  - createContact(employeeId) → razorpay contact
  - createFundAccount(employeeId, bankDetails) → fund account
  - initiatePayout(fundAccountId, amount, narration) → payout
  - getPayoutStatus(payoutId) → status
  - webhookHandler(event) → processes payment callbacks
```

---

### MODULE 9: EMPLOYEE SELF-SERVICE (ESS) PORTAL

#### Functions:
```
ESSService:
  - getDashboard(employeeId) → {profile, quickActions, announcements, pendingTasks}
  - getPayslips(employeeId, year?) → payslips[]
  - downloadPayslip(payslipId) → PDF
  - getAttendanceSummary(employeeId, month, year) → summary
  - getLeaveBalance(employeeId) → balances[]
  - applyLeave(employeeId, data) → application
  - getLeaveHistory(employeeId) → applications[]
  - getTaxSummary(employeeId, fy) → tax computation
  - submitTaxDeclaration(employeeId, fy, data)
  - uploadTaxProof(employeeId, section, file)
  - getLoanStatus(employeeId) → loans[]
  - getAdvanceStatus(employeeId) → advances[]
  - submitReimbursement(employeeId, data) → claim
  - submitExpenseReport(employeeId, data) → report
  - updateProfile(employeeId, allowedFields) → limited self-update
  - downloadForm16(employeeId, fy) → PDF
  - getAnnouncements(orgId) → announcements[]
  - getHolidayCalendar(employeeId) → holidays[]
  - requestLetterGeneration(employeeId, letterType) → request
  - getITDeclarationStatus(employeeId, fy) → status with deadlines

ESSMobileService:
  - punchIn(employeeId, lat, lng, selfieBase64) → attendance
  - punchOut(employeeId, lat, lng) → attendance
  - getQuickStats(employeeId) → {presentDays, leaveBalance, pendingApprovals}
  - registerDevice(employeeId, fcmToken) → for push notifications
```
