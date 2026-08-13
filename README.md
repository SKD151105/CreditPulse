<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/React-Dark.svg" width="48" height="48" alt="React" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NodeJS-Dark.svg" width="48" height="48" alt="Node.js" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/MongoDB.svg" width="48" height="48" alt="MongoDB" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Redis-Dark.svg" width="48" height="48" alt="Redis" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/AWS-Dark.svg" width="48" height="48" alt="AWS" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Docker.svg" width="48" height="48" alt="Docker" />

  <h1>CreditPulse</h1>
  <p><strong>Enterprise Loan Origination and Underwriting System</strong></p>

  [![Live Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg?style=for-the-badge)](https://credit-pulse-xi.vercel.app/)
  [![Node.js](https://img.shields.io/badge/Node.js-Backend-43853D.svg?style=for-the-badge&logo=node.js&logoColor=white)](#)
  [![React](https://img.shields.io/badge/React-Frontend-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)](#)
  [![Docker](https://img.shields.io/badge/Docker-Containers-2496ED.svg?style=for-the-badge&logo=docker&logoColor=white)](#)
  [![AWS](https://img.shields.io/badge/AWS-Cloud-232F3E.svg?style=for-the-badge&logo=amazon-aws&logoColor=white)](#)
</div>

---

CreditPulse is a highly optimized, full-stack loan application and underwriting system designed around microservice principles. It provides secure applicant submission flows, automated risk scoring, and a real-time portal for underwriters to review and process applications.

## Table of Contents

- [Architecture & Performance Overview](#architecture--performance-overview)
- [Core Features](#core-features)
- [System Flow](#system-flow)
- [Technology Stack](#technology-stack)
- [Local Environment Setup](#local-environment-setup)
- [Database Seeding](#database-seeding)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [API Reference](#api-reference)

---

## Architecture & Performance Overview

The system architecture focuses on operational stability, performance, and fault tolerance under load:

### 1. Database Indexing & Query Optimization
MongoDB collections utilize Mongoose compound indexes (e.g., `{ status: 1, createdAt: -1 }`) to ensure lightning-fast querying on large datasets. Backend data fetching leverages `.lean()` queries to skip expensive document hydration, maximizing API response speeds.

### 2. Frontend Code Splitting
The React frontend utilizes Route-Level Code Splitting via `React.lazy()` and `<Suspense>`. This ensures applicants do not download the heavy, complex JavaScript bundles required for the Admin Dashboard, strictly minimizing the initial load time and maximizing browser performance. Form validations are handled seamlessly via **React Hook Form** and **Zod** to prevent unnecessary re-renders.

### 3. Event-Driven Background Processing
Asynchronous tasks are managed via **BullMQ** on a containerized **Redis** instance to completely decouple heavy operations from the main API thread:
- **Webhooks:** Outbound HTTP requests to external CRMs execute in the background with automatic retries and exponential backoff.
- **Email Delivery:** Transactional notifications are queued and dispatched via Resend.
- **Algorithmic Scoring:** The risk evaluation algorithm runs safely in the background.

### 4. Stateless S3 Uploads
Large file uploads (e.g., identity documents, pay slips) are handled client-side via S3 Pre-Signed URLs. The Node.js backend computes a cryptographic signature (HMAC SHA-256) and returns a temporary URL. The client executes a direct `PUT` to the AWS S3 bucket, preventing the API servers from buffering large binary payloads.

### 5. Fail-Fast Caching and Rate Limiting
The Node.js API relies on Redis for rate-limiting and short-lived caching. The Redis client is configured with `enableOfflineQueue: false` to ensure the application fails fast during cache outages, degrading gracefully without blocking the event loop.

---

## Core Features

- **Role-Based Access Control (RBAC):** Strict permission boundaries between Applicants and Admins. Protected routes ensure secure API access and strict isolation (e.g., Demo Admins can only view Demo Applications).
- **Audit Logging & Activity Timeline:** Every state change (creations, assignments, status updates) is securely tracked in an `AuditLog` collection. This data is rendered as a beautiful, chronological Activity Timeline in the administrative portal.
- **Real-Time Notifications (SSE):** Admin actions trigger background jobs that push live updates to the applicant's browser via Server-Sent Events, removing the need for network-heavy polling.
- **Risk Scoring Engine:** Automatically evaluates income-to-loan ratios, employment stability, and document completeness to generate standardized risk profiles.
- **Webhooks (HMAC Verified):** Allows administrators to register external endpoints for real-time JSON payloads on loan status changes, authenticated via `x-creditpulse-signature`.
- **Authentication:** Highly secure utilizing short-lived JWT access tokens, HTTP-only refresh tokens, and seamless Google OAuth 2.0 integration.

---

## System Flow

![System Architecture](./client/public/creditpulse_system_architecture.png)

---

## Technology Stack

| Component          | Technology               | Description                                              |
| :----------------- | :----------------------- | :------------------------------------------------------- |
| **Frontend**       | React, Vite, TailwindCSS | High-performance, code-split client application bundle.  |
| **Form/State**     | React Hook Form, Zod     | Uncontrolled inputs and strict schema validation.        |
| **Backend**        | Node.js, Express         | REST API and WebSocket/SSE provider.                     |
| **Language**       | TypeScript               | Strict typing across the stack.                          |
| **Database**       | MongoDB Atlas            | Primary operational datastore with compound indexes.     |
| **Message Broker** | Redis, BullMQ            | Job queuing, rate limiting, and background workers.      |
| **Object Storage** | AWS S3                   | Secure storage for applicant documents via Presigned URLs|
| **Email Service**  | Resend                   | Transactional email provider.                            |

---

## Local Environment Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- MongoDB instance (Local or Atlas)
- AWS IAM Credentials (for S3)
- Google OAuth 2.0 Credentials
- Resend API Key

### 1. Repository Setup
```bash
git clone https://github.com/SKD151105/CreditPulse.git
cd CreditPulse

# Install API dependencies
cd server && npm install

# Install UI dependencies
cd ../client && npm install
```

### 2. Execution via Docker Compose
The local development environment uses Docker Compose to orchestrate the API, Worker, and Redis containers.

```bash
# Start backend services
cd server
docker compose up -d

# Start frontend development server
cd ../client
npm run dev
```

---

## Database Seeding

To quickly populate your local or remote database with realistic demonstration data, you can utilize the included highly-safe database seed script. 

The script will:
- Safely drop **only** data associated with `@demo.com` users (protecting all real users in your database).
- Generate a Demo Admin and two Demo Applicants.
- Generate exactly **12 Loan Applications** with varying statuses (Submitted, Under Review, Approved, Rejected).
- Generate **45 comprehensive Audit Logs** to fully populate the Activity Timeline UI with realistic dates and remarks.

**To run the seed script:**
```bash
cd server
npm run seed
```
*Note: If you run this script while logged into the frontend, simply log out and log back in to refresh your JWT session token with the newly generated Demo Admin ID.*

---

## Configuration

### API Environment (`server/.env`)

| Variable                | Description                                        |
| :---------------------- | :------------------------------------------------- |
| `PORT`                  | API port (default: 5000)                           |
| `NODE_ENV`              | `development` or `production`                      |
| `MONGO_URI`             | MongoDB connection string                          |
| `REDIS_URI`             | Redis connection string (`redis://localhost:6379`) |
| `JWT_ACCESS_SECRET`     | Secret for signing Access Tokens                   |
| `JWT_REFRESH_SECRET`    | Secret for signing Refresh Tokens                  |
| `AWS_REGION`            | AWS Region for S3                                  |
| `AWS_ACCESS_KEY_ID`     | AWS IAM Access Key                                 |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM Secret Key                                 |
| `S3_BUCKET_NAME`        | AWS S3 Bucket Name                                 |
| `GOOGLE_CLIENT_ID`      | Google OAuth Client ID                             |
| `GOOGLE_CLIENT_SECRET`  | Google OAuth Client Secret                         |
| `RESEND_API_KEY`        | Resend API Key                                     |
| `CLIENT_URL`            | Allowed CORS origin                                |
| `SUPER_ADMIN_SECRET`    | Passphrase for Admin promotion                     |
| `WEBHOOK_SECRET`        | Secret used to sign HMAC webhook payloads          |

### Client Environment (`client/.env`)

| Variable                | Description            |
| :---------------------- | :--------------------- |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `VITE_API_URL`          | Target API URL         |

## Debugging & Viewing Logs

Whether you are running locally or on the production EC2 server, Docker makes it easy to view live logs and debug background workers (Redis/BullMQ).

### Local Environment Debugging

To view live logs from your locally running containers, open a terminal in the `server` directory and run:

```bash
# View all logs in real-time
docker compose logs -f

# View logs only for the main API server
docker compose logs -f api

# View logs only for the background worker (scoring, emails)
docker compose logs -f worker
```

### Production (EC2) Debugging

When connected to your EC2 instance via SSH, use standard Docker commands to monitor the production containers.

```bash
# List all running containers to get their exact names
docker ps

# View live logs for the API server (usually named something like ubuntu-api-1)
docker logs -f ubuntu-api-1

# View live logs for the background worker (usually named ubuntu-worker-1)
docker logs -f ubuntu-worker-1

# View the last 100 lines of worker logs
docker logs --tail 100 ubuntu-worker-1
```

**Common Debugging Scenarios:**
- **Jobs not processing?** Check the worker logs (`docker logs -f ubuntu-worker-1`). You should see lines like `Worker connected to database` and `...worker is listening for jobs`. If jobs fail, the stack trace will appear here.
- **API Errors (500s)?** Check the API logs (`docker logs -f ubuntu-api-1`). Winston logs all uncaught errors here.
- **Silent Failures?** Make sure your `.env` has `NODE_ENV=production` and the Winston logger level is set to `info` so that standard logs aren't suppressed.

---

## Deployment

Continuous Integration and Deployment are managed via GitHub Actions (`.github/workflows/deploy.yml`).

1. **Build Phase:** Code pushed to `main` triggers a multi-stage Docker build. The resulting image is pushed to the GitHub Container Registry (`ghcr.io`).
2. **Provisioning:** The pipeline connects to the AWS EC2 host via SSH, writing necessary environment variables from GitHub Secrets.
3. **Rollout:** The host pulls the latest image and executes `docker compose up -d` to recreate containers.

---

## API Reference

### Authentication
| Method | Endpoint             | Description          | Auth |
| :----- | :------------------- | :------------------- | :--- |
| `POST` | `/api/auth/register` | Register applicant   | No   |
| `POST` | `/api/auth/login`    | Email/password login | No   |
| `POST` | `/api/auth/google`   | Google OAuth         | No   |
| `POST` | `/api/auth/refresh`  | Rotate tokens        | No   |
| `POST` | `/api/auth/logout`   | Invalidate session   | Yes  |

### Loan Operations
| Method  | Endpoint                | Description              | Auth |
| :------ | :---------------------- | :----------------------- | :--- |
| `POST`  | `/api/loans`            | Create draft application | Yes  |
| `GET`   | `/api/loans`            | List applications        | Yes  |
| `GET`   | `/api/loans/:id`        | Get application details  | Yes  |
| `PATCH` | `/api/loans/:id`        | Update draft             | Yes  |
| `POST`  | `/api/loans/:id/submit` | Submit application       | Yes  |

### Administrative & System
| Method  | Endpoint                          | Description                      | Auth        |
| :------ | :-------------------------------- | :------------------------------- | :---------- |
| `GET`   | `/api/admin/loans`                | List all applications            | Yes (Admin) |
| `GET`   | `/api/admin/loans/:id/audit-logs` | Retrieve application audit trail | Yes (Admin) |
| `PATCH` | `/api/admin/loans/:id/assign`     | Assign application               | Yes (Admin) |
| `PATCH` | `/api/admin/loans/:id/status`     | Update application status        | Yes (Admin) |
| `GET`   | `/api/webhooks`                   | List webhook configurations      | Yes (Admin) |
| `POST`  | `/api/webhooks`                   | Register webhook endpoint        | Yes (Admin) |

---

## License

MIT License
