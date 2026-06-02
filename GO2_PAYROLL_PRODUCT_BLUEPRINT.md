# Go2-Payroll: Complete Industry-Grade Product Blueprint

> Transform from localStorage desktop tool → Cloud-first SaaS platform competing with greytHR, Keka, Zoho Payroll, Darwinbox

---

## PART 1: ARCHITECTURE TRANSFORMATION

### 1.1 Tech Stack (New)

| Layer | Current | Target |
|-------|---------|--------|
| Frontend | React + Electron (desktop only) | React (Web) + React Native (Mobile) + Electron (Desktop) |
| Backend | None (localStorage) | Node.js + Express + TypeScript |
| Database | localStorage | PostgreSQL (primary) + Redis (cache/sessions) |
| Auth | JWT + localStorage | JWT + OAuth2 + RBAC + MFA |
| Storage | None | AWS S3 / Cloudflare R2 (documents) |
| Queue | None | BullMQ + Redis (background jobs) |
| Realtime | None | Socket.io (notifications, live updates) |
| Email | None | Nodemailer + AWS SES |
| SMS | None | Twilio / MSG91 |
| Payments | None | Razorpay (subscription billing) |
| Hosting | Railway (auth only) | AWS ECS / Railway (API) + Vercel (Web) |
| CI/CD | None | GitHub Actions |
| Monitoring | None | Sentry + Prometheus + Grafana |

### 1.2 Database Schema (Core Tables)

```sql
-- MULTI-TENANCY
organizations (id, name, gstin, pan, tan, address, state, logo_url, plan_id, created_at)
branches (id, org_id, name, address, state, city, is_head_office)
departments (id, org_id, branch_id, name, head_employee_id)
designations (id, org_id, name, grade, level)

-- USERS & RBAC
users (id, org_id, email, phone, password_hash, mfa_secret, is_active, last_login)
roles (id, org_id, name, is_system_role) -- Admin, HR, Manager, Finance, Employee
permissions (id, module, action, description)
role_permissions (role_id, permission_id)
user_roles (user_id, role_id, branch_id)

-- EMPLOYEES (Core HR)
employees (id, org_id, user_id, emp_code, first_name, last_name, dob, gender,
           blood_group, marital_status, father_name, mother_name,
           personal_email, work_email, phone, emergency_contact,
           current_address, permanent_address,
           department_id, designation_id, branch_id, reporting_manager_id,
           date_of_joining, confirmation_date, date_of_exit, exit_reason,
           employment_type, employment_status, notice_period_days,
           pan, aadhar, uan, esic_number, passport_number,
           bank_name, bank_account, ifsc_code, bank_branch,
           profile_photo_url, created_at, updated_at)

employee_documents (id, employee_id, doc_type, doc_name, file_url, expiry_date, verified_by, verified_at)
employee_nominations (id, employee_id, nominee_name, relationship, percentage, for_type) -- PF/Gratuity/Insurance

-- SALARY STRUCTURE
salary_templates (id, org_id, name, description, is_default)
salary_components (id, org_id, name, type, calculation_type, percentage_of, fixed_amount,
                   is_taxable, is_part_of_ctc, is_part_of_gross, show_in_payslip, order)
-- type: earning/deduction/employer_contribution
-- calculation_type: fixed/percentage_of_basic/percentage_of_gross/formula

salary_template_components (template_id, component_id, value, formula)
employee_salary_structures (id, employee_id, template_id, effective_from, ctc_annual, ctc_monthly, gross_monthly, net_monthly, status)
employee_salary_components (id, structure_id, component_id, monthly_amount, annual_amount)

-- ATTENDANCE
attendance_policies (id, org_id, name, work_hours_per_day, half_day_hours, grace_minutes,
                     late_mark_penalty, absent_penalty, overtime_multiplier, weekend_ot_multiplier,
                     holiday_ot_multiplier, max_ot_hours_per_month, auto_absent_enabled)
attendance_records (id, employee_id, date, status, check_in, check_out, 
                    work_hours, overtime_hours, late_minutes, early_exit_minutes,
                    source, location_lat, location_lng, selfie_url, device_id,
                    regularization_status, regularization_reason, approved_by)
-- source: manual/biometric/mobile_gps/web/wifi

attendance_regularizations (id, attendance_id, employee_id, original_status, requested_status,
                           reason, requested_at, approved_by, approved_at, status)

-- SHIFTS
shifts (id, org_id, name, start_time, end_time, break_duration, grace_minutes,
        min_hours_full_day, min_hours_half_day, night_shift, color_code)
shift_rosters (id, employee_id, shift_id, date, is_week_off, is_holiday)
shift_swap_requests (id, requester_id, target_id, date, shift_id, status, approved_by)

-- LEAVE
leave_types (id, org_id, name, code, paid, carry_forward, max_carry_forward,
             encashable, max_encashment, accrual_type, accrual_frequency,
             applicable_gender, probation_applicable, max_consecutive_days,
             requires_document_after_days, negative_balance_allowed, max_negative)
leave_policies (id, org_id, leave_type_id, annual_quota, monthly_accrual,
               applicable_from_months, reset_month)
leave_balances (id, employee_id, leave_type_id, year, opening, accrued, used, 
               carry_forwarded, encashed, lapsed, current_balance)
leave_applications (id, employee_id, leave_type_id, from_date, to_date, days,
                   half_day, half_day_type, reason, document_url,
                   status, applied_at, approved_by, approved_at, rejection_reason)
leave_encashments (id, employee_id, leave_type_id, days, amount, status, processed_in_month)

-- COMP-OFF
comp_off_credits (id, employee_id, worked_date, reason, days_credited, expiry_date, 
                  status, approved_by, balance_remaining)

-- HOLIDAYS
holiday_calendars (id, org_id, year, name, branch_id)
holidays (id, calendar_id, date, name, type, is_restricted, is_optional)
-- type: national/state/company/restricted

-- PAYROLL
payroll_runs (id, org_id, month, year, status, initiated_by, initiated_at,
             approved_by, approved_at, total_gross, total_deductions, total_net,
             total_employer_contributions, employee_count, error_count)
-- status: draft/processing/pending_approval/approved/paid/cancelled

payroll_records (id, payroll_run_id, employee_id, working_days, present_days,
                paid_days, loss_of_pay_days, overtime_hours, overtime_amount,
                gross_earnings, total_deductions, net_pay, employer_pf, employer_esi,
                status, payment_status, payment_ref, paid_at)

payroll_earnings (id, payroll_record_id, component_id, amount)
payroll_deductions (id, payroll_record_id, component_id, amount)
payroll_employer_contributions (id, payroll_record_id, component_id, amount)

-- ADVANCES & LOANS
salary_advances (id, employee_id, amount, reason, applied_at, status,
                approved_by, disbursed_at, recovery_start_month, installments,
                installment_amount, recovered_amount, balance)
loans (id, employee_id, loan_type, principal, interest_rate, tenure_months,
       emi_amount, disbursed_at, status, total_paid, balance, 
       approved_by, approved_at)
loan_repayments (id, loan_id, payroll_record_id, month, year, principal_component,
                interest_component, total_amount, balance_after)

-- REIMBURSEMENTS
reimbursement_policies (id, org_id, category, max_amount_per_month, requires_receipt, auto_approve_below)
reimbursement_claims (id, employee_id, category, amount, description, receipt_url,
                     claim_date, status, approved_by, approved_at, paid_in_month, rejection_reason)

-- BONUS & INCENTIVES
bonus_rules (id, org_id, name, type, calculation_method, value, frequency,
            applicable_departments, min_tenure_months, is_active)
bonus_disbursements (id, employee_id, bonus_rule_id, amount, month, year, payroll_record_id)
incentive_schemes (id, org_id, name, type, target_metric, target_value, 
                  payout_formula, frequency, is_active)
incentive_records (id, employee_id, scheme_id, period, achievement, payout_amount, status)

-- TAX & COMPLIANCE
tax_declarations (id, employee_id, financial_year, regime, status,
                 section_80c, section_80d, section_80e, section_80g,
                 hra_exemption, lta_claimed, nps_80ccd, home_loan_interest,
                 other_income, previous_employer_income, previous_employer_tds)
tax_proofs (id, declaration_id, section, amount_declared, amount_approved,
           proof_url, verified_by, verified_at, status)
form16_records (id, employee_id, financial_year, part_a_url, part_b_url, generated_at)
tds_challans (id, org_id, month, year, amount, bsr_code, challan_no, deposit_date)

-- STATUTORY
pf_filings (id, org_id, month, year, total_employee_share, total_employer_share,
           admin_charges, edli_charges, total_amount, ecr_file_url, status, filed_at)
esi_filings (id, org_id, month, year, total_employee_share, total_employer_share,
            total_amount, challan_url, status, filed_at)
pt_filings (id, org_id, state, month, year, total_amount, status, filed_at)

-- BANKING & PAYMENTS
bank_accounts (id, org_id, bank_name, account_number, ifsc, branch, account_type, is_salary_account)
payment_batches (id, org_id, payroll_run_id, bank_account_id, total_amount, 
                employee_count, file_type, file_url, status, initiated_at, completed_at)
payment_transactions (id, batch_id, employee_id, amount, bank_ref, utr_number, status, paid_at, failure_reason)

-- DOCUMENTS
document_templates (id, org_id, type, name, content_html, variables)
-- type: offer_letter/appointment_letter/increment_letter/experience_letter/relieving_letter/warning_letter
generated_documents (id, employee_id, template_id, content, file_url, generated_by, generated_at, signed_at, signature_url)

-- ONBOARDING & OFFBOARDING
onboarding_checklists (id, org_id, name, items_json)
onboarding_tasks (id, employee_id, checklist_id, task_name, assigned_to, due_date, status, completed_at)
exit_requests (id, employee_id, resignation_date, last_working_date, reason, status, approved_by)
fnf_settlements (id, employee_id, exit_request_id, basic_dues, leave_encashment, bonus_due,
                gratuity, notice_pay, deductions, total_amount, status, paid_at)

-- EXPENSE MANAGEMENT
expense_policies (id, org_id, category, daily_limit, monthly_limit, requires_receipt_above, auto_approve_below)
expense_reports (id, employee_id, title, from_date, to_date, total_amount, status, submitted_at, approved_by)
expense_items (id, report_id, date, category, description, amount, receipt_url, merchant, is_billable, project_id)

-- APPROVALS ENGINE
approval_workflows (id, org_id, module, name, levels_json, conditions_json, is_active)
-- module: leave/expense/reimbursement/loan/advance/attendance_regularization/shift_swap/exit
approval_requests (id, workflow_id, module, record_id, employee_id, current_level, status, created_at)
approval_actions (id, request_id, level, approver_id, action, comments, acted_at)

-- NOTIFICATIONS
notifications (id, user_id, type, title, message, data_json, read, created_at)
notification_preferences (user_id, type, email, sms, push, in_app)

-- PERFORMANCE & OKR
review_cycles (id, org_id, name, type, start_date, end_date, status)
-- type: annual/half_yearly/quarterly/probation
performance_reviews (id, cycle_id, employee_id, reviewer_id, self_rating, manager_rating,
                    final_rating, status, submitted_at, reviewed_at)
review_parameters (id, cycle_id, name, weightage, description)
review_scores (id, review_id, parameter_id, self_score, manager_score, comments)
goals (id, employee_id, cycle_id, title, description, target, achieved, weightage, status, due_date)
okrs (id, org_id, employee_id, quarter, year, objective, progress, status)
key_results (id, okr_id, title, target_value, current_value, unit, status)

-- RECRUITMENT (ATS)
job_postings (id, org_id, title, department_id, designation_id, description, 
             requirements, location, employment_type, salary_range_min, salary_range_max,
             status, posted_at, closes_at)
candidates (id, job_id, name, email, phone, resume_url, source, status, applied_at)
interview_rounds (id, candidate_id, round_number, type, interviewer_id, scheduled_at, 
                 feedback, rating, status)
offer_letters (id, candidate_id, job_id, ctc_offered, joining_date, expiry_date, 
              status, accepted_at, document_url)

-- EMPLOYEE ENGAGEMENT
surveys (id, org_id, title, type, questions_json, anonymous, status, start_date, end_date)
survey_responses (id, survey_id, employee_id, answers_json, submitted_at)
recognition_badges (id, org_id, name, icon, description, points)
recognitions (id, from_employee_id, to_employee_id, badge_id, message, created_at)

-- LEARNING & DEVELOPMENT
training_programs (id, org_id, title, description, type, duration, provider, cost, max_participants)
training_enrollments (id, program_id, employee_id, status, enrolled_at, completed_at, score, certificate_url)
skill_matrix (id, employee_id, skill_name, proficiency_level, certified, last_assessed)

-- AUDIT & LOGS
audit_logs (id, org_id, user_id, module, action, record_id, old_data, new_data, ip_address, user_agent, created_at)
login_logs (id, user_id, ip_address, device, location, status, created_at)

-- SETTINGS
org_settings (id, org_id, key, value, category)
-- Keys: financial_year_start, pf_establishment_code, esi_code, pt_registration,
--        tan_number, payroll_process_day, attendance_lock_day, etc.
```

### 1.3 API Architecture (RESTful + WebSocket)

```
Base URL: /api/v1

Authentication:
  POST   /auth/login
  POST   /auth/register
  POST   /auth/refresh-token
  POST   /auth/forgot-password
  POST   /auth/reset-password
  POST   /auth/verify-mfa
  POST   /auth/logout

Organizations:
  GET    /organizations/current
  PUT    /organizations/current
  POST   /organizations/branches
  GET    /organizations/branches
  PUT    /organizations/settings

Employees:
  GET    /employees
  POST   /employees
  GET    /employees/:id
  PUT    /employees/:id
  DELETE /employees/:id
  POST   /employees/:id/documents
  GET    /employees/:id/salary-structure
  POST   /employees/:id/salary-structure
  GET    /employees/:id/payslips
  GET    /employees/:id/tax-summary
  POST   /employees/bulk-import (CSV/Excel)
  GET    /employees/export

Attendance:
  GET    /attendance
  POST   /attendance/check-in
  POST   /attendance/check-out
  POST   /attendance/mark (admin)
  POST   /attendance/bulk-mark
  GET    /attendance/summary/:employee_id/:month/:year
  POST   /attendance/regularization
  PUT    /attendance/regularization/:id/approve
  GET    /attendance/report

Leaves:
  GET    /leaves
  POST   /leaves/apply
  PUT    /leaves/:id/approve
  PUT    /leaves/:id/reject
  GET    /leaves/balance/:employee_id
  POST   /leaves/encash
  GET    /leaves/calendar

Payroll:
  POST   /payroll/run
  GET    /payroll/runs
  GET    /payroll/runs/:id
  PUT    /payroll/runs/:id/approve
  POST   /payroll/runs/:id/process-payment
  GET    /payroll/runs/:id/records
  GET    /payroll/payslip/:record_id
  POST   /payroll/payslip/:record_id/email
  POST   /payroll/runs/:id/bulk-email-payslips

Salary:
  GET    /salary/templates
  POST   /salary/templates
  GET    /salary/components
  POST   /salary/components
  POST   /salary/revise/:employee_id
  GET    /salary/history/:employee_id

Compliance:
  GET    /compliance/pf/ecr/:month/:year
  POST   /compliance/pf/file
  GET    /compliance/esi/challan/:month/:year
  POST   /compliance/esi/file
  GET    /compliance/pt/:state/:month/:year
  GET    /compliance/tds/24q/:quarter/:year
  POST   /compliance/form16/generate
  GET    /compliance/calendar

Banking:
  GET    /banking/accounts
  POST   /banking/accounts
  POST   /banking/payment-batch
  GET    /banking/payment-batch/:id/status
  POST   /banking/reconcile

Tax:
  GET    /tax/declarations/:employee_id/:fy
  POST   /tax/declarations
  PUT    /tax/declarations/:id
  POST   /tax/proofs/upload
  PUT    /tax/proofs/:id/verify
  GET    /tax/computation/:employee_id/:fy

Loans & Advances:
  GET    /loans
  POST   /loans/apply
  PUT    /loans/:id/approve
  GET    /advances
  POST   /advances/apply
  PUT    /advances/:id/approve

Reimbursements:
  GET    /reimbursements
  POST   /reimbursements
  PUT    /reimbursements/:id/approve
  PUT    /reimbursements/:id/reject

Expenses:
  GET    /expenses/reports
  POST   /expenses/reports
  POST   /expenses/reports/:id/items
  PUT    /expenses/reports/:id/submit
  PUT    /expenses/reports/:id/approve

Shifts:
  GET    /shifts
  POST   /shifts
  GET    /shifts/roster/:month/:year
  POST   /shifts/roster
  POST   /shifts/swap-request

Holidays:
  GET    /holidays/:year
  POST   /holidays
  PUT    /holidays/:id
  DELETE /holidays/:id

Reports:
  GET    /reports/salary/:month/:year
  GET    /reports/attendance/:month/:year
  GET    /reports/leave/:year
  GET    /reports/pf-summary/:month/:year
  GET    /reports/esi-summary/:month/:year
  GET    /reports/ctc-register
  GET    /reports/headcount
  GET    /reports/attrition
  GET    /reports/variance
  POST   /reports/custom (report builder)
  GET    /reports/export/:type/:format (excel/pdf/csv)

Onboarding:
  GET    /onboarding/checklists
  POST   /onboarding/initiate/:employee_id
  PUT    /onboarding/tasks/:id/complete
  GET    /onboarding/status/:employee_id

Offboarding:
  POST   /offboarding/initiate/:employee_id
  GET    /offboarding/fnf/:employee_id
  POST   /offboarding/fnf/:employee_id/process
  POST   /offboarding/documents/generate

Documents:
  GET    /documents/templates
  POST   /documents/templates
  POST   /documents/generate/:employee_id
  GET    /documents/:employee_id

Approvals:
  GET    /approvals/pending
  PUT    /approvals/:id/approve
  PUT    /approvals/:id/reject
  GET    /approvals/history

Notifications:
  GET    /notifications
  PUT    /notifications/:id/read
  PUT    /notifications/read-all
  GET    /notifications/preferences
  PUT    /notifications/preferences

Performance:
  GET    /performance/cycles
  POST   /performance/cycles
  GET    /performance/reviews/:cycle_id
  POST   /performance/reviews/:id/submit
  PUT    /performance/reviews/:id/rate
  GET    /performance/goals/:employee_id
  POST   /performance/goals

Analytics:
  GET    /analytics/dashboard
  GET    /analytics/payroll-cost
  GET    /analytics/department-wise
  GET    /analytics/attrition
  GET    /analytics/headcount-trend
  GET    /analytics/salary-distribution

WebSocket Events:
  notification:new
  approval:pending
  attendance:marked
  payroll:status_changed
  announcement:new
```
