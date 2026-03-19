import assert from "node:assert/strict";

import { runCases, type AsyncTestCase } from "./__tests__/test-helpers";
import { buildGenerateResponse } from "./generate-service";

export const generateServiceCases: AsyncTestCase[] = [
  {
    name: "buildGenerateResponse keeps Agent D idle when empathy is disabled",
    run: async () => {
      const llmResponses = [
        JSON.stringify({
          output: "AI can improve access and tutor availability.",
          claims: ["AI can improve access"],
        }),
        JSON.stringify({
          result: "verified",
          evidence: "Evidence supports broader tutoring availability.",
        }),
        "AI can improve access, but the claim still depends on how it is deployed.",
      ];

      const result = await buildGenerateResponse(
        {
          topic: "AI should replace teachers",
          userId: "user-1",
          enableEmpathy: false,
        },
        {
          generateText: async () => llmResponses.shift() ?? "",
          searchWeb: async (query: string) => [
            {
              title: query,
              snippet: "Sample evidence",
              url: "https://example.com/evidence",
            },
          ],
        },
      );

      assert.equal(result.stages.agentD.status, "idle");
      assert.equal(result.finalContent, "AI can improve access, but the claim still depends on how it is deployed.");
    },
  },
  {
    name: "buildGenerateResponse keeps Agent C as finalContent and exposes Agent D as a supplement",
    run: async () => {
      const llmResponses = [
        JSON.stringify({
          output: "AI can tailor explanations to different learners.",
          claims: ["AI can tailor explanations to different learners"],
        }),
        JSON.stringify({
          result: "uncertain",
          evidence: "Evidence is mixed across classroom settings.",
        }),
        "AI may help some learners more than others, and the rollout context matters.",
        "If education felt uneven in your experience, this conclusion is really about setting realistic expectations without dismissing that pain.",
      ];

      const result = await buildGenerateResponse(
        {
          topic: "AI should replace teachers",
          userId: "user-2",
          enableEmpathy: true,
        },
        {
          memorySummary: "The user grew up with limited education resources.",
          generateText: async () => llmResponses.shift() ?? "",
          searchWeb: async (query: string) => [
            {
              title: query,
              snippet: "Sample evidence",
              url: "https://example.com/evidence",
            },
          ],
        },
      );

      assert.equal(result.stages.agentD.status, "completed");
      assert.match(result.stages.agentD.output || "", /education felt uneven/i);
      assert.equal(
        result.finalContent,
        "AI may help some learners more than others, and the rollout context matters.",
      );
      assert.match(result.empatheticSupplement || "", /education felt uneven/i);
    },
  },
];

if (require.main === module) {
  runCases("Generate Service", generateServiceCases).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
