# Multi-Tenant CRM System

Tech Stack: TypeScript, NestJS, PostgreSQL, Next.js, Tailwind, shadcn/ui

## Setup

Backend:
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```
Seed prints admin login(s) to console.

Frontend:
```bash
cd frontend
npm install
npm run dev
```
Visit `localhost:3001`.

Seed data:
- `prisma/seed-data.json` — org/admin list
- `npm run seed:bulk` — separate script, 100,000 customers into a perf-test org

---

## 1. Architecture Decisions

- Modules: `auth`, `users`, `customers`, `notes`, `activity-log` — own controller/service/DTOs each
- No public signup. Seed script creates org + admin. All other users created via `POST /users` (admin-only)
- Access token: 1hr. Refresh token: 7 days. Separate secrets.
- `PrismaService`: global `omit: { user: { password: true } }`
- Role split:
  - ADMIN only: create/update users, soft-delete customer, restore customer
  - Any user: create/edit/assign customer, add notes

## 2. Multi-Tenancy Isolation

- `organizationId` on User, Customer, Note, ActivityLog
- `organizationId` read from JWT only, never from request body/query
- Every query filtered by `organizationId` at service layer
- Verified: 100k-customer org confirmed invisible to other orgs

## 3. Concurrency Safety

Requirement: max 5 active customers/user, no race conditions.

Naive approach fails: `count` then `assign` leaves a gap — two requests can both read count=4 before either writes.

Fix:
- `$transaction` opens
- `SELECT id FROM customers WHERE "assignedToId" = $1 AND "deletedAt" IS NULL FOR UPDATE` — locks rows
- Concurrent request for same user blocks until transaction commits
- Count checked after lock, not before
- Assign proceeds if under 5

Verified: 6 simultaneous assign requests (`Promise.all`) at one user → 5 succeeded, 1 rejected with "User already has 5 active customers assigned."

## 4. Performance & Indexing

Requirement: 100,000 customers/org.

Indexes:
- `[organizationId, deletedAt]` — list query
- `[assignedToId, deletedAt]` — active-assignment count
- `[organizationId, name]`, `[organizationId, email]` — search

N+1: `include` for `assignedTo`, one batched query not per-row. Confirmed via Prisma query log — `GET /customers` = 2 queries regardless of page size.

Pagination: offset-based, `limit` capped at 100.

Verified: seeded 100,000 customers (`createMany`, batches of 1,000). Fast at page 1, fast at page ~4000, fast search, new writes work and show up immediately.

## 5. How I'd Scale This

- Cursor-based pagination past 100k
- Redis-backed rate limiter for multi-instance correctness
- Read replica for list/search traffic
- Cache user/org lookups (JWT strategy re-fetches user every request)
- Activity log writes → background queue
- Connection pooling (PgBouncer) for multiple instances

## 6. Trade-offs

- No signup/invite flow — seed-only bootstrap
- Offset pagination over cursor — simpler, tested fine at 100k
- In-memory rate limiting — not correct across multiple instances without Redis
- Customer emails not unique — not required, real CRMs allow duplicates. User emails ARE unique (login).
- No password reset — needs email service, out of scope
- Frontend types hand-written, not from Prisma — API responses are reshaped JSON, not raw DB rows
- Delete/restore admin-only, create/edit/assign open to all — delete affects whole team's view

## 7. Production Improvement: Rate Limiting

`@nestjs/throttler`.

- Global: 100 req/min, all routes
- `/auth/login`: 5 req/min — actual attack surface is brute-force login
- Verified: Postman Runner, 6 login attempts, 5 succeed, 6th returns 429

Trade-off: in-memory counters, resets on restart, not shared across instances. Redis fixes this, skipped to avoid extra dependency.