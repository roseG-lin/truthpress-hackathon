# Ladder Of Truth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace `/cafe` with the "Ladder of Truth" split-screen UI driven by streamed ladder events, with a safe front-end fallback simulation.

**Architecture:** A `LadderArena` client component renders the left log + right ladder scene using Framer Motion. Events arrive from an SSE endpoint (`/api/ladder`) or a local simulation fallback; a small reducer in `src/lib` updates ladder state based on events.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Framer Motion, lucide-react.

---

### Task 1: Add event reducer + tests (TDD)

**Files:**
- Create: `src/lib/ladder-engine.ts`
- Create: `src/lib/__tests__/ladder-engine.test.ts`
- Modify: `src/lib/__tests__/run-tests.ts`

**Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { type LadderEvent, initLadderState, reduceLadderEvent } from "../ladder-engine";
import { type AsyncTestCase } from "./test-helpers";

export const ladderEngineCases: AsyncTestCase[] = [
  {
    name: "A_NEW_STEP pushes a pending stair",
    run: () => {
      const state = initLadderState();
      const next = reduceLadderEvent(state, { event: "A_NEW_STEP", text: "AI is great" });
      assert.equal(next.stairs.length, 1);
      assert.equal(next.stairs[0].status, "pending");
    },
  },
];
```

**Step 2: Run test to verify it fails**

Run: `npm test`  
Expected: FAIL with "Cannot find module '../ladder-engine'"

**Step 3: Write minimal implementation**

```ts
export type LadderEvent = { event: "A_NEW_STEP"; text: string } | ...;
export function initLadderState() { return { stairs: [], dStairs: [], ... }; }
export function reduceLadderEvent(state, event) { ... }
```

**Step 4: Run test to verify it passes**

Run: `npm test`  
Expected: PASS for Ladder Engine tests

**Step 5: Commit**

```bash
git add src/lib/ladder-engine.ts src/lib/__tests__/ladder-engine.test.ts src/lib/__tests__/run-tests.ts
git commit -m "feat: add ladder event reducer and tests"
```

---

### Task 2: Add LadderArena component (UI + animation)

**Files:**
- Create: `src/components/ladder/LadderArena.tsx`

**Step 1: Write the failing test**

Skip (UI-only; approved by user)

**Step 2: Implement component**

Key requirements:
- Left log terminal UI with monospace font and lucide-react icons.
- Right ladder stage: stairs array renders with Framer Motion layout + exit animations.
- Avatars A/B/C use motion and layoutId. A moves to top, B climbs on audit, C bounces at bottom.
- Phase C merge: D stack appears, then merges into C stack; C avatar color morph.
- Use Framer Motion for all animations (layout + exit).

**Step 3: Manual verification**

Run `npm run dev` and confirm animation stages advance and no console errors.

**Step 4: Commit**

```bash
git add src/components/ladder/LadderArena.tsx
git commit -m "feat: add LadderArena UI and animations"
```

---

### Task 3: SSE event endpoint + fallback simulation

**Files:**
- Create: `src/app/api/ladder/route.ts`
- Modify: `src/components/ladder/LadderArena.tsx`

**Step 1: Write failing test**

Skip (API route; can be validated manually)

**Step 2: Implement SSE**

Return `text/event-stream` with JSON events:
- `A_NEW_STEP` (text)
- `B_VERIFY_STEP` (index, result)
- `B_DESTROY_STEP` (index)
- `C_ABSORB_D`

**Step 3: Update LadderArena**

Use `EventSource("/api/ladder")`; parse `message.data` and feed reducer. On error, fall back to local simulation events.

**Step 4: Manual verification**

Confirm ladder responds to live stream. If SSE fails, local simulation still runs.

**Step 5: Commit**

```bash
git add src/app/api/ladder/route.ts src/components/ladder/LadderArena.tsx
git commit -m "feat: add ladder SSE stream and fallback simulation"
```

---

### Task 4: Wire `/cafe` to LadderArena and add deps

**Files:**
- Modify: `src/app/cafe/page.tsx`
- Modify: `package.json`

**Step 1: Write failing test**

Skip (UI-only; approved by user)

**Step 2: Implementation**

- Replace page with `<LadderArena />`.
- Add dependencies `framer-motion` and `lucide-react`.

**Step 3: Manual verification**

Ensure `/cafe` loads the Ladder UI.

**Step 4: Commit**

```bash
git add src/app/cafe/page.tsx package.json
git commit -m "feat: replace cafe with ladder arena"
```

---

### Task 5: Update docs (optional)

**Files:**
- Modify: `README.md`

**Step 1: Update README**

Add brief note for Ladder of Truth UI and `/cafe` behavior.

**Step 2: Manual verification**

Check for clarity and correct paths.

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document ladder of truth UI"
```
