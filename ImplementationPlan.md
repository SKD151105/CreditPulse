# CreditPulse — Full Implementation Plan (Enhanced)

Goal: Build a production-grade, full-stack loan application & credit tracking dashboard with credit risk scoring engine, background job processing, real-time notifications, webhook system, and EMI calculator. Demonstrates React UI, Node.js/Express APIs, MongoDB, AWS (S3 + EC2), CI/CD (GitHub Actions), Redis caching + job queues, JWT + Google OAuth auth, and system design thinking — in ~24 hours.

Resume target: Replace the B2B Outreach Pipeline project for CreditSea SDE Intern application.

## Table of Contents
1. Architecture Overview
2. Tech Stack & Justifications
3. MongoDB Schema Design
4. Backend API Design
5. System Design, Scalability & Performance
6. Frontend Architecture
7. AWS Setup Guide (Free Tier)
8. CI/CD Pipeline (GitHub Actions)
9. Hour-by-Hour Build Sequence
10. Verification Plan
11. Resume Bullet & Interview Prep

---

## 1. Architecture Overview

### 1.1 Full System Architecture

```text
                                +-------------------------+
                                |  React SPA (Vercel)     |
                                |  UI / Forms / Dash      |
                                +-----+-------------+-----+
                                      |             ^ 
                                      | HTTPS       | SSE (Server-Sent Events)
                                      v             | 
+---------------------------------------------------+-------------------+
|  AWS EC2 t2.micro (Ubuntu)                                            |
|                                                                       |
|  +---------------------------------------------------------------+    |
|  | Nginx Reverse Proxy (SSL Term, Rate Limiting, CORS)           |    |
|  +-----------------------+---------------------------------------+    |
|                          | HTTP (Port 3000)                           |
|                          v                                            |
|  +-----------------------+----------+      +-----------------------+  |
|  | Express API Server (PM2)         |      | Worker Process (PM2)  |  |
|  |  - Auth / OAuth                  +<-----+  - Credit Scoring     |  |
|  |  - Loan CRUD                     |      |  - Notifications      |  |
|  |  - Admin Dashboard               |      |  - Webhook Dispatch   |  |
|  +---+-----------+---------+--------+      +---+--------+-------+--+  |
|      |           |         |                   |        |       |     |
+------+-----------+---------+-------------------+--------+-------+-----+
       |           |         |                   |        |       |
       | TCP       | TCP     | HTTP              | TCP    | TCP   | HTTP
       v           v         v                   v        v       v
+----------+ +--------+ +---------+       +----------+ +--------+ +-------+
| Upstash  | | Mongo  | | AWS S3  |       | Upstash  | | Mongo  | | Web-  |
| Redis    | | Atlas  | | Bucket  |       | Redis    | | Atlas  | | hooks |
| (Cache,  | | (Data) | | (Docs)  |       | (BullMQ) | | (Data) | | (Ext) |
| Queues)  | |        | |         |       |          | |        | |       |
+----------+ +--------+ +---------+       +----------+ +--------+ +-------+
```

### 1.2 Request Flow Diagrams

**1. Loan Submission Flow (with async job queue):**

```text
Client -> POST /api/loans/:id/submit
  -> Rate Limiter (Redis)
  -> Auth Middleware (JWT verify)
  -> Validation (Zod)
  -> LoanController
  -> LoanService:
       - Update status to 'submitted'
       - Push job to BullMQ `scoring-queue`
  <- Return 200 OK immediately (Fast UX!)

(Asynchronous Worker Process)
Worker -> Polls `scoring-queue`
  -> ScoringService runs 5-factor credit scoring
  -> Updates loan with score and risk category
  -> NotificationService creates DB notification
  -> NotificationService Pushes SSE event to client (if connected)
  -> WebhookService Pushes job to `webhook-queue`
Worker -> Polls `webhook-queue`
  -> WebhookService dispatches to registered external URLs (HMAC signed)
```

**2. Admin Approval Flow:**

```text
Admin -> PATCH /api/admin/loans/:id/status
  -> Auth Middleware
  -> RBAC Middleware (Role = Admin)
  -> Validation
  -> AdminController
  -> AdminService:
       - Update status to 'approved'
       - Append to statusHistory
       - Calculate and save EMI details
  -> Push job to `notification-queue` (Notify applicant)
  -> Push job to `webhook-queue` (Dispatch 'loan.approved' event)
  <- Return 200 OK

(Asynchronous Worker Process)
Worker -> Polls `notification-queue`
  -> Saves notification to DB
  -> SSE push to applicant's browser (Live update)
```

---

## 2. Tech Stack & Justifications

### Backend
| Technology | Purpose | Why |
| :--- | :--- | :--- |
| **Node.js 22 LTS** | Runtime | JD requirement, non-blocking I/O ideal for API routing. |
| **Express.js** | HTTP Framework | JD requirement, massive middleware ecosystem. |
| **TypeScript** | Type Safety | JD lists TypeScript first; eliminates runtime type errors. |
| **MongoDB + Mongoose** | Primary Database | JD requirement; flexible schema fits loan documents. |
| **Redis (Upstash)** | Cache & Queues | Performance optimization, sliding window rate limits. |
| **BullMQ** | Job Queue | Async processing, runs on Redis, robust retry/backoff. |
| **AWS S3** | Document Storage | Presigned URLs, infinite scaling, keeps files off EC2. |
| **JWT + Refresh Tokens** | Authentication | Stateless sessions, ready for horizontal scaling. |
| **Google OAuth 2.0** | Social Login | Trusted third-party IDP integration. |
| **Zod** | Validation | TypeScript-first schema validation. |
| **bcrypt** | Password Hashing | Industry standard, adaptive computational cost. |
| **Helmet** | HTTP Security | Sets baseline production security headers. |
| **Morgan + Winston**| Logging | Structured request and application logging. |

### Frontend
| Technology | Purpose | Why |
| :--- | :--- | :--- |
| **React 18 + TS** | UI Framework | JD requirement. |
| **Vite** | Build Tool | Lightning fast HMR, much faster than CRA. |
| **React Router v6** | Routing | Standard client-side routing for SPAs. |
| **Axios** | HTTP Client | Powerful interceptors for automatic token refresh. |
| **Recharts** | Data Visualization | Composable, React-native chart library. |
| **React Hook Form** | Forms | Performance-optimized, handles complex multi-step forms. |
| **Framer Motion** | Animations | Production-grade UI transitions. |
| **Lucide React** | Icons | Lightweight, consistent SVG icon set. |

### Infrastructure
| Technology | Purpose | Why (Cost) |
| :--- | :--- | :--- |
| **AWS EC2 t2.micro** | Backend Hosting | Free tier for 12 months. |
| **AWS S3** | Object Storage | Free tier (5GB). |
| **MongoDB Atlas M0** | Database | Free forever. |
| **Upstash Redis** | Cache + Message Broker| Free tier (10K commands/day). |
| **Vercel** | Frontend Hosting | Free tier, fast global edge network. |
| **GitHub Actions** | CI/CD | Free for public repositories. |
| **Docker + Docker Compose** | Containerization | Eliminates environment drift. Local dev runs MongoDB + Redis locally via docker-compose so no Atlas/Upstash credentials needed during development. Production: EC2 runs containers from Docker image. |

**Total Cost: $0**

---

## 3. MongoDB Schema Design

### 3.1 Users Collection
```typescript
interface IUser {
  _id: ObjectId;
  email: string;              // unique, indexed
  password?: string;          // hashed bcrypt, nullable for OAuth
  name: string;
  role: 'applicant' | 'admin';
  googleId?: string;          // sparse unique index
  avatar?: string;
  refreshTokens: string[];    // array of HASHED refresh tokens (multi-device)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
// Indexes: { email: 1 } unique, { googleId: 1 } sparse unique, { role: 1 }
```
> [!NOTE]
> **Design Decisions:**
> - `refreshTokens` is an array of hashed tokens, supporting multi-device login. Logout removes a specific token; logout-all clears the array.
> - `password` is optional since Google OAuth users don't require one.
> - Defaults to 'applicant'; admins are seeded/promoted manually.

### 3.2 LoanApplications Collection
```typescript
interface ILoanApplication {
  _id: ObjectId;
  applicantId: ObjectId;      // ref: Users, indexed
  
  // Personal Info
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  panNumber: string;
  address: { street: string; city: string; state: string; pincode: string };
  
  // Loan Details
  loanType: 'personal' | 'business' | 'education' | 'home';
  amount: number;
  tenure: number;             // months
  purpose: string;
  interestRate?: number;      // annual %, set by admin on approval
  
  // Employment
  employmentType: 'salaried' | 'self-employed' | 'student';
  monthlyIncome: number;
  employerName?: string;
  
  // Documents (S3 refs, embedded)
  documents: Array<{
    _id: ObjectId;
    type: 'aadhaar' | 'pan' | 'income_proof' | 'bank_statement' | 'address_proof' | 'other';
    s3Key: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  }>;
  
  // Credit Scoring (NEW — populated by background worker)
  creditScore?: number;       // 0-100
  riskCategory?: 'low' | 'medium' | 'high' | 'very_high';
  scoringBreakdown?: {
    incomeToLoanRatio: { score: number; weight: number; details: string };
    employmentStability: { score: number; weight: number; details: string };
    loanToIncomeRatio: { score: number; weight: number; details: string };
    documentCompleteness: { score: number; weight: number; details: string };
    loanTypeRisk: { score: number; weight: number; details: string };
  };
  scoredAt?: Date;
  
  // EMI Details (calculated on demand or on approval)
  emiDetails?: {
    monthlyEmi: number;
    totalInterest: number;
    totalPayment: number;
    interestRate: number;     // annual %
  };
  
  // Status (FSM)
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'disbursed';
  statusHistory: Array<{
    from: string;
    to: string;
    changedBy: ObjectId;
    remarks?: string;
    timestamp: Date;
  }>;
  
  // Admin Review
  assignedTo?: ObjectId;
  reviewRemarks?: string;
  approvedAmount?: number;
  rejectionReason?: string;
  
  submittedAt?: Date;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
// Indexes:
// { applicantId: 1, createdAt: -1 }  — user's loans list
// { status: 1, createdAt: -1 }       — admin filter by status
// { applicantId: 1, status: 1 }      — user filter by status
// { assignedTo: 1, status: 1 }       — admin workload
// { 'documents.s3Key': 1 } sparse    — document lookups
```
> [!NOTE]
> **Design Decisions:**
> - Finite State Machine (FSM) for status transitions enforced in the service layer.
> - `statusHistory` provides a full embedded audit trail.
> - `documents` are embedded because they are tightly coupled and always accessed with the loan.
> - `creditScore` and `scoringBreakdown` are populated asynchronously to not block the submit API.
> - `approvedAmount` exists separately from `amount` since admins can partially approve.

### 3.3 AuditLogs Collection
```typescript
interface IAuditLog {
  _id: ObjectId;
  userId: ObjectId;
  action: string;             // CREATE_LOAN, SUBMIT_LOAN, APPROVE_LOAN, etc.
  resource: string;           // loan, user, document, webhook
  resourceId: ObjectId;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;            // TTL index: 90 days
}
// Indexes: { userId: 1, createdAt: -1 }, { resource: 1, resourceId: 1 }, { createdAt: 1 } TTL 90 days
```
> [!TIP]
> Separate collection allows for TTL indexing (logs automatically delete after 90 days) and prevents unbound document growth inside loans or users.

### 3.4 Notifications Collection
```typescript
interface INotification {
  _id: ObjectId;
  userId: ObjectId;           // recipient
  type: 'status_change' | 'score_ready' | 'assignment' | 'system';
  title: string;
  message: string;
  data: {
    loanId?: ObjectId;
    oldStatus?: string;
    newStatus?: string;
    creditScore?: number;
    riskCategory?: string;
  };
  isRead: boolean;
  createdAt: Date;
}
// Indexes: { userId: 1, isRead: 1, createdAt: -1 }, { createdAt: 1 } TTL 30 days
```

### 3.5 Webhooks Collection
```typescript
interface IWebhook {
  _id: ObjectId;
  userId: ObjectId;           // admin who registered
  url: string;                // target endpoint URL
  secret: string;             // HMAC-SHA256 signing secret
  events: string[];           // ['loan.submitted', 'loan.approved', 'loan.rejected', 'loan.disbursed']
  isActive: boolean;
  failureCount: number;       // consecutive failures, disable after 10
  lastDeliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
// Indexes: { userId: 1 }, { events: 1, isActive: 1 }
```

---

## 4. Backend API Design

### 4.1 Project Structure

```text
creditpulse/                      # Repo root
├── docker-compose.yml            # Local dev: API + Worker + MongoDB + Redis
├── docker-compose.prod.yml       # Production: API + Worker (uses external Atlas/Upstash)
├── server/
│   ├── Dockerfile                # Multi-stage build for API + Worker
│   ├── .dockerignore
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts              # MongoDB connection with retry
│   │   │   ├── redis.ts           # Redis client (ioredis)
│   │   │   ├── s3.ts              # AWS S3 client
│   │   │   ├── env.ts             # Zod-validated env vars
│   │   │   ├── passport.ts        # Google OAuth strategy
│   │   │   └── queue.ts           # BullMQ queue definitions
│   │   ├── models/                # Mongoose Models (User, Loan, etc)
│   │   ├── routes/                # Express routers
│   │   ├── controllers/           # Request/Response handlers
│   │   ├── services/              # Core business logic
│   │   │   ├── scoring.service.ts # Credit risk scoring engine
│   │   │   ├── emi.service.ts     # EMI calculator
│   │   │   ├── webhook.service.ts # Webhook dispatch + HMAC
│   │   │   └── queue.service.ts   # BullMQ job producers
│   │   ├── workers/               # Background Job Handlers
│   │   │   ├── scoring.worker.ts  
│   │   │   ├── notification.worker.ts
│   │   │   └── webhook.worker.ts
│   │   ├── middleware/            # Auth, RBAC, Validation, etc.
│   │   ├── validators/            # Zod schemas
│   │   ├── utils/                 # Helpers (jwt, errors, hmac)
│   │   ├── app.ts                 # Express setup
│   │   ├── server.ts              # HTTP API Server entry point
│   │   └── worker.ts              # Worker process entry point
├── client/                       # React frontend
```
> [!IMPORTANT]
> **Two separate processes, one Docker image.** The `Dockerfile` builds one image. `docker-compose.yml` runs it twice with different `CMD` overrides — once for the API server, once for the BullMQ worker. On EC2 in production, `docker-compose.prod.yml` does the same thing but points at Atlas and Upstash instead of local containers.

### 4.2 Endpoints Specification

#### Auth Routes (`/api/auth`)
- `POST /register`: Rate: 5/min. Body: `{ name, email, password }`. Logic: validate → check email → hash bcrypt 12 → create → generate tokens → hash refresh and store → return 201 `{ user, accessToken, refreshToken }`.
- `POST /login`: Rate: 10/min. Body: `{ email, password }`. Logic: find → bcrypt compare → generate tokens → append hashed refresh → return 200.
- `POST /google`: Rate: 10/min. Body: `{ credential }`. Logic: verify Google ID token → extract data → find/create user → link Google ID → generate tokens → return 200.
- `POST /refresh`: Rate: 20/min. Body: `{ refreshToken }`. Logic: decode → find user → check hash exists → REMOVE old hash (rotation) → generate new pair → append new hash → return 200. *(Security: stolen token used after rotation causes failure).*
- `POST /logout`: Auth: Bearer. Body: `{ refreshToken }`. Logic: hash token → remove from array → delete cache.
- `GET /me`: Auth: Bearer. Response 200: `{ user }`. Cache: `user:{userId}` TTL 15m.

#### Loan Routes (`/api/loans`)
- `POST /`: Auth: Applicant. Rate: 10/min. Body: `{ loan details }`. Creates `draft`. Invalidates cache. Returns 201.
- `GET /`: Auth: Applicant. Query: page, limit, status, sort. Paginated. Cache: `loans:user:{id}:p:{page}:s:{status}` TTL 5m.
- `GET /:id`: Auth: Applicant. Response: `{ loan }`. Cache TTL 10m.
- `PATCH /:id`: Auth: Applicant. Constraint: Must be `draft`.
- `POST /:id/submit`: Auth: Applicant. Constraint: `draft`, ≥1 document. Logic: update to `submitted` → PUSH JOB TO BULLMQ: `{ type: 'SCORE_APPLICATION', loanId }` → invalidate cache. Returns 200 immediately.
- `DELETE /:id`: Auth: Applicant. Constraint: `draft`. Deletes S3 docs, deletes loan.
- `GET /:id/emi`: Auth: Bearer. Query: `interestRate`. Formula: `EMI = P × r × (1+r)^n / ((1+r)^n - 1)`. Returns: `{ monthlyEmi, totalInterest, totalPayment, amortizationSchedule }`. Pure compute, no DB write.

#### Document Routes (`/api/loans/:loanId/documents`)
- `POST /presign`: Auth: Applicant (draft owner). Body: `{ fileName, fileType, documentType, fileSize }`. Logic: validate size (<5MB) and type → generate S3 key → generate signed PUT URL (5m expiry).
- `POST /confirm`: Auth: Bearer. Body: `{ s3Key, ... }`. Logic: HeadObject to verify → push to `documents` array.
- `GET /:docId/download`: Auth: Bearer (owner/admin). Returns signed GET URL (15m expiry).
- `DELETE /:docId`: Auth: Applicant (draft). Deletes from S3 and DB.

#### Admin Routes (`/api/admin`)
- `GET /loans`: Auth: Admin. Query params for filters, pagination. Uses aggregation pipeline. Cache TTL 2m.
- `GET /loans/:id`: Auth: Admin. Populated details.
- `PATCH /loans/:id/status`: Auth: Admin. Body: `{ status, remarks, approvedAmount?, rejectionReason?, interestRate? }`. 
  - Validates FSM transition (e.g. `under_review` -> `approved`).
  - Updates status, appends to `statusHistory`.
  - Calculates EMI if approved.
  - PUSH JOB TO BULLMQ: `DISPATCH_WEBHOOKS` and `SEND_NOTIFICATION`.
- `PATCH /loans/:id/assign`: Auth: Admin. Assign application to specific admin.

#### Analytics Routes (`/api/analytics`)
- `GET /summary`: Auth: Bearer. Returns role-aware dashboard stats (e.g., total vs approved amounts). Uses MongoDB `$facet` aggregation.
- `GET /trends`: Admin only. Returns monthly trends.
- `GET /status-distribution`: Auth: Bearer. Returns pie chart data.

#### Notification Routes (`/api/notifications`)
- `GET /stream`: Auth: Token in query param. Returns `text/event-stream`. Keeps response alive for SSE.
- `GET /`: Paginated list of past notifications. No cache (must be real-time).
- `PATCH /:id/read`, `PATCH /read-all`: Mark notifications as read.

#### Webhook Routes (`/api/webhooks`) (Admin)
- `POST /`: Body: `{ url, events }`. Generates crypto secret. Returns once.
- `GET /`: List active webhooks (secrets masked).
- `PATCH /:id`: Update/Disable webhook.
- `DELETE /:id`: Remove webhook.
- `POST /:id/test`: Dispatch test event.

---

## 5. System Design, Scalability & Performance

### 5.1 Caching Strategy (Redis)
**4-Layer Strategy:**
1. **User Session:** `user:{userId}` (TTL 15m)
2. **Individual Entity:** `loan:{loanId}` (TTL 10m)
3. **List/Query:** `loans:user:{userId}:p:{page}:s:{status}` (TTL 5m)
4. **Analytics:** `analytics:summary:{scope}` (TTL 5m)

**Invalidation (Write-through):** On mutation, delete affected keys using `SCAN` (never `KEYS` as it blocks Redis).

### 5.2 Background Job Architecture (BullMQ)
**Queues:** `scoring-queue`, `notification-queue`, `webhook-queue`
- API pushes to queue (Producer).
- Worker polls queue (Consumer).
- **Failure Handling:** Auto-retry with exponential backoff (e.g. 3 attempts, 2^attempt * 1000ms). Dead Letter Queue (DLQ) for final failures.

🎯 **Interview Insight:** *Why not process the credit score synchronously in the submit endpoint?*
Credit scoring takes time. Blocking HTTP degrades UX. With a job queue, the API returns instantly, and if scoring fails, BullMQ retries automatically—the user doesn't need to resubmit.

### 5.3 Credit Risk Scoring Engine (Strategy Pattern)
Calculates a score (0-100) using weighted factors:
1. **Income-to-Loan Ratio (30%)**
2. **Employment Stability (25%)**
3. **EMI Affordability / LTI (20%)**
4. **Document Completeness (15%)**
5. **Loan Type Risk (10%)**

Final Score determines Risk Category (`low`, `medium`, `high`, `very_high`).

🎯 **Interview Insight:** *Why the Strategy Pattern?*
Each factor is an isolated function. To add a new factor (e.g., external credit bureau check), we just add a new function without modifying existing logic (Open/Closed Principle). It also sets up an easy path to swap a `RulesBasedScorer` for an `MLScorer`.

### 5.4 Real-Time Notifications (SSE)
- **Why SSE over WebSockets?** SSE is unidirectional (Server -> Client), HTTP-native, handles auto-reconnection via the browser's `EventSource` API, and traverses proxies/CDNs easily without custom protocols.
- **Mechanism:** Express stores `Response` objects in a `Map<userId, Response[]>`. When a background job emits a notification, it writes a payload to the active response stream. A 30s ping keeps the connection alive.

### 5.5 Webhook System
- **Mechanism:** When a status changes, a job is queued. The worker loops through active webhooks subscribed to the event.
- **Security:** Payload is signed with HMAC-SHA256 (`HMAC(secret, JSON.stringify(payload))`). Sent in `X-CreditPulse-Signature` header for receiver verification.
- **Circuit Breaker:** If a webhook fails 10 consecutive times, it is auto-disabled (`isActive: false`) to save resources.

---

## 6. Frontend Architecture

### 6.1 Project Structure (Client)
Key additions include `notification.api.ts`, `webhook.api.ts`, and context for SSE.

```text
client/src/
├── components/
│   ├── loans/
│   │   ├── CreditScoreCard.tsx    # Circular gauge with breakdown
│   │   └── EMICalculator.tsx      # Sliders + Amortization table
│   ├── admin/
│   │   └── WebhookManager.tsx     # Manage external webhooks
│   ├── notifications/
│   │   ├── NotificationBell.tsx   # Badge with unread count
│   │   └── NotificationToast.tsx  # Live toast popups
├── contexts/
│   └── NotificationContext.tsx    # SSE connection management
├── hooks/
│   └── useSSE.ts                  # EventSource wrapper
```

### 6.2 SSE Hook Implementation
```typescript
function useSSE() {
  useEffect(() => {
    const token = getAccessToken();
    const es = new EventSource(`${API_URL}/notifications/stream?token=${token}`);
    
    es.onmessage = (event) => {
      const notification = JSON.parse(event.data);
      // Dispatch to context / trigger toast
    };
    
    return () => es.close(); // Cleanup on unmount
  }, []);
}
```

---

## 7. AWS Setup Guide (Free Tier)

### 7.1 Docker Setup (Phase 1 — do this locally first)

**`server/Dockerfile`** — Multi-stage build (keeps production image small):
```dockerfile
# Stage 1: Build TypeScript → JavaScript
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production image (no devDependencies, no TS source)
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 5000
CMD ["node", "dist/server.js"]
```

📘 **TS Concept — Multi-stage Docker build**
Stage 1 has TypeScript and all devDependencies (needed to compile). Stage 2 copies only the compiled `dist/` JS files and production `node_modules` — no TS compiler, no source files. Result: a much smaller, leaner container that has exactly what it needs to run.

**`docker-compose.yml`** — Local development (no Atlas/Upstash needed):
```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: ./server
    ports:
      - "5000:5000"
    env_file: ./server/.env
    environment:
      - MONGO_URI=mongodb://mongodb:27017/creditpulse
      - REDIS_URI=redis://redis:6379
    depends_on:
      - mongodb
      - redis

  worker:
    build: ./server
    command: node dist/worker.js
    env_file: ./server/.env
    environment:
      - MONGO_URI=mongodb://mongodb:27017/creditpulse
      - REDIS_URI=redis://redis:6379
    depends_on:
      - mongodb
      - redis

volumes:
  mongo_data:
```

**`docker-compose.prod.yml`** — EC2 production (uses Atlas + Upstash):
```yaml
version: '3.8'
services:
  api:
    image: ghcr.io/{your-github-username}/creditpulse-server:latest
    ports:
      - "5000:5000"
    env_file: .env.prod
    restart: always

  worker:
    image: ghcr.io/{your-github-username}/creditpulse-server:latest
    command: node dist/worker.js
    env_file: .env.prod
    restart: always
```

### 7.2 EC2 Deployment (Docker-based)
Instead of installing Node/PM2 directly on EC2, we install Docker:
1. `sudo apt install docker.io docker-compose -y`
2. Copy `docker-compose.prod.yml` and `.env.prod` to EC2
3. `docker-compose -f docker-compose.prod.yml up -d`
4. Both API and Worker start as containers with `restart: always` (auto-restarts on crash/reboot)

> 🎯 **Interview Insight:** *"Why Docker on EC2 instead of just PM2?"*
> PM2 is simpler but ties you to that one EC2 server's environment. Docker means you can move to any server (or Kubernetes later) by just running `docker-compose up`. The image is self-contained — same behaviour guaranteed across every machine.

---

## 8. CI/CD Pipeline (GitHub Actions)

Updated to build and push Docker image to GitHub Container Registry (GHCR), then deploy to EC2:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: cd server && npm ci
      - run: cd server && npm run build
      - run: cd client && npm ci
      - run: cd client && npm run build

  docker-build-push:
    needs: lint-and-build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push image
        uses: docker/build-push-action@v5
        with:
          context: ./server
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/creditpulse-server:latest

  deploy:
    needs: docker-build-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: SSH and deploy to EC2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            docker pull ghcr.io/${{ github.repository_owner }}/creditpulse-server:latest
            docker-compose -f docker-compose.prod.yml up -d
```

GitHub Secrets needed: `EC2_HOST`, `EC2_SSH_KEY`

---

## 9. Hour-by-Hour Build Sequence

- **Hour 0-1:** Monorepo setup, TS config, dependencies, Dockerfile + docker-compose.yml.
- **Hour 1-2:** Configs (DB, Redis, S3, Queues), Mongoose models.
- **Hour 2-3:** Middleware stack, Utilities (JWT, HMAC, Errors).
- **Hour 3-5:** Auth, Loan CRUD, S3 Presigned Document APIs.
- **Hour 5-6:** Credit Scoring Engine (Strategy Pattern).
- **Hour 6-7:** BullMQ setup (Workers), EMI calculator service.
- **Hour 7-8:** Admin APIs, Analytics pipelines, Webhooks, SSE APIs.
- **Hour 8-10:** React setup, Auth UI, Axios interceptors.
- **Hour 10-13:** Applicant dashboard, Multi-step form, Loan Detail (Credit Score + EMI).
- **Hour 13-16:** Admin dashboard, Loans table, Webhook Manager, Notification Bell (SSE).
- **Hour 16-18:** AWS S3 + EC2 setup. EC2: install Docker + docker-compose, configure Nginx.
- **Hour 18-20:** CI/CD YAML (Docker build → push GHCR → SSH deploy), Vercel deployment.
- **Hour 20-24:** Final testing, polish, README, Resume updates.

---

## 10. Verification Plan
- **Credit Scoring:** Submit loan -> check if score appears asynchronously.
- **BullMQ:** Tail worker logs to see job processing in real time.
- **SSE:** Keep applicant window open -> approve loan via Admin -> watch toast appear instantly.
- **Webhooks:** Register mock endpoint (e.g., webhook.site) -> trigger status change -> verify signature header.
- **EMI:** Compare calculator output against standard online EMI tools.

---

## 11. Resume Bullet & Interview Prep

### Resume Bullet
```text
CreditPulse — Loan Application Tracking System | Live
React.js, TypeScript, Node.js, Express, MongoDB, Redis, Docker, AWS (S3 + EC2) | 2026

◦ Built a full-stack loan tracking system with role-based dashboards, a rules-based credit
  risk scoring engine (5-factor weighted algorithm using Strategy Pattern), and BullMQ-powered
  background job processing for async scoring, notifications, and webhook delivery.
◦ Implemented real-time notifications via Server-Sent Events, secure KYC document uploads
  via AWS S3 presigned URLs, JWT auth with refresh token rotation + Google OAuth,
  and an HMAC-SHA256-signed webhook system with circuit-breaker auto-disable.
◦ Containerized via Docker (multi-stage builds) with docker-compose for local dev (MongoDB
  + Redis as containers) and production deployment on AWS EC2 via GitHub Actions CI/CD
  (auto-builds Docker image → pushes to GHCR → SSHs into EC2 and deploys).
```

### Interview Q&A Additions
- **How does credit scoring work?** 5-factor weighted algorithm via Strategy Pattern, executed asynchronously using BullMQ.
- **Why background jobs?** Keeps the HTTP request-response cycle fast. Provides automatic retries and fault tolerance if the worker crashes.
- **Why SSE not WebSockets?** We only need unidirectional (server-to-client) data flow. SSE is HTTP-native, auto-reconnecting, and proxy-friendly.
- **How do receivers verify webhook authenticity?** HMAC-SHA256 signature using a shared secret.
- **What's the circuit breaker pattern?** Auto-disabling an endpoint after N consecutive failures to prevent wasting resources on dead systems.
- **How to make scoring ML-based?** Implement a new `MLScorer` adhering to the same interface as `RulesBasedScorer` and swap via configuration flag.
- **Why Docker?** Eliminates environment drift between dev and production. The image is self-contained — same Node version, same OS, same behaviour on every machine. Local dev runs MongoDB + Redis as containers so no external services are needed.
- **Multi-stage Docker build?** Stage 1 installs devDependencies and compiles TypeScript. Stage 2 copies only the compiled JS and production node_modules — resulting in a leaner image with no TS compiler or source files.
- **Why GHCR over Docker Hub?** GitHub Container Registry is integrated with the repo — the GitHub Actions `GITHUB_TOKEN` secret authenticates automatically with zero extra setup.
