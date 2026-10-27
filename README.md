# RMD NEST — Real Estate Lot Sales Management API

Backend API for a real estate company's lot sales operations: managing subdivision inventory, client reservations, contracts, installment payments, and agent commissions. Built with **NestJS**, **Prisma**, and **PostgreSQL**, and deployed in production on AWS EC2.

> This repository is shared for **portfolio and code review purposes only**. Environment files, deployment configuration, and production data are intentionally excluded.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | NestJS 11 (TypeScript) |
| Database | PostgreSQL + Prisma ORM 6 |
| Auth | Passport (JWT access token + refresh token), Argon2 hashing |
| Validation | class-validator / class-transformer |
| File uploads | Multer (disk storage) |
| Email | Resend |
| Dates / Timezones | moment-timezone |
| Deployment | Docker, AWS EC2, GitHub Actions + AWS SSM |

---

## Features

### Inventory Management
- Hierarchical property inventory: **Project → Phase → Block → Lot**
- Lot and phase status tracking (e.g. available, reserved, sold, full slot)
- Middleware-level duplicate checks for project, phase, block, and lot names

### Sales Workflow
- **Clients:** client records with document uploads
- **Reservations:** holding and reservation fees, validity periods, forfeiture handling
- **Contracts:** cash or installment terms, down payments (full or partial), forfeiture and deletion flows
- **Payments:** monthly installments, down payments, full payments, survey fees, and other transaction types
  - Late payment penalties with optional waiver
  - Auto-generated receipt numbers (PostgreSQL function)
  - Proof-of-payment uploads
  - Payment breakdowns and history per contract
- **Agents & Commissions:** commission rates per contract, commission release tracking, and breakdown/history views

### Role-Based Access & Approval Workflow
- Two roles: **Admin** and **Secretary**
- Per-user **module access** (Projects, Reservations, Clients, Contracts, Users, Audit Trail, etc.)
- Changes made by a Secretary to sensitive records (payments, contracts, clients, reservations, commissions, files) are saved as **pending requests** that an Admin must approve or reject

### Audit Trail
- Every core entity has a matching `*Audit` table
- Audit records are written by **PostgreSQL triggers** (`triggers.sql`), so history is captured at the database level regardless of which code path made the change
- Triggers also manage `approvedAt`, `rejectedAt`, and `deletedAt` timestamps automatically

### Authentication & Security
- Short-lived JWT access tokens (Bearer) and refresh tokens stored in **httpOnly cookies**
- Refresh tokens are **hashed with Argon2** and stored in an `AuthSession` table, bound to the client IP and user agent
- Passwords hashed with Argon2
- Global validation pipe with whitelist (unknown fields are stripped)
- CORS restricted to configured origins
- Consistent API response envelope and centralized exception handling via a global interceptor and filter

---

## Project Structure

```
src/
├── auth/               # Login, logout, refresh token rotation
├── user/               # Admin & secretary accounts, module access
├── project/            # Projects, phases, blocks, lots
├── client/             # Client records
├── reservation/        # Reservations and fees
├── contract/           # Contracts, terms, forfeiture
├── payment/            # Payments, penalties, receipts, breakdowns
├── agent/              # Sales agents
├── agent-commission/   # Commission computation and release
├── request/            # Approval workflow (approve / reject requests)
├── audit/              # Audit trail queries
├── file/               # File and document management
├── email/              # Email sending (Resend)
├── settings/           # User preferences
├── health/             # Health check endpoint
├── middleware/         # Duplicate and validation checks per module
├── services/           # Shared services: Prisma, JWT, guards, strategies,
│                       # interceptors, uploads, formatting, timezone helpers
├── config/             # Environment-based configuration
└── main.ts

prisma/
├── schema.prisma       # Data model (~30 models)
└── migrations/

triggers.sql            # Audit and timestamp triggers
functions.sql           # Database functions (e.g. receipt number generation)
```

---

## Suggested Starting Points for Review

- **Data model:** `prisma/schema.prisma`
- **Auth flow & refresh token sessions:** `src/auth/auth.service.ts`, `src/services/strategy/strategy.service.ts`, `src/services/jwt/jwt.service.ts`
- **Role guard:** `src/services/guard/guard.service.ts`
- **Payment logic (penalties, breakdowns, transactions):** `src/payment/payment.service.ts`
- **Approval workflow:** `src/request/request.service.ts`
- **Database-level auditing:** `triggers.sql`
- **Response/error handling:** `src/services/interceptor/interceptor.service.ts`

---

## Deployment (Production)

The production version runs in Docker on AWS EC2. Pushes to the release branches trigger a GitHub Actions workflow that uses AWS Systems Manager (SSM) to pull the latest code and rebuild the containers on the server. The deployment workflow and Docker files are not included in this repository.

---

## Author

**James Ryan Pagal**
- GitHub: [@jamesryanpagal](https://github.com/jamesryanpagal)
- LinkedIn: [jamesryanpagal](https://www.linkedin.com/in/james-ryan-pagal-293a691ba/)
- Portfolio: [opterna](https://www.opterna.cloud/)