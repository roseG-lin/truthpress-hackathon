# Cafe Login-Gated Debate Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Gate the debate arena by login, add opinion inputs in the correct lanes, and replace the homepage chat area with guided cards + account info + debate entry.

**Architecture:** Add a small pure access helper to decide demo vs. interactive mode, then update Home and Cafe UI to use that state. In Cafe, show input boxes only when logged in, run A/B/C from the user opinion, then accept D input and call `/api/empathy` to produce the final golden C block.

**Tech Stack:** Next.js (App Router), React, TypeScript, framer-motion, Tailwind CSS, custom test harness in `src/lib/__tests__`.

---

### Task 1: Add access helper + failing tests (TDD RED)

**Files:**
- Create: `src/lib/cafe-access.ts`
- Create: `src/lib/__tests__/cafe-access.test.ts`
- Modify: `src/lib/__tests__/run-tests.ts`

**Step 1: Write the failing tests**

Create `src/lib/__tests__/cafe-access.test.ts`:

```ts
import assert from "node:assert/strict";
import { resolveCafeAccess } from "../cafe-access";
import { type AsyncTestCase } from "./test-helpers";

export const cafeAccessCases: AsyncTestCase[] = [
  {
    name: "resolveCafeAccess returns demo mode for anonymous user",
    run: () => {
      const access = resolveCafeAccess(null);
      assert.equal(access.mode, "demo");
      assert.equal(access.canInput, false);
      assert.equal(access.showLogin, true);
    },
  },
  {
    name: "resolveCafeAccess returns interactive mode for logged-in user",
    run: () => {
      const access = resolveCafeAccess({ id: "user" });
      assert.equal(access.mode, "interactive");
      assert.equal(access.canInput, true);
      assert.equal(access.showLogin, false);
    },
  },
];
```

Register it in `src/lib/__tests__/run-tests.ts`:

```ts
import { cafeAccessCases } from "./cafe-access.test";
...
await runCases("Cafe Access", cafeAccessCases);
```

**Step 2: Run tests to verify RED**

Run: `cmd /c npm test`
Expected: FAIL with missing module `../cafe-access`.

---

### Task 2: Implement access helper (GREEN)

**Files:**
- Create: `src/lib/cafe-access.ts`

**Step 1: Implement minimal helper**

```ts
type CafeMode = "demo" | "interactive";

type CafeAccess = {
  mode: CafeMode;
  canInput: boolean;
  showLogin: boolean;
};

export function resolveCafeAccess(user: unknown): CafeAccess {
  if (user) {
    return { mode: "interactive", canInput: true, showLogin: false };
  }
  return { mode: "demo", canInput: false, showLogin: true };
}
```

**Step 2: Run tests to verify GREEN**

Run: `cmd /c npm test`
Expected: PASS.

---

### Task 3: Update Home page (replace chat area)

**Files:**
- Modify: `src/app/page.tsx`

**Step 1: Replace “开始对话” CTA**
- Remove the “开始对话” button for logged-in users.
- Add “开始辩论” CTA linking to `/cafe`.
- Keep login CTA for anonymous users.

**Step 2: Add homepage guided cards + account info**
- Add a “功能引导卡片” section (3 cards: 登录 → 输入观点 → 获得共情结论)。
- Add an “已登录账号卡片” when user exists (displayName/secondMeId + link to `/dashboard`).
- For anonymous users, show a “登录后解锁输入和共情” note.

**Step 3: Manual check**
- Logged-in: no chat area, shows account card + debate CTA.
- Anonymous: shows login CTA + guide cards.

---

### Task 4: Update Cafe page (login gating + inputs + flow)

**Files:**
- Modify: `src/app/cafe/page.tsx`

**Step 1: Add login state**
- Fetch `/api/profile` like Home page.
- Use `resolveCafeAccess` to decide demo vs. interactive.
- Add SecondMe login CTA in top nav (right side) if anonymous.

**Step 2: A-lane opinion input (logged-in only)**
- Place input box above A lane.
- On submit: run A/B/C steps using the new user opinion.
- Example A blocks: 3 expansions based on opinion (simple templates).
- B verifies first, rejects second, verifies third.
- C outputs initial summary block (store in `conclusion.initial`).

**Step 3: D input in right panel (logged-in only)**
- Show after C summary exists.
- On submit: add D block(s), call `/api/empathy` with:
  - `originalContent`: C summary
  - `feedback`: user D input
- Use response `empatheticSupplement` for final golden C block.

**Step 4: Demo mode (anonymous)**
- Keep auto demo run (no inputs).
- Use demo payload (existing `buildEmpathyDemoPayload`) to call `/api/empathy` so final golden block appears.

**Step 5: Manual check**
- Anonymous: inputs hidden/disabled, login CTA visible, demo runs.
- Logged-in: inputs visible; A flow runs after submit; D input appears after C summary; final golden block comes from empathy API.

---

### Task 5: Verification

Run: `cmd /c npm test`
Expected: PASS.

---

### Task 6: Commit (optional)

```bash
git add src/app/page.tsx src/app/cafe/page.tsx src/lib src/lib/__tests__
git commit -m "feat: gate cafe flow and replace homepage chat"
```
