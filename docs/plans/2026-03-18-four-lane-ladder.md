# Four-Lane Ladder Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the Truth Ladder animation into four dedicated lanes (A/B/C/D) with new C/D empathy merge behavior.

**Architecture:** Replace single-stack state with per-agent lane stacks, add pure state helpers for audit/merge logic, then update UI rendering to a 4-column lane layout and adapt animations to the new structure.

**Tech Stack:** Next.js (App Router), React, TypeScript, framer-motion, Tailwind CSS, custom test harness in `src/lib/__tests__`.

---

### Task 1: Add lane-state helpers + failing tests (TDD RED)

**Files:**
- Create: `src/components/ladder/ladder-state.ts`
- Create: `src/lib/__tests__/ladder-game-state.test.ts`
- Modify: `src/lib/__tests__/run-tests.ts`

**Step 1: Write the failing tests**

Create `src/lib/__tests__/ladder-game-state.test.ts`:

```ts
import assert from "node:assert/strict";

import {
  createEmptyStacks,
  applyAuditOutcome,
  finalizeEmpathyMerge,
  type LaneStacks,
} from "../../components/ladder/ladder-state";
import { type AsyncTestCase } from "./test-helpers";

export const ladderGameStateCases: AsyncTestCase[] = [
  {
    name: "createEmptyStacks returns empty lanes for A/B/C/D",
    run: () => {
      const stacks = createEmptyStacks();
      assert.deepEqual(stacks.A, []);
      assert.deepEqual(stacks.B, []);
      assert.deepEqual(stacks.C, []);
      assert.deepEqual(stacks.D, []);
    },
  },
  {
    name: "applyAuditOutcome verifies A block without adding B block",
    run: () => {
      const stacks: LaneStacks = {
        A: [{ id: "a1", text: "A1", owner: "A", status: "pending", color: "bg-blue-500" }],
        B: [],
        C: [],
        D: [],
      };

      const result = applyAuditOutcome(stacks, 0, true);

      assert.equal(result.stacks.A[0].status, "verified");
      assert.equal(result.stacks.B.length, 0);
    },
  },
  {
    name: "applyAuditOutcome rejects A block and adds red block to B",
    run: () => {
      const stacks: LaneStacks = {
        A: [{ id: "a1", text: "A1", owner: "A", status: "pending", color: "bg-blue-500" }],
        B: [],
        C: [],
        D: [],
      };

      const result = applyAuditOutcome(stacks, 0, false);

      assert.equal(result.stacks.A.length, 0);
      assert.equal(result.stacks.B.length, 1);
      assert.equal(result.stacks.B[0].status, "rejected");
    },
  },
  {
    name: "finalizeEmpathyMerge clears D and leaves a single golden C block",
    run: () => {
      const stacks: LaneStacks = {
        A: [],
        B: [],
        C: [
          { id: "c1", text: "C1", owner: "C", status: "pending", color: "bg-violet-500" },
          { id: "c2", text: "C2", owner: "C", status: "pending", color: "bg-violet-500" },
        ],
        D: [{ id: "d1", text: "D1", owner: "D", status: "pending", color: "bg-amber-400" }],
      };

      const result = finalizeEmpathyMerge(stacks, "final empathy");

      assert.equal(result.C.length, 1);
      assert.equal(result.C[0].status, "merged");
      assert.equal(result.C[0].text, "final empathy");
      assert.equal(result.D.length, 0);
    },
  },
];
```

**Step 2: Run tests to verify RED**

Run: `cmd /c npm test`
Expected: FAIL with missing module `ladder-state` or missing exports.

---

### Task 2: Implement lane-state helpers (GREEN)

**Files:**
- Create: `src/components/ladder/ladder-state.ts`

**Step 1: Implement minimal helpers**

```ts
import type { AgentType, Block } from "./game-types";

export type LaneStacks = Record<AgentType, Block[]>;

export function createEmptyStacks(): LaneStacks {
  return { A: [], B: [], C: [], D: [] };
}

export function applyAuditOutcome(
  stacks: LaneStacks,
  index: number,
  verified: boolean,
): { stacks: LaneStacks } {
  const nextA = [...stacks.A];
  const nextB = [...stacks.B];
  const target = nextA[index];
  if (!target) {
    return { stacks };
  }

  if (verified) {
    nextA[index] = { ...target, status: "verified", color: "bg-green-500" };
    return { stacks: { ...stacks, A: nextA, B: nextB } };
  }

  nextA.splice(index, 1);
  nextB.push({
    id: `b-reject-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text: "Î´Í¨¹ý",
    owner: "B",
    status: "rejected",
    color: "bg-red-600",
  });

  return { stacks: { ...stacks, A: nextA, B: nextB } };
}

export function finalizeEmpathyMerge(stacks: LaneStacks, finalText: string): LaneStacks {
  return {
    ...stacks,
    C: [
      {
        id: `c-final-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: finalText,
        owner: "C",
        status: "merged",
        color: "bg-amber-400",
      },
    ],
    D: [],
  };
}
```

**Step 2: Run tests to verify GREEN**

Run: `cmd /c npm test`
Expected: PASS.

**Step 3: (Optional) Refactor**

If needed, extract ID generation into a small helper. Keep tests green.

---

### Task 3: Update game types + hook logic to use lane stacks (TDD cycle)

**Files:**
- Modify: `src/components/ladder/game-types.ts`
- Modify: `src/components/ladder/useLadderGame.ts`
- Modify: `src/lib/__tests__/run-tests.ts`

**Step 1: Update types to new shape**

`GameState` should replace `ladderStack/opponentStack` with `stacks: LaneStacks`.

**Step 2: Add hook-level tests (RED)**

Add a new test file `src/lib/__tests__/ladder-game-hook.test.ts` (or expand the previous file) to assert:
- `buildBlock` appends to `stacks.A`.
- `auditBlock(false)` removes from `stacks.A` and adds 1 red block to `stacks.B`.
- `challengeBlock` appends to `stacks.D`.
- `mergeStacks` ultimately clears `stacks.D` and keeps one merged `stacks.C` block.

Register the cases in `src/lib/__tests__/run-tests.ts`.

**Step 3: Implement hook changes (GREEN)**

Update `useLadderGame` to use `createEmptyStacks` and `applyAuditOutcome`/`finalizeEmpathyMerge`.
Key changes:
- Replace `ladderStack` with `stacks.A`, `opponentStack` with `stacks.D`.
- `auditBlock(verify)` uses `applyAuditOutcome` and A removal on reject.
- `challengeBlock` pushes to `stacks.D`.
- `mergeStacks` creates C blocks per D block (incremental), then calls `finalizeEmpathyMerge` at the end to leave a single golden C block and clear D.

**Step 4: Run tests**

Run: `cmd /c npm test`
Expected: PASS.

---

### Task 4: Update Cafe UI + GameArena to render 4 lanes (TDD cycle)

**Files:**
- Modify: `src/app/cafe/page.tsx`
- Modify: `src/components/ladder/GameArena.tsx`

**Step 1: Write UI rendering test (RED)**

If UI tests are not available, add a small render test in `src/lib/__tests__/ladder-game-ui.test.ts` that asserts lane order/labels by rendering a lightweight helper component (or skip with explicit note if render testing infra is missing).

**Step 2: Implement UI changes (GREEN)**

- Replace the single column + opponent column with a 4-column grid.
- Render each lane from `gameState.stacks[agent]` using `flex flex-col-reverse`.
- Add lane labels ¡°Agent A/B/C/D¡± above each lane.
- Ensure ground avatars render per lane and remain visible.

**Step 3: Run tests**

Run: `cmd /c npm test`
Expected: PASS.

---

### Task 5: Manual visual check (non-test)

Run: `cmd /c npm run dev` and open `/cafe`.
Check:
- Four lanes visible A/B/C/D
- A builds in A lane
- B rejects adds red block only
- D blocks appear in D lane
- Merge results in single golden C block

---

### Task 6: Commit (optional)

```bash
git add src/components/ladder src/app/cafe/page.tsx src/lib/__tests__
git commit -m "feat: refactor ladder into four lanes"
```
