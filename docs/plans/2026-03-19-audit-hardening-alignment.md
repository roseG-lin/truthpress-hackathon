# Audit Hardening Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Verify the external audit against the real TruthPress codebase, fix the confirmed high-value issues, and record which reported items are deferred or rejected.

**Architecture:** Add small pure utility modules for environment validation, OAuth state expiry, chat input validation, and in-memory rate limiting so the behavior can be tested outside Next.js route handlers. Wire those utilities into the auth and high-cost API routes with minimal surface-area changes, and remove development-only debug logging from the ladder UI.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma/SQLite, custom Node test harness, Python requirements.txt

---

### Task 1: Add failing tests for the confirmed audit issues

**Files:**
- Create: `src/lib/secondme-config.test.ts`
- Create: `src/lib/oauth-state.test.ts`
- Create: `src/lib/chat-request.test.ts`
- Modify: `src/lib/rate-limit.ts`
- Create: `src/lib/rate-limit.test.ts`
- Modify: `package.json`

**Step 1: Write failing tests**

Add tests that assert:
- missing `SECONDME_CLIENT_ID` / `SECONDME_CLIENT_SECRET` / `SECONDME_CALLBACK_URL` are rejected with explicit errors
- OAuth state cookies older than 10 minutes are rejected
- non-string / empty / oversized chat messages are rejected
- rate limiting blocks requests after the configured window limit

**Step 2: Run tests to verify they fail**

Run:
```bash
npm.cmd test
```

Expected: FAIL because the new helpers do not exist yet.

### Task 2: Implement the shared hardening utilities

**Files:**
- Create: `src/lib/secondme-config.ts`
- Create: `src/lib/oauth-state.ts`
- Create: `src/lib/chat-request.ts`
- Modify: `src/lib/rate-limit.ts`

**Step 1: Implement minimal production code**

Add:
- `getSecondMeConfig()` for validated env access with safe public URL defaults
- OAuth state serialization/parsing helpers with explicit age validation
- `normalizeChatMessage()` for string/trim/length validation
- an in-memory fixed-window limiter suitable for current single-process deployment and local/dev use

**Step 2: Run tests**

Run:
```bash
npm.cmd test
```

Expected: PASS for the new utility tests.

### Task 3: Wire the auth and API routes to the new utilities

**Files:**
- Modify: `src/lib/secondme.ts`
- Modify: `src/app/api/auth/login/route.ts`
- Modify: `src/app/api/auth/callback/route.ts`
- Modify: `src/app/api/chat/route.ts`
- Modify: `src/app/api/generate/route.ts`
- Modify: `src/app/api/empathy-v2/route.ts`

**Step 1: Update route behavior**

Apply:
- validated config access instead of non-null env assertions
- issued-at state cookie storage on login and explicit 10-minute state validation on callback
- targeted rate limiting on the most abuse-prone compute endpoints
- chat payload validation before persistence / upstream fetch

**Step 2: Verify typing**

Run:
```bash
npx.cmd tsc -p tsconfig.json --noEmit
```

Expected: PASS

### Task 4: Remove dev-only debug logs and pin Python dependencies

**Files:**
- Modify: `src/components/ladder/LadderArena.tsx`
- Modify: `src/components/ladder/RightPanel.tsx`
- Modify: `requirements.txt`

**Step 1: Clean obvious debug output**

Remove `console.log` traces that were only used for temporary ladder scene debugging while keeping real error logs intact.

**Step 2: Pin Python dependency ranges**

Add stable version ranges for the small Python surface used by the demo scripts.

### Task 5: Record audit verdict and verify end-to-end

**Files:**
- Modify: `README.md`

**Step 1: Document the verdict**

Briefly document:
- which external audit items were confirmed and fixed
- which items were false positives (`README.md`, `.env.example`)
- which items remain planned (`token encryption`, broader structured error strategy, full API-wide rate limit architecture)

**Step 2: Run full verification**

Run:
```bash
npm.cmd test
npx.cmd tsc -p tsconfig.json --noEmit
npm.cmd run clean
npm.cmd run build
```

Expected: PASS