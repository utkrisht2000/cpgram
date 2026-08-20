# SuGam: Unified Citizen Grievance Redressal & Administrative Resolution Platform

SuGam is an enterprise-grade, accessible, multi-role digital grievance redressal platform engineered for civic governance evaluation and government agency pitching. It couples citizen plain-language interaction (English & Hindi, voice & text) with deterministic SLA enforcement, AI classification and drafting assistance, and multi-tier administrative workflows for redressal and supervisory officers.

---

## 1. Architectural Architecture & Principles

SuGam enforces a strict separation of concerns across three core pillars:

```
+-------------------------------------------------------------------------+
|                              Frontend UI                                |
|   (React 18 + TypeScript + Vite + Vanilla CSS + Accessibility Layer)   |
+-------------------------------------------------------------------------+
                                    |
                            HTTP / REST APIs
                                    |
+-------------------------------------------------------------------------+
|                             Backend API                                 |
|  - Role-Based Auth Middleware (Signed JWT + Phone OTP + Bcrypt)         |
|  - Tenancy & Permissions Guard (Departmental and Case Boundaries)       |
+-------------------------------------------------------------------------+
        |                                    |                      |
+-----------------------+   +-------------------------------+   +---------+
| Isolated AI Layer     |   | Deterministic SLA & Rules     |   | SQLite  |
| (OpenRouter Client)   |   | (slaEngine, escalationRules)  |   | Storage |
| - Classify & Route    |   | - Mathematical Deadline Calc  |   | (WAL)   |
| - Clarify Text        |   | - Warning & Breach Triggers   |   +---------+
| - Status Translator   |   | - 90-Day Appeal Guarantee     |
| - Response Drafter    |   | - Supervisory Auto-Escalation |
| - Appeal Drafter      |   +-------------------------------+
+-----------------------+
```

1. **Deterministic Rules & SLA Engine (`backend/src/rules/`)**:
   - Deadlines, countdowns, breach detection, and auto-escalation triggers are computed deterministically based on database-grounded departmental policies, completely independent of AI unpredictability.
   - Statutory first appeals are guaranteed post-resolution and never gated behind arbitrary satisfaction scores.

2. **Isolated AI Processing Layer (`backend/src/ai/`)**:
   - OpenRouter integrations are isolated into dedicated, single-purpose modules with structured prompt templates.
   - Every AI-generated output (suggested routing, clarified text, response draft, appeal letter) requires explicit human confirmation before becoming part of the official administrative record.
   - Automatic fallback mechanisms ensure seamless operation even if AI endpoints time out or offline demo conditions apply.

3. **Data Layer (`backend/src/models/` & `backend/src/db/`)**:
   - Normalized relational SQLite database using `better-sqlite3` with Write-Ahead Logging (WAL) and foreign key constraints.
   - Strict versioned schema migrations in `backend/src/db/migrations/`.

---

## 2. Directory Layout

```
sugam/
├── README.md
├── .env.example
├── package.json
├── docs/
│   └── implementation-plan.md
├── scripts/
│   └── seed.ts
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.ts
│   │   ├── config/
│   │   │   └── env.ts
│   │   ├── db/
│   │   │   ├── connection.ts
│   │   │   └── migrations/
│   │   │       ├── 001_initial_schema.sql
│   │   │       └── runMigrations.ts
│   │   ├── models/
│   │   │   ├── user.model.ts
│   │   │   ├── officer.model.ts
│   │   │   ├── department.model.ts
│   │   │   ├── grievance.model.ts
│   │   │   ├── grievanceNote.model.ts
│   │   │   ├── statusHistory.model.ts
│   │   │   ├── notification.model.ts
│   │   │   └── appeal.model.ts
│   │   ├── auth/
│   │   │   ├── otpProvider.ts
│   │   │   ├── passwordAuth.ts
│   │   │   └── session.ts
│   │   ├── rules/
│   │   │   ├── slaEngine.ts
│   │   │   ├── escalationRules.ts
│   │   │   └── appealEligibility.ts
│   │   ├── ai/
│   │   │   ├── openrouterClient.ts
│   │   │   ├── classifyAndRoute.ts
│   │   │   ├── clarifyText.ts
│   │   │   ├── statusTranslator.ts
│   │   │   ├── officerResponseDrafter.ts
│   │   │   ├── appealDrafter.ts
│   │   │   └── promptTemplates/
│   │   └── api/
│   │       ├── auth.routes.ts
│   │       ├── departments.routes.ts
│   │       ├── grievances.routes.ts
│   │       └── officers.routes.ts
│   └── tests/
│       └── rules.test.ts
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── api/
        ├── assets/icons/
        ├── components/
        ├── locales/
        ├── styles/
        └── views/
```

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- Node.js (v18 or v20+)
- npm (v9+)

### Installation
Clone the repository and install all root and submodule dependencies:

```bash
# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install root orchestration tools
npm install
```

### Environment Configuration
Copy `.env.example` to `backend/.env`:

```bash
cp .env.example backend/.env
```

Key environment variables:
- `PORT`: Backend server port (default: 4000)
- `JWT_SECRET`: Secret key for signing session tokens
- `OTP_SECRET`: Secret key for HMAC OTP verification
- `OPENROUTER_API_KEY`: OpenRouter API key (optional; system includes offline fallback)
- `OPENROUTER_MODEL`: Model identifier (default: `anthropic/claude-3.5-sonnet`)

### Database Seeding
Populate the SQLite database with realistic departments, officers, mock citizens, grievances, and timelines:

```bash
npm run seed
```

### Running the Application

To run both backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend API**: `http://localhost:4000`

---

## 4. Pre-Configured Demo Credentials

The seed script creates realistic demo accounts for evaluation:

### Citizen Role
- **Phone Number**: `9876543210` (Ramesh Kumar)
- **OTP**: Automatically logged to backend console during local development (e.g. `583693`), or displayed in dev banner.

### Redressal Officers (Department Level)
- **Municipal Water Supply**: `officer.water@sugam.local` / `Officer@123`
- **Electricity & Power**: `officer.power@sugam.local` / `Officer@123`
- **Public Works & Roads**: `officer.roads@sugam.local` / `Officer@123`
- **Social Welfare & Pensions**: `officer.welfare@sugam.local` / `Officer@123`

### Nodal Appellate Officer (Supervisory Authority)
- **Email**: `nodal.admin@sugam.local` / `Nodal@123`

---

## 5. Deployment on GitHub Pages

The frontend is configured with relative base paths (`base: './'`) and resilient client-side demonstration fallbacks for static hosting on GitHub Pages.

### Option A: Automatic Deployment via GitHub Actions (Recommended)
1. Push this repository to GitHub (on `main` or `master` branch).
2. Go to your repository on GitHub $\rightarrow$ **Settings** $\rightarrow$ **Pages**.
3. Under **Build and deployment** $\rightarrow$ **Source**, select **GitHub Actions**.
4. The included workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) will automatically build and publish your application.

### Option B: Manual CLI Deployment
To build and push directly to a `gh-pages` branch from your local terminal:
```bash
npm run deploy:frontend
```

---

## 6. Automated Unit Tests

To run the deterministic SLA engine, escalation rules, appeal eligibility, and OTP security test suite:

```bash
npm test
```

---

## 6. Judgment Calls & Compliance Notes

1. **Independent Product Identity**: SuGam is authored as an independent digital governance solution. In compliance with identity guidelines, no government seals, national emblems, or proprietary names (such as CPGRAMS or PG Portal) are used.
2. **Zero-Emoji Standard**: All visual markers and status badges use 100% original, hand-authored SVG icons.
3. **Synthetic Data**: All seed cases and names are authored demonstration records and do not contain real personal or official records.
