# Priority Security Roadmap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Execute the next hardening priorities in order: encrypted token storage, broader rate-limit architecture, structured error handling, and cleanup of stale legacy routes.

**Architecture:** Phase 1 avoids risky schema changes by encrypting OAuth secrets transparently inside the existing `User.accessToken` and `User.refreshToken` columns. Reads will support legacy plaintext rows so the app keeps working during rollout; new writes will store `enc:v1:` payloads through a shared crypto helper. Later phases build on the existing route-level hardening already added.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma/SQLite, Node crypto, custom TypeScript test harness

---

### Task 1: Encrypt OAuth tokens at rest with backward-compatible reads

**Files:**
- Create: `src/lib/token-crypto.ts`
- Create: `src/lib/token-crypto.test.ts`
- Modify: `src/lib/auth-session.ts`
- Modify: `src/app/api/auth/callback/route.ts`
- Modify: `.env.example`
- Modify: `README.md`

**Step 1: Write the failing test**

Add tests for:
- encrypt/decrypt round-trip with a supplied key
- legacy plaintext passthrough on read
- invalid ciphertext rejection

**Step 2: Run test to verify it fails**

Run:
```bash
npm.cmd test
```
Expected: FAIL because `token-crypto.ts` does not exist yet.

**Step 3: Write minimal implementation**

Implement AES-256-GCM helper with versioned storage prefix, key derivation from `TOKEN_ENCRYPTION_KEY` or `SECONDME_CLIENT_SECRET`, and legacy plaintext compatibility.

**Step 4: Wire it into auth/session flows**

- encrypt tokens before `prisma.user.create/update` in `src/app/api/auth/callback/route.ts`
- decrypt tokens in `src/lib/auth-session.ts` before returning the authenticated user

**Step 5: Run verification**

Run:
```bash
npm.cmd test
npx.cmd tsc -p tsconfig.json --noEmit
npm.cmd run build
```
Expected: PASS

### Task 2: Expand rate limiting from point fixes to shared policy

**Files:**
- Modify: `src/lib/rate-limit.ts`
- Modify: selected `src/app/api/*/route.ts`
- Create: `src/lib/rate-limit-policy.ts`

**Step 1: Define route policy buckets**

Split policies by cost and abuse profile instead of hard-coded per-route literals.

**Step 2: Apply to remaining exposed routes**

Cover auth, profile refresh, notes, memories, and any still-public demo endpoints that should not be unlimited.

### Task 3: Add structured API error responses

**Files:**
- Create: `src/lib/api-error.ts`
- Modify: selected `src/app/api/*/route.ts`

**Step 1: Standardize JSON error shape**

Add a helper for stable `{ error, message, details? }` responses and use it on the main API surface.

**Step 2: Preserve product behavior**

Do not break current frontend success-path assumptions while normalizing error paths.

### Task 4: Remove or formally deprecate stale legacy routes

**Files:**
- Modify: `src/app/api/empathy/route.ts`
- Modify: `src/app/api/debate/route.ts`
- Modify: stale callers under `src/components/cafe/*` and `src/components/ladder/*`
- Modify: `README.md`

**Step 1: Audit actual call sites**

Confirm which legacy routes still have live callers.

**Step 2: Either migrate or deprecate**

Point remaining callers to current routes where needed and document any intentionally retained compatibility endpoints.

### Task 5: Final verification and status doc update

**Files:**
- Modify: `README.md`

**Step 1: Record phase completion and remaining risks**

**Step 2: Run full verification**

Run:
```bash
npm.cmd test
npx.cmd tsc -p tsconfig.json --noEmit
npm.cmd run clean
npm.cmd run build
```
Expected: PASS