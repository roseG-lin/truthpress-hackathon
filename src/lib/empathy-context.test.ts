import assert from "node:assert/strict";

import { buildEmpathyExplanation } from "./empathy-context";
import { runCases, type AsyncTestCase } from "./__tests__/test-helpers";

export const empathyContextCases: AsyncTestCase[] = [
  {
    name: "buildEmpathyExplanation prefers memory-highlights explanation for logged-in users",
    run: () => {
      const result = buildEmpathyExplanation({
        source: "secondme",
        memoryHighlights: ["rural school", "limited resources"],
      });

      assert.match(result, /SecondMe|记忆片段/);
    },
  },
  {
    name: "buildEmpathyExplanation explains anonymous background fallback",
    run: () => {
      const result = buildEmpathyExplanation({
        source: "anonymous",
        userBackground: "I grew up in a small town.",
      });

      assert.match(result, /一句话背景/);
    },
  },
  {
    name: "buildEmpathyExplanation mentions fallback mode when requested",
    run: () => {
      const result = buildEmpathyExplanation({
        source: "anonymous",
        fallback: true,
      });

      assert.match(result, /保底共情措辞/);
    },
  },
];

runCases("Empathy Context", empathyContextCases).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
