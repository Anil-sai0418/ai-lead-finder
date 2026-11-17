# AI Lead Finder

> A production-quality, full-stack AI-powered Lead Discovery and Classification Platform designed to discover, extract, and classify high-intent software development client opportunities from public social posts.

---

## 1. Overview

**AI Lead Finder** automates the end-to-end pipeline of identifying genuine software project requirements from public web platforms. It specifically targets high-value clients looking to hire:
- Full-stack, Frontend, Backend, React, Next.js, Node.js, and Python developers
- Mobile application engineers (React Native, Flutter)
- Freelancers and software development agencies
- SaaS MVP development teams and AI application builders

The platform strictly differentiates **genuine buyers/clients** from job-seekers promoting their resumes, agencies advertising services, and general technical chatter.

---

## 2. Key Features

- **Multi-Source Discovery Engine**:
  - **Official X (Twitter) API v2**: Queries `/2/tweets/search/recent` with exponential backoff, rate-limit reset tracking, and pagination.
  - **Google Programmable Search Import**: Compliant import mechanism for indexed LinkedIn/web post snippets without prohibited scraping.
  - **Direct Manual Submission**: Single-post ingestion for rapid opportunity qualification.
- **SHA-256 Content Deduplication**:
  - Multi-tier deduplication by platform external post ID and sanitized SHA-256 content hashes, avoiding redundant AI token expenses.
- **Gemini Structured JSON Extraction**:
  - Strict JSON schema extraction isolating project title, scope, technologies, budget, delivery deadline, start date, and contact method.
  - Zero-hallucination policy: missing parameters are strictly recorded as `null` or `[]`.
  - Prompt injection defense: post contents are wrapped in untrusted delimiter boundaries and model meta-instructions are ignored.
- **100-Point Deterministic Lead Scoring**:
  - The AI model only extracts facts; a fixed backend rules engine calculates the final score (0–100):
    1. Explicit hiring request (+30 pts)
    2. Budget mentioned (+20 pts)
    3. Technical requirements (+15 pts)
    4. Deadline / delivery timeline (+15 pts)
    5. Clear scope and objectives (+20 pts)
  - Priority tiers: **High (80–100)**, **Medium (60–79)**, **Low (40–59)**, and **Very Low (0–39)**.
- **Modern Next.js 15 App Router Dashboard**:
  - Real-time KPIs, source distribution breakdowns, and recent opportunity streams.
  - Searchable and filterable leads table with technology, status, priority, and budget filters.
  - Dedicated **High Priority (80+)** opportunity command center.
  - **Human Review Triage Queue** for ambiguous or snippet-only posts.
  - Interactive **Opportunity Details** with itemized score breakdown gauges and notes manager.
  - Real-time **AI Classification Sandbox** for testing raw text.
- **BullMQ Background Workers**:
  - Decoupled asynchronous queues: `discovery-queue`, `classification-queue`, and `lead-processing-queue`.
  - Graceful direct execution fallback when Redis is running in local degraded mode.

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React, TanStack Query, React Hook Form, Zod |
| **Backend** | Node.js 23, Express.js, TypeScript, Zod, Pino Structured Logging, Helmet, CORS |
| **Database & ORM** | PostgreSQL 16, Prisma ORM |
| **Asynchronous Processing** | Redis 7, BullMQ |
| **AI Provider** | Google Gemini API (`gemini-1.5-flash`), Structured JSON Schema Output |
| **Testing** | Vitest, Supertest, 20-Sample Ground-Truth Benchmark Dataset |
| **Deployment** | Docker, Docker Compose, Vercel (Frontend), Render / Railway (Backend) |

---

## 4. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Ingestion["1. Discovery Sources"]
        S1[Official X API Recent Search] --> N[Post Normalization & Sanitization]
        S2[Google Search Snippet Import] --> N
        S3[Manual Post Submission Form] --> N
    end

    subgraph Deduplication["2. Deduplication Engine"]
        N --> H[Calculate Normalized SHA-256 Hash]
        H --> D{Duplicate Check<br/>External ID or Hash Exists?}
        D -->|Yes| DROP[Skip AI & Flag as Duplicate]
        D -->|No| DB1[(PostgreSQL: Post Record)]
    end

    subgraph AI["3. Gemini AI Classification Engine"]
        DB1 --> Q1[BullMQ: classification-queue]
        Q1 --> GEMINI[Google Gemini Structured JSON API]
        GEMINI --> ZOD{Zod Response Schema Validation}
        ZOD -->|Valid JSON| LOG[(PostgreSQL: AIProcessingLog)]
    end

    subgraph Scoring["4. Deterministic Scoring Engine"]
        LOG --> Q2[BullMQ: lead-processing-queue]
        Q2 --> RULES[Deterministic Backend Rules<br/>Hiring: 30 | Budget: 20 | Tech: 15 | Due: 15 | Scope: 20]
        RULES --> DB2[(PostgreSQL: Lead Record)]
    end

    subgraph Dashboard["5. Interactive Command Dashboard"]
        DB2 --> UI1[Overview KPI Cards & Charts]
        DB2 --> UI2[All Leads Table with Search & Filters]
        DB2 --> UI3[High-Priority 80+ Feed]
        DB2 --> UI4[Human Review Triage]
    end
```

---

## 5. Monorepo Structure

```
ai-lead-finder/
├── apps/
│   ├── backend/                     # Node.js + Express REST API
│   │   ├── src/
│   │   │   ├── config/              # Zod env, Pino logger, Prisma, Redis
│   │   │   ├── controllers/         # Thin HTTP request/response handlers
│   │   │   ├── middleware/          # Centralized error handler, Zod validator
│   │   │   ├── queues/              # BullMQ queue registry
│   │   │   ├── repositories/        # Database access layer
│   │   │   ├── routes/              # Express API routers
│   │   │   ├── services/
│   │   │   │   ├── ai/              # Gemini structured client & prompts
│   │   │   │   ├── deduplication/   # SHA-256 hash & URL normalization
│   │   │   │   ├── discovery/       # LeadSource interface & X client
│   │   │   │   ├── lead-scoring/    # 100-point deterministic rules
│   │   │   │   └── leads/           # Pipeline coordinator & import
│   │   │   ├── utils/               # URL sanitizer & hash helpers
│   │   │   └── workers/             # BullMQ background workers
│   │   └── tests/
│   │       ├── fixtures/            # 20-sample ground-truth benchmark dataset
│   │       ├── integration/         # REST API & pipeline tests
│   │       └── unit/                # Scoring engine & validation tests
│   │
│   └── frontend/                    # Next.js 15 App Router Dashboard
│       ├── app/
│       │   ├── (dashboard)/
│       │   │   ├── page.tsx         # Overview metrics & distribution
│       │   │   ├── high-priority/   # 80+ score opportunities
│       │   │   ├── import/          # Manual submit & Google CSE import
│       │   │   ├── leads/           # All leads table & [id] detail page
│       │   │   ├── needs-review/    # Human review triage queue
│       │   │   ├── searches/        # Search query manager & executions
│       │   │   └── settings/        # System diagnostics & AI sandbox
│       │   ├── globals.css
│       │   └── layout.tsx
│       ├── components/              # UI primitives (Cards, Badges, Buttons)
│       └── lib/                     # API client & formatting utilities
│
├── packages/
│   └── shared/                      # TypeScript contracts & Zod schemas
│       └── src/
│           ├── schemas/             # AI, Post, Search & Lead Zod schemas
│           └── types/               # Classification & Scoring types
│
├── prisma/
│   ├── schema.prisma                # Normalized database models & indices
│   └── seed.ts                      # Database seeder with default queries
│
├── docker-compose.yml               # Multi-container local orchestration
├── .env.example                     # Environment template
└── package.json                     # Monorepo workspaces definition
```

---

## 6. Getting Started

### Prerequisites
- **Node.js**: v20 or higher (v23 tested)
- **npm**: v10 or higher
- **Docker & Docker Compose** (for containerized PostgreSQL and Redis)

### Installation

1. **Clone the repository and install dependencies**:
   ```bash
   git clone <repo-url>
   cd Bot
   npm install
   ```

2. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your keys:
   ```ini
   DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/ai_lead_finder?schema=public"
   REDIS_URL="redis://localhost:6379"
   GEMINI_API_KEY="your-google-gemini-api-key"
   GEMINI_MODEL="gemini-1.5-flash"
   X_BEARER_TOKEN="your-x-api-bearer-token" # Optional: runs simulation if omitted
   ```

3. **Start PostgreSQL & Redis (Docker Compose)**:
   ```bash
   docker compose up -d postgres redis
   ```

4. **Initialize Database Schema & Client**:
   ```bash
   npm run prisma:generate
   npm run prisma:push --workspace=@ai-lead-finder/backend
   npm run prisma:seed
   ```

5. **Build the Shared Package**:
   ```bash
   npm run build --workspace=@ai-lead-finder/shared
   ```

---

## 7. Running the Platform

### Running Backend API
```bash
npm run dev:backend
```
The Express REST API will start on `http://localhost:5001`.
- Health Check: `http://localhost:5001/api/v1/health`

### Running Frontend Dashboard
```bash
npm run dev:frontend
```
The Next.js dashboard will be accessible at `http://localhost:3000`.

### Running with Docker Compose (Full Stack)
```bash
docker compose up --build
```

---

## 8. Running Tests

The test suite includes 48 unit and integration tests covering deterministic scoring, Zod schema validation, API error handling, duplicate prevention, and the 20-sample ground-truth benchmark dataset:

```bash
npm run test --workspace=@ai-lead-finder/backend
```

### The 20-Sample Benchmark Test Suite
Located in `apps/backend/tests/fixtures/20-sample-posts.benchmark.json`, this dataset evaluates:
- Genuine project requirements (Next.js SaaS, Python ETL, Flutter mobile apps)
- Developers seeking employment (`#opentowork`, junior applicants) &rarr; classified `NOT_A_LEAD`
- Agencies marketing services & freelancers self-promoting &rarr; classified `NOT_A_LEAD`
- Vague startup exploration ideas &rarr; classified `NEEDS_REVIEW`
- Technical discussions and bug troubleshooting &rarr; classified `NOT_A_LEAD`
- Malicious prompt injection attacks &rarr; classified `NOT_A_LEAD`
- Partial search snippets &rarr; classified `NEEDS_REVIEW`

---

## 9. Permitted Search & Limitations

- **X (Twitter) API v2**: Uses official App-only Bearer Token authentication on `https://api.x.com/2/tweets/search/recent`. Handles 429 rate limits via exponential backoff.
- **Google Search Import**: Built specifically for Google Programmable Search Engine users. Because the CSE embed snippet is frontend-only and scraping LinkedIn or Google search HTML is strictly prohibited, users import or paste search result snippets directly into the application for normalization and pipeline ingestion.
- **Gemini Structured Output**: Operates in `responseMimeType: "application/json"` with fixed JSON schema validation via Zod. Falls back to a deterministic heuristic engine if no API key is supplied.

---

## 10. License

MIT
