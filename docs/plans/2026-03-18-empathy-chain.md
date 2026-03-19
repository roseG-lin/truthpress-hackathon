# Empathy Chain Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a user-triggered empathy supplement flow (Agent D) that uses SecondMe memory for logged-in users and a one-line background for anonymous users.

**Architecture:** UI triggers a new `/api/empathy` route. The route assembles memory context (from Prisma Profile softMemory or anonymous background), calls the LLM via `src/lib/llm.ts`, and returns a supplemental empathetic paragraph. The UI renders it below Judge C output (does not replace original).

**Tech Stack:** Next.js App Router, TypeScript, Prisma (SQLite), OpenAI SDK (DeepSeek), custom unit-test harness.

---

### Task 1: Add failing tests for empathy prompt + output helpers

**Files:**
- Create: `src/lib/__tests__/empathy.test.ts`
- Modify: `src/lib/__tests__/run-tests.ts`

**Step 1: Write the failing test**

```typescript
import assert from "node:assert/strict";

import { buildEmpathyPrompt, generateEmpathySupplement } from "../empathy";
import { type AsyncTestCase } from "./test-helpers";

export const empathyCases: AsyncTestCase[] = [
  {
    name: "buildEmpathyPrompt includes memory and background",
    run: () => {
      const { systemPrompt, userPrompt } = buildEmpathyPrompt({
        originalContent: "Judge summary",
        userFeedback: "Too cold",
        memorySummary: "grew up in rural schools",
        userBackground: "I struggled with access",
      });

      assert.ok(systemPrompt.includes("do not introduce new facts"));
      assert.ok(userPrompt.includes("Judge summary"));
      assert.ok(userPrompt.includes("Too cold"));
      assert.ok(userPrompt.includes("grew up in rural schools"));
      assert.ok(userPrompt.includes("I struggled with access"));
    },
  },
  {
    name: "generateEmpathySupplement returns trimmed LLM output",
    run: async () => {
      const result = await generateEmpathySupplement(
        {
          originalContent: "Judge summary",
          userFeedback: "Too cold",
        },
        {
          generateText: async () => "  empathetic reply  ",
        },
      );

      assert.equal(result, "empathetic reply");
    },
  },
];
```

**Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with missing module `../empathy` or missing exports.

**Step 3: Register test suite**

Add to `src/lib/__tests__/run-tests.ts`:

```typescript
import { empathyCases } from "./empathy.test";
// ...
await runCases("Empathy", empathyCases);
```

**Step 4: Run tests to verify failure**

Run: `npm test`
Expected: FAIL (until `src/lib/empathy.ts` exists).

---

### Task 2: Implement empathy helper (minimal code to pass tests)

**Files:**
- Create: `src/lib/empathy.ts`

**Step 1: Implement minimal helpers**

```typescript
type EmpathyInput = {
  originalContent: string;
  userFeedback: string;
  memorySummary?: string;
  userBackground?: string;
};

type EmpathyDeps = {
  generateText?: (options: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
  }) => Promise<string>;
};

export function buildEmpathyPrompt(input: EmpathyInput) {
  const memoryLine = input.memorySummary ? `User memory: ${input.memorySummary}` : "";
  const backgroundLine = input.userBackground ? `User background: ${input.userBackground}` : "";

  return {
    systemPrompt:
      "You are Agent D, an empathy bridge. Do not introduce new facts. Only rephrase the verified content to feel understood.",
    userPrompt: [
      `Verified content: ${input.originalContent}`,
      `User feedback: ${input.userFeedback}`,
      memoryLine,
      backgroundLine,
      "Write a warm, concise supplement (80-150 Chinese characters).",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export async function generateEmpathySupplement(input: EmpathyInput, deps: EmpathyDeps = {}) {
  if (!input.originalContent?.trim()) {
    throw new Error("originalContent is required");
  }
  if (!input.userFeedback?.trim()) {
    throw new Error("userFeedback is required");
  }

  const { generateText } = deps;
  if (!generateText) {
    const { generateText: defaultGenerateText } = await import("./llm");
    const prompt = buildEmpathyPrompt(input);
    const result = await defaultGenerateText({
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      temperature: 0.5,
    });
    return result.trim();
  }

  const prompt = buildEmpathyPrompt(input);
  const result = await generateText({
    systemPrompt: prompt.systemPrompt,
    userPrompt: prompt.userPrompt,
    temperature: 0.5,
  });
  return result.trim();
}
```

**Step 2: Run tests to verify pass**

Run: `npm test`
Expected: PASS for Empathy tests.

---

### Task 3: Add `/api/empathy` route (uses memory or anonymous background)

**Files:**
- Create: `src/app/api/empathy/route.ts`
- Modify: `src/lib/runtime.ts` (optional helper for profile fetch)

**Step 1: Implement API route**

Pseudo-code:
- Parse JSON `{ originalContent, userFeedback, userBackground }`
- Require `originalContent` + `userFeedback`
- Read `session_id` cookie
- If session exists: fetch Prisma user + latest Profile (shades/softMemory)
- Build memory summary (parse JSON, use `buildAgentSummary`)
- If no session and no `userBackground`: return 400
- Call `generateEmpathySupplement`
- On LLM failure: return fallback text

**Step 2: Manual test**

Run app and call endpoint:

```bash
curl -X POST http://localhost:3000/api/empathy \
  -H "Content-Type: application/json" \
  -d '{"originalContent":"...","userFeedback":"...","userBackground":"I grew up rural"}'
```

Expected: JSON `{ empatheticSupplement: "..." }`

---

### Task 4: Add empathy UI (button + modal + supplemental card)

**Files:**
- Modify: `src/components/cafe/cafe-experience.tsx`

**Step 1: UI changes**
- Add state for empathy modal, input, loading, error, result
- Add button in Judge C panel: “我不认同/希望被理解”
- Modal with two inputs: feedback (required), background (optional)
- Submit to `/api/empathy`
- Render “共情补充” card below Judge summary

**Step 2: Manual test**
- Run `npm run dev`
- Enter stance, generate debate, click empathy button
- Submit feedback, verify supplement appears
- Anonymous + empty background should show error

---

### Task 5: Update project documentation

**Files:**
- Modify: `docs/项目详情.md`

**Step 1: Update to reflect real API**
- Add `/api/empathy` route
- Clarify anonymous background requirement

**Step 2: Manual check**
- Verify doc matches current implementation.

---

Plan complete and saved to `docs/plans/2026-03-18-empathy-chain.md`.

Two execution options:
1. **Subagent-Driven (this session)** - I dispatch a fresh subagent per task, review between tasks.
2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints.

Which approach?
