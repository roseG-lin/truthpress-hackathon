import assert from "node:assert/strict";

import { buildAgentSummary } from "../agent-summary";
import { type AsyncTestCase } from "./test-helpers";

export const agentSummaryCases: AsyncTestCase[] = [
  {
    name: "buildAgentSummary extracts useful tokens from shades and softMemory",
    run: () => {
      const shades = {
        traits: ["curious", "skeptical"],
        values: { core: "evidence-first" },
      };
      const softMemory = {
        roles: ["researcher", "teacher"],
        notes: "Prefers verified sources and peer review.",
      };

      const summary = buildAgentSummary(shades, softMemory);

      assert.match(summary, /curious/);
      assert.match(summary, /skeptical/);
      assert.match(summary, /evidence/);
      assert.match(summary, /researcher/);
      assert.match(summary, /teacher/);
    },
  },
  {
    name: "buildAgentSummary handles empty inputs safely",
    run: () => {
      const summary = buildAgentSummary(null, null);
      assert.equal(summary, "");
    },
  },
];
