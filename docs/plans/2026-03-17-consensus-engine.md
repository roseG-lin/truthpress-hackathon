# Consensus Engine Integration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate the TruthPress multi-agent debate flow into the existing Next.js + SecondMe project, adding automatic opponent matching and a smooth Lobby → Arena product flow.

**Architecture:** Build the feature entirely in the Next.js app. Add a file-backed matchmaker in `src/lib/matchmaker.ts`, a DeepSeek-powered debate engine in `src/lib/debate-engine.ts`, a server action entry point in `src/app/actions/debate.ts`, and a new `src/app/cafe/page.tsx` UI that supports logged-in SecondMe users and anonymous fallbacks. Keep persistence lightweight with `data/opinions.json`, and reuse cookies + Prisma profile lookups to enrich the current user when available.

**Tech Stack:** Next.js App Router, TypeScript, OpenAI SDK, local JSON storage, Tailwind CSS, Node test runner with `tsx`

---

### Task 1: Add test harness and failing logic tests

**Files:**
- Modify: `package.json`
- Create: `src/lib/__tests__/matchmaker.test.ts`
- Create: `src/lib/__tests__/debate-engine.test.ts`

**Step 1: Write the failing tests**

Add tests for:
- saving opinions and loading them back from the JSON store
- matching a conceptually opposite opinion before falling back to synthetic persona
- formatting a debate result with a judge verdict payload

**Step 2: Run tests to verify they fail**

Run: `node --import tsx --test src/lib/__tests__/matchmaker.test.ts src/lib/__tests__/debate-engine.test.ts`
Expected: FAIL because the new modules do not exist yet.

**Step 3: Write minimal implementation**

Implement the store, matching helpers, and debate engine helpers.

**Step 4: Run tests to verify they pass**

Run: `node --import tsx --test src/lib/__tests__/matchmaker.test.ts src/lib/__tests__/debate-engine.test.ts`
Expected: PASS

### Task 2: Add server action and runtime helpers

**Files:**
- Create: `src/app/actions/debate.ts`
- Create: `src/lib/runtime.ts`

**Step 1: Write the failing tests**

Add tests for:
- normalizing login vs anonymous current user context
- returning a debate payload that contains user profile, opponent profile, and judge verdict JSON

**Step 2: Run tests to verify they fail**

Run: `node --import tsx --test src/lib/__tests__/matchmaker.test.ts src/lib/__tests__/debate-engine.test.ts`
Expected: FAIL until the helpers exist.

**Step 3: Write minimal implementation**

Implement user context resolution and the server action orchestration.

**Step 4: Run tests to verify it passes**

Run the same node test command.

### Task 3: Build the Lobby → Arena page

**Files:**
- Create: `src/app/cafe/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Step 1: Build the UI**

Create:
- Lobby state with opinion input and `Find Opponent` button
- loading transition with scanning copy
- Arena state with User vs Opponent cards and a centered Truth Console

**Step 2: Wire server action**

Hook the page to `generateDebateRound` and render the returned debate artifacts.

**Step 3: Verify locally**

Run: `npm run build`
Expected: PASS

### Task 4: Add seed data and handoff

**Files:**
- Create: `data/opinions.json`

**Step 1: Seed the datastore**

Create an empty JSON array so the file-backed store is always present.

**Step 2: Full verification**

Run:
- `node --import tsx --test src/lib/__tests__/matchmaker.test.ts src/lib/__tests__/debate-engine.test.ts`
- `npm run build`

Expected: PASS
