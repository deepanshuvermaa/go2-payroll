## PART 3: REMAINING MODULES & IMPLEMENTATION PLAN

---

### MODULE 10: ONBOARDING & OFFBOARDING

#### Functions:
```
OnboardingService:
  - createChecklist(orgId, name, items[]) → checklist
  - initiateOnboarding(employeeId, checklistId) → creates tasks
  - assignTask(taskId, assigneeId, dueDate)
  - completeTask(taskId, completedBy)
  - getProgress(employeeId) → {total, completed, pending, overdue}
  - sendReminders(orgId) → emails for overdue tasks
  - generateOfferLetter(candidateId, templateId, variables) → PDF
  - generateAppointmentLetter(employeeId, templateId) → PDF
  - collectDocuments(employeeId) → pending documents list
  - triggerITAssetAssignment(employeeId) → creates IT ticket

OffboardingService:
  - initiateExit(employeeId, resignationDate, lastWorkingDate, reason) → exit request
  - approveExit(exitRequestId, approverId)
  - calculateFnF(employeeId) → {basicDues, leaveEncashment, bonus, gratuity, noticePay, deductions, netPayable}
  - processFnF(employeeId, fnfData) → settlement record
  - generateExperienceLetter(employeeId) → PDF
  - generateRelievingLetter(employeeId) → PDF
  - revokeAccess(employeeId) → deactivates user, revokes sessions
  - conductExitSurvey(employeeId, responses)
  - getExitAnalytics(orgId, period) → attrition reasons breakdown
  - calculateGratuity(employeeId) → amount (if eligible)
  - calculateNoticePay(employeeId, servedDays) → recovery/payment amount
```

---

### MODULE 11: EXPENSE MANAGEMENT

#### Functions:
```
ExpenseService:
  - createReport(employeeId, title, fromDate, toDate) → report
  - addItem(reportId, itemData, receiptFile?) → expense item
  - submitReport(reportId) → triggers approval workflow
  - approveReport(reportId, approverId)
  - rejectReport(reportId, approverId, reason)
  - getByEmployee(employeeId, filters) → reports[]
  - getPendingApprovals(approverId) → reports[]
  - processPayment(reportId, payrollRunId?) → marks as paid
  - getAnalytics(orgId, period) → {byCategory, byDepartment, trends}
  - checkPolicy(employeeId, category, amount) → {allowed, limit, reason}
  - ocrReceipt(imageFile) → {merchant, amount, date, category} (AI-powered)

ExpensePolicyService:
  - create(orgId, policyData) → policy
  - update(policyId, data)
  - validate(employeeId, expenseItem) → {valid, violations[]}
  - getApplicable(employeeId, category) → policy
```

---

### MODULE 12: APPROVAL WORKFLOW ENGINE

#### Functions:
```
ApprovalWorkflowService:
  - createWorkflow(orgId, module, name, levels[], conditions[]) → workflow
  - updateWorkflow(workflowId, data)
  - getWorkflows(orgId) → workflows[]
  - triggerApproval(module, recordId, employeeId) → creates approval request
  - processAction(requestId, approverId, action, comments) → advances/completes
  - escalate(requestId) → moves to next level after SLA breach
  - delegate(approverId, delegateId, fromDate, toDate) → delegation
  - getPendingForUser(userId) → pending approvals across all modules
  - getHistory(module, recordId) → approval trail
  - getSLAReport(orgId) → {onTime, breached, avgTime}

ApprovalLevels:
  Level 1: Reporting Manager
  Level 2: Department Head
  Level 3: HR Manager
  Level 4: Finance Head
  Level 5: CEO/Director

Conditions:
  - amount > X → add finance approval
  - days > Y → add HR approval
  - department = Z → specific approver
  - designation_grade < N → skip level
```

---

### MODULE 13: REPORTS & ANALYTICS

#### Functions:
```
ReportService:
  - salaryRegister(orgId, month, year) → detailed salary report
  - attendanceRegister(orgId, month, year) → attendance report
  - leaveRegister(orgId, year) → leave utilization report
  - pfRegister(orgId, month, year) → PF contribution details
  - esiRegister(orgId, month, year) → ESI contribution details
  - ptRegister(orgId, state, month, year) → PT details
  - tdsRegister(orgId, month, year) → TDS deduction details
  - ctcRegister(orgId) → all employees CTC breakdown
  - bankAdvice(orgId, month, year) → bank-wise payment summary
  - loanOutstanding(orgId) → all active loans
  - advanceOutstanding(orgId) → all pending advances
  - bonusReport(orgId, year) → bonus disbursement summary
  - headcountReport(orgId, asOfDate) → department/designation wise
  - attritionReport(orgId, period) → exits with reasons
  - newJoinerReport(orgId, period) → new hires
  - varianceReport(orgId, month1, month2) → month-on-month differences
  - costToCompanyReport(orgId, period) → total employer cost
  - overtimeReport(orgId, month, year) → OT hours and cost
  - lateMarkReport(orgId, month, year) → late arrivals
  - absenteeismReport(orgId, period) → absence patterns
  - form16Summary(orgId, fy) → generation status
  - customReport(orgId, config) → user-defined report

ReportBuilderService:
  - getAvailableFields(module) → fields[]
  - buildQuery(config) → SQL/aggregation
  - execute(queryConfig) → data
  - saveTemplate(orgId, name, config) → saved report
  - schedule(reportId, frequency, recipients[]) → auto-email

ExportService:
  - toExcel(data, columns, sheetName) → xlsx buffer
  - toPDF(data, columns, title, orientation) → pdf buffer
  - toCSV(data, columns) → csv string
  - toJSON(data) → json string

AnalyticsService:
  - payrollCostTrend(orgId, months) → monthly cost data
  - departmentCostBreakdown(orgId, month, year) → dept-wise
  - salaryDistribution(orgId) → histogram data
  - genderPayGap(orgId) → comparison
  - tenureAnalysis(orgId) → tenure buckets
  - ageDistribution(orgId) → age buckets
  - attritionPrediction(orgId) → ML-based risk scores
  - budgetVsActual(orgId, month, year) → variance
  - compensationBenchmark(orgId) → market comparison
```

---

### MODULE 14: NOTIFICATIONS & COMMUNICATION

#### Functions:
```
NotificationService:
  - send(userId, type, title, message, data?) → notification
  - sendBulk(userIds[], type, title, message) → notifications[]
  - markRead(notificationId)
  - markAllRead(userId)
  - getUnread(userId) → notifications[]
  - getAll(userId, pagination) → notifications[]
  - getPreferences(userId) → preferences
  - updatePreferences(userId, preferences)

EmailService:
  - sendPayslip(employeeId, payslipPDF) → email
  - sendLeaveApproval(employeeId, leaveDetails) → email
  - sendWelcomeEmail(employeeId) → onboarding email
  - sendPasswordReset(email, resetLink) → email
  - sendReminder(userId, subject, body) → email
  - sendBulkPayslips(payrollRunId) → emails all employees
  - sendForm16(employeeId, fy, pdf) → email

SMSService:
  - sendOTP(phone, otp) → sms
  - sendAttendanceReminder(phone) → sms
  - sendSalaryCredit(phone, amount) → sms
  - sendLeaveStatus(phone, status) → sms

PushNotificationService:
  - send(userId, title, body, data?) → push
  - sendToTopic(topic, title, body) → push to group
  - registerToken(userId, fcmToken, platform)
  - removeToken(userId, fcmToken)

WhatsAppService:
  - sendPayslip(phone, payslipPDF) → whatsapp message
  - sendAttendanceReminder(phone) → whatsapp
  - sendLeaveBalance(phone, balances) → whatsapp
```

---

### MODULE 15: PERFORMANCE MANAGEMENT

#### Functions:
```
PerformanceService:
  - createCycle(orgId, name, type, startDate, endDate) → cycle
  - initializeReviews(cycleId) → creates review records for all employees
  - submitSelfReview(reviewId, ratings[], comments) → updates review
  - submitManagerReview(reviewId, ratings[], comments, finalRating)
  - calibrate(cycleId, departmentId, adjustments[]) → bell curve adjustment
  - getReviewStatus(cycleId) → {total, selfDone, managerDone, completed}
  - getEmployeeReview(employeeId, cycleId) → review details
  - getTeamReviews(managerId, cycleId) → team reviews
  - generatePIP(employeeId, areas[], timeline) → Performance Improvement Plan
  - linkToIncrement(cycleId, incrementRules) → maps ratings to % increment

GoalService:
  - create(employeeId, goalData) → goal
  - update(goalId, progress) → goal
  - getByEmployee(employeeId, cycleId?) → goals[]
  - getByTeam(managerId) → team goals
  - cascadeFromOrg(orgGoalId, employeeIds[]) → creates aligned goals

OKRService:
  - createObjective(employeeId, quarter, year, objective) → okr
  - addKeyResult(okrId, title, targetValue, unit) → key result
  - updateProgress(keyResultId, currentValue) → updates okr progress
  - getByQuarter(orgId, quarter, year) → all OKRs
  - getAlignment(orgId) → org → dept → individual alignment view
```

---

### MODULE 16: RECRUITMENT (ATS)

#### Functions:
```
RecruitmentService:
  - createJobPosting(orgId, jobData) → posting
  - publishJob(postingId, channels[]) → publishes to job boards
  - addCandidate(jobId, candidateData, resumeFile) → candidate
  - bulkImportCandidates(jobId, csvFile) → candidates[]
  - moveStage(candidateId, newStage) → updates pipeline
  - scheduleInterview(candidateId, round, interviewerId, dateTime) → interview
  - submitFeedback(interviewId, rating, feedback) → updates
  - generateOffer(candidateId, offerData) → offer letter
  - sendOffer(offerId) → emails offer to candidate
  - acceptOffer(offerId) → triggers onboarding
  - rejectOffer(offerId, reason)
  - getHiringPipeline(orgId) → funnel metrics
  - getTimeToHire(orgId, period) → average days
  - convertToEmployee(candidateId) → creates employee record from offer data
```

---

### MODULE 17: EMPLOYEE ENGAGEMENT

#### Functions:
```
EngagementService:
  - createSurvey(orgId, title, questions[], anonymous) → survey
  - publishSurvey(surveyId, targetEmployees[]) → sends survey
  - submitResponse(surveyId, employeeId, answers[]) → response
  - getSurveyResults(surveyId) → aggregated results
  - calculateENPS(orgId, surveyId) → eNPS score
  - getPulseTrend(orgId, months) → engagement trend

RecognitionService:
  - giveRecognition(fromId, toId, badgeId, message) → recognition
  - getRecognitions(employeeId) → received recognitions
  - getLeaderboard(orgId, period) → top recognized employees
  - getPoints(employeeId) → total points earned
  - redeemPoints(employeeId, rewardId) → redemption

AnnouncementService:
  - create(orgId, title, content, targetBranches[], targetDepts[]) → announcement
  - publish(announcementId) → sends to all targets
  - getActive(orgId) → current announcements
  - acknowledge(announcementId, employeeId) → marks as read
```

---

### MODULE 18: LEARNING & DEVELOPMENT

#### Functions:
```
LearningService:
  - createProgram(orgId, programData) → training program
  - enrollEmployee(programId, employeeId) → enrollment
  - bulkEnroll(programId, employeeIds[]) → enrollments[]
  - markComplete(enrollmentId, score?, certificateUrl?) → completion
  - getTrainingCalendar(orgId, month, year) → scheduled trainings
  - getEmployeeTrainings(employeeId) → history
  - getSkillGap(employeeId, targetDesignation) → gaps[]
  - recommendTraining(employeeId) → suggested programs based on gaps
  - getComplianceTraining(orgId) → mandatory trainings status
  - getCertificationExpiry(orgId, daysAhead) → expiring certs
```

---

### MODULE 19: DOCUMENT MANAGEMENT & GENERATION

#### Functions:
```
DocumentTemplateService:
  - create(orgId, type, name, htmlContent, variables[]) → template
  - update(templateId, htmlContent)
  - list(orgId) → templates[]
  - preview(templateId, sampleData) → rendered HTML

DocumentGenerationService:
  - generate(employeeId, templateId, customVariables?) → document
  - bulkGenerate(employeeIds[], templateId) → documents[]
  - getByEmployee(employeeId) → documents[]
  - addDigitalSignature(documentId, signatureImage) → signed document
  - sendForSignature(documentId, signerEmail) → e-sign request
  - downloadAsPDF(documentId) → PDF buffer

LetterTypes:
  - Offer Letter
  - Appointment Letter
  - Confirmation Letter
  - Increment Letter
  - Transfer Letter
  - Warning Letter
  - Termination Letter
  - Experience Letter
  - Relieving Letter
  - Salary Certificate
  - Employment Verification Letter
  - Bonafide Certificate
  - NOC (No Objection Certificate)
```

---

### MODULE 20: INTEGRATIONS

#### Functions:
```
TallyIntegration:
  - exportJournalVoucher(payrollRunId) → Tally XML format
  - exportPaymentVoucher(payrollRunId) → Tally XML
  - mapLedgers(orgId, mappings) → saves account mappings
  - syncEmployeeMasters(orgId) → pushes to Tally

ZohoBooksIntegration:
  - exportPayrollJournal(payrollRunId) → Zoho API call
  - syncEmployees(orgId) → syncs employee data
  - createBill(payrollRunId) → creates bill in Zoho

SlackIntegration:
  - sendNotification(channelId, message) → slack message
  - sendLeaveNotification(managerId, leaveDetails)
  - sendPayrollSummary(channelId, summary)
  - birthdayAnnouncement(channelId, employeeName)

GoogleWorkspaceIntegration:
  - syncCalendar(employeeId, events[]) → adds leave/holidays to calendar
  - createEmail(employeeId, email) → provisions Google Workspace account
  - suspendAccount(employeeId) → on exit

InsuranceIntegration:
  - addToGroupPolicy(employeeId, dependents[])
  - removeFromPolicy(employeeId)
  - getClaimStatus(employeeId) → claims[]
  - submitClaim(employeeId, claimData)
```

---

### MODULE 21: AI & AUTOMATION

#### Functions:
```
AIService:
  - detectPayrollAnomalies(payrollRunId) → {anomalies[], severity}
    -- flags: unusual salary changes, duplicate payments, outlier amounts
  - predictAttrition(orgId) → {employees[], riskScores[]}
  - suggestTaxOptimization(employeeId, fy) → suggestions[]
  - autoCategorizExpense(receiptImage) → {category, amount, merchant}
  - salaryBenchmark(designation, location, experience) → market range
  - chatbot(employeeId, query) → answer (leave balance, policy questions)
  - smartScheduling(orgId, constraints) → optimal shift roster
  - sentimentAnalysis(surveyResponses[]) → sentiment scores

AutomationService:
  - scheduledPayrollRun(orgId) → runs on configured day
  - autoLeaveAccrual(orgId) → monthly accrual job
  - autoAbsentMarking(orgId) → marks absent at day end
  - autoCompOffExpiry(orgId) → expires old comp-offs
  - autoLoanEMIRecovery(orgId, month) → deducts EMIs
  - autoAdvanceRecovery(orgId, month) → deducts installments
  - autoDocumentExpiryAlert(orgId) → sends alerts
  - autoBirthdayWish(orgId) → sends birthday emails/notifications
  - autoWorkAnniversary(orgId) → sends anniversary notifications
  - autoPayslipDistribution(payrollRunId) → emails + WhatsApp
  - autoStatutoryReminder(orgId) → PF/ESI/PT due date alerts
  - autoLeaveReset(orgId) → annual leave balance reset
  - autoProbationReminder(orgId) → confirmation due alerts
```

---

## PART 4: IMPLEMENTATION ROADMAP

### Phase 1: Foundation (Weeks 1-6)
```
Week 1-2: Backend Setup
  - Node.js + Express + TypeScript project setup
  - PostgreSQL schema creation (all tables above)
  - Authentication (JWT + refresh + MFA)
  - RBAC middleware
  - Base CRUD for organizations, users, employees

Week 3-4: Core Payroll Migration
  - Migrate salary calculation logic from localStorage to API
  - Attendance API endpoints
  - Leave management API
  - Payroll processing engine (server-side)
  - Tax calculation service

Week 5-6: Frontend Migration
  - Connect React frontend to new API (replace payrollDataStore)
  - Add role-based UI (admin vs HR vs employee views)
  - Employee Self-Service portal (basic: payslips, leave, attendance)
  - Real-time notifications via Socket.io
```

### Phase 2: Mobile & ESS (Weeks 7-10)
```
Week 7-8: Mobile App
  - React Native app setup
  - GPS attendance with geofencing
  - Selfie attendance with liveness check
  - Leave application from mobile
  - Push notifications (FCM)
  - Payslip viewing

Week 9-10: ESS Portal Enhancement
  - Tax declaration submission
  - Proof upload
  - Expense claims
  - Reimbursement requests
  - Document download (Form 16, payslips)
  - Profile self-update
```

### Phase 3: Banking & Compliance (Weeks 11-14)
```
Week 11-12: Banking Integration
  - RazorpayX integration for salary disbursement
  - Payment batch processing
  - Auto-reconciliation
  - Payment status webhooks

Week 13-14: Compliance Automation
  - PF ECR auto-generation + filing
  - ESI challan generation
  - PT state-wise calculation
  - TDS 24Q preparation
  - Form 16 bulk generation
  - Compliance calendar with reminders
```

### Phase 4: HR Modules (Weeks 15-20)
```
Week 15-16: Onboarding/Offboarding
  - Digital onboarding workflow
  - Document collection
  - FnF calculator + processing
  - Letter generation engine

Week 17-18: Approval Engine + Expenses
  - Multi-level configurable approvals
  - Expense management with receipt OCR
  - Reimbursement workflow

Week 19-20: Shifts + Advanced Attendance
  - Biometric device integration (ZKTeco API)
  - Shift swap requests
  - Overtime rules engine
  - WiFi-based attendance
```

### Phase 5: Performance & Engagement (Weeks 21-24)
```
Week 21-22: Performance Management
  - Review cycles
  - Goal setting & OKRs
  - 360-degree feedback
  - PIP management
  - Rating-to-increment linking

Week 23-24: Engagement & L&D
  - Pulse surveys + eNPS
  - Peer recognition
  - Training management
  - Skill matrix
  - Recruitment (basic ATS)
```

### Phase 6: AI & Differentiators (Weeks 25-28)
```
Week 25-26: AI Features
  - Payroll anomaly detection
  - Attrition prediction model
  - Smart tax optimization
  - Expense auto-categorization
  - Employee chatbot

Week 27-28: Integrations & Polish
  - Tally export
  - Slack/Teams notifications
  - Google Calendar sync
  - WhatsApp payslip delivery
  - Advanced analytics dashboard
  - Multi-language support (Hindi, regional)
```

---

## PART 5: COMPETITIVE FEATURE MATRIX

| Feature | greytHR | Keka | Zoho | Go2-Payroll (Target) |
|---------|---------|------|------|---------------------|
| Cloud-based | ✅ | ✅ | ✅ | ✅ |
| Employee Self-Service | ✅ | ✅ | ✅ | ✅ |
| Mobile App (GPS Attendance) | ✅ | ✅ | ✅ | ✅ |
| Payroll Processing | ✅ | ✅ | ✅ | ✅ |
| Indian Compliance (PF/ESI/PT/TDS) | ✅ | ✅ | ✅ | ✅ |
| Direct Bank Payment | ✅ | ✅ | ✅ | ✅ (RazorpayX) |
| Multi-level Approvals | ✅ | ✅ | ✅ | ✅ |
| Expense Management | ✅ | ✅ | ✅ | ✅ |
| Performance Management | ✅ | ✅ | ❌ | ✅ |
| Recruitment/ATS | ❌ | ✅ | ✅ | ✅ |
| AI Anomaly Detection | ❌ | ❌ | ❌ | ✅ ⭐ |
| Attrition Prediction | ❌ | ❌ | ❌ | ✅ ⭐ |
| WhatsApp Payslips | ❌ | ❌ | ❌ | ✅ ⭐ |
| Offline Desktop Mode | ❌ | ❌ | ❌ | ✅ ⭐ (Electron) |
| Receipt OCR | ❌ | ✅ | ❌ | ✅ |
| Flexi Benefits | ✅ | ✅ | ❌ | ✅ |
| Multi-entity | ✅ | ✅ | ✅ | ✅ |
| Biometric Integration | ✅ | ✅ | ❌ | ✅ |
| Document Generation | ✅ | ✅ | ✅ | ✅ |
| Custom Report Builder | ✅ | ✅ | ✅ | ✅ |
| API for 3rd Party | ✅ | ✅ | ✅ | ✅ |
| Tally Integration | ✅ | ✅ | ❌ | ✅ |
| Employee Chatbot | ❌ | ❌ | ❌ | ✅ ⭐ |

**⭐ = Go2-Payroll Differentiators (features competitors DON'T have)**

---

## PART 6: PRICING MODEL (SaaS)

```
Starter:     ₹40/employee/month  (up to 25 employees)
  - Core HR, Attendance, Leave, Payroll, Compliance, ESS Portal

Growth:      ₹70/employee/month  (up to 200 employees)
  - Everything in Starter + Expenses, Approvals, Shifts, Banking, Mobile App

Enterprise:  ₹100/employee/month (unlimited)
  - Everything in Growth + Performance, Recruitment, AI, Custom Integrations, Dedicated Support

Add-ons:
  - WhatsApp Payslips: ₹5/employee/month
  - Biometric Integration: ₹2000/device one-time
  - Custom Report Builder: ₹1000/month
  - API Access: ₹2000/month
```

---

## SUMMARY: Total Scope

| Metric | Count |
|--------|-------|
| Database Tables | 65+ |
| API Endpoints | 200+ |
| Service Functions | 400+ |
| UI Pages (Web) | 50+ |
| Mobile Screens | 25+ |
| Background Jobs | 15+ |
| Integrations | 10+ |
| Report Types | 30+ |
| Document Templates | 15+ |
| Notification Types | 25+ |

**Estimated Development Time:** 28 weeks (7 months) with 2-3 full-stack developers
**Estimated Cost (if outsourced):** ₹25-40 lakhs

---

*This blueprint covers EVERY function, method, and feature needed to make Go2-Payroll an industry-grade product that can compete head-to-head with greytHR, Keka, Zoho Payroll, and Darwinbox.*
