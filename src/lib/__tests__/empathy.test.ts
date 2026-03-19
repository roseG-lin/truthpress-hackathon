import assert from "node:assert/strict";

import { buildEmpathyPrompt, generateEmpathySupplement, resolveEmpathyContext } from "../empathy";
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
  {
    name: "resolveEmpathyContext requires background for anonymous users",
    run: () => {
      const result = resolveEmpathyContext({
        isAnonymous: true,
        memorySummary: "",
        userBackground: "",
      });

      assert.equal(result.ok, false);
      if (!result.ok) {
        assert.equal(result.error, "BACKGROUND_REQUIRED");
      }
    },
  },
  {
    name: "resolveEmpathyContext allows logged-in users without background",
    run: () => {
      const result = resolveEmpathyContext({
        isAnonymous: false,
        memorySummary: "grew up in rural schools",
        userBackground: "",
      });

      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.memorySummary, "grew up in rural schools");
        assert.equal(result.userBackground, undefined);
      }
    },
  },
];
