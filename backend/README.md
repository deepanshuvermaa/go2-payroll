# Go2-Payroll Backend

Complete HRMS & Payroll Management System - Node.js/Express/TypeScript/PostgreSQL

## 🚀 Deploy to Railway (One-Click)

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app) → New Project
2. Add **PostgreSQL** service (click "Add Service" → "Database" → "PostgreSQL")
3. Add **New Service** → "GitHub Repo" → select this repo (point to `Go2-Payroll/backend`)

### Step 2: Set Environment Variables
In Railway dashboard → your service → Variables tab, add:

```
DATABASE_URL        → (auto-set if you link the PostgreSQL service)
JWT_SECRET          → (generate: openssl rand -hex 32)
JWT_REFRESH_SECRET  → (generate: openssl rand -hex 32)
NODE_ENV            → production
CORS_ORIGINS        → https://your-frontend-domain.com
SMTP_HOST           → smtp.gmail.com
SMTP_PORT           → 587
SMTP_USER           → your-email@gmail.com
SMTP_PASS           → your-app-password
```

Optional (enable as needed):
```
RAZORPAYX_KEY_ID, RAZORPAYX_KEY_SECRET, RAZORPAYX_ACCOUNT_NUMBER
SMS_API_KEY, SMS_SENDER_ID
WHATSAPP_TOKEN, WHATSAPP_PHONE_ID
REDIS_URL
```

### Step 3: Deploy
Railway auto-deploys on push. The Dockerfile handles:
1. Install dependencies
2. Generate Prisma client
3. Compile TypeScript
4. Run migrations on start
5. Start server

### Step 4: Seed Database (First Time)
```bash
# In Railway shell or locally with DATABASE_URL set:
npm run seed
```

---

## 📋 API Modules (200+ endpoints)

| Module | Base Path | Key Features |
|--------|-----------|--------------|
| Auth | `/api/auth` | JWT, refresh tokens, MFA, RBAC |
| Organization | `/api/org` | Org, branches, departments, employees |
| Attendance | `/api/attendance` | Check-in/out, geofence, biometric, bulk |
| Leave | `/api/leave` | Apply/approve, accrual, encashment, comp-off |
| Payroll | `/api/payroll` | Full processing engine, payslips, validation |
| Salary | `/api/salary` | Templates, CTC breakdown, flexi benefits |
| Tax | `/api/tax` | Income tax, PF, ESI, PT, gratuity, LWF |
| Banking | `/api/banking` | Payment batches, NEFT, RazorpayX |
| ESS | `/api/ess` | Employee self-service portal |
| Onboarding | `/api/onboarding` | Checklists, FnF, exit processing |
| Expenses | `/api/expenses` | Reports, policies, approvals |
| Approvals | `/api/approvals` | Multi-level configurable workflows |
| Reports | `/api/reports` | Registers, analytics, Excel/PDF/CSV export |
| Notifications | `/api/notifications` | In-app, email, SMS, WhatsApp |
| Performance | `/api/performance` | Reviews, goals, OKRs |
| Recruitment | `/api/recruitment` | ATS pipeline, interviews |
| Documents | `/api/documents` | Templates, generation, verification |
| AI | `/api/ai` | Anomaly detection, attrition prediction, chatbot |
| Integrations | `/api/integrations` | Tally, Slack, Google, Insurance |

---

## 🔐 Authentication

All endpoints (except `/api/auth/login`, `/api/auth/register`, `/health`) require:
```
Authorization: Bearer <access_token>
```

### Roles (RBAC)
- `SUPER_ADMIN` - Platform-level access
- `ORG_ADMIN` - Full org access
- `HR_MANAGER` - HR operations
- `HR_EXECUTIVE` - Limited HR
- `FINANCE_MANAGER` - Payroll & finance
- `MANAGER` - Team management
- `EMPLOYEE` - Self-service only

---

## 🛠 Local Development

```bash
cd Go2-Payroll/backend
cp .env.example .env
# Edit .env with your PostgreSQL URL

npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Server runs at `http://localhost:3000`

---

## 📊 Database

- **65+ tables** via Prisma ORM
- Auto-migrations on deploy
- Supports PostgreSQL 14+

---

## 🏗 Architecture

```
src/
├── config/          # Environment & database config
├── middleware/      # Auth, validation, error handling
├── modules/         # Feature modules (service + routes)
│   ├── auth/
│   ├── organization/
│   ├── attendance/
│   ├── leave/
│   ├── payroll/
│   ├── salary/
│   ├── tax/
│   ├── banking/
│   ├── ess/
│   ├── onboarding/
│   ├── expense/
│   ├── approval/
│   ├── reports/
│   ├── notifications/
│   ├── performance/
│   ├── recruitment/
│   ├── documents/
│   ├── ai/
│   └── integrations/
├── utils/           # Helpers
└── server.ts        # Entry point
```
