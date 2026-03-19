import assert from "node:assert/strict";

import { runCases, type AsyncTestCase } from "./__tests__/test-helpers";
import { runGeneratePipeline } from "./generate-pipeline";

export const generatePipelineCases: AsyncTestCase[] = [
  {
    name: "runGeneratePipeline returns a docs-aligned A/B/C response shape",
    run: async () => {
      const llmResponses = [
        JSON.stringify({
          output: "AI can provide 24/7 tutoring and adapt content to each learner.",
          claims: [
            "AI can provide 24/7 tutoring",
            "AI can adapt content to each learner",
          ],
        }),
        JSON.stringify({
          result: "verified",
          evidence: "A study found AI tutors can stay available around the clock.",
        }),
        JSON.stringify({
          result: "uncertain",
          evidence: "Adaptation quality depends on training data and classroom context.",
        }),
        "AI can widen access, but personalized outcomes still depend on implementation quality.",
      ];

      const result = await runGeneratePipeline(
        {
          topic: "AI should replace teachers",
          userId: "user-123",
          enableEmpathy: false,
        },
        {
          generateText: async () => llmResponses.shift() ?? "",
          searchWeb: async (query: string) => [
            {
              title: `Evidence for ${query}`,
              snippet: `Snippet for ${query}`,
              url: `https://example.com/${encodeURIComponent(query)}`,
            },
          ],
        },
      );

      assert.equal(result.stages.agentA.status, "completed");
      assert.equal(result.stages.agentB.status, "completed");
      assert.equal(result.stages.agentC.status, "completed");
      assert.equal(result.stages.agentD.status, "idle");
      assert.equal(result.stages.agentB.verification.length, 2);
      assert.equal(result.stages.agentB.verification[0]?.result, "verified");
      assert.equal(result.stages.agentB.verification[1]?.result, "uncertain");
      assert.equal(
        result.finalContent,
        "AI can widen access, but personalized outcomes still depend on implementation quality.",
      );
    },
  },
];

if (require.main === module) {
  runCases("Generate Pipeline", generatePipelineCases).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
