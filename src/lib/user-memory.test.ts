import assert from "node:assert/strict";

import { buildProfilePayload, extractMemoryHighlights, parseStoredJson } from "./user-memory";
import { runCases, type AsyncTestCase } from "./__tests__/test-helpers";

export const userMemoryCases: AsyncTestCase[] = [
  {
    name: "parseStoredJson returns null for invalid input",
    run: () => {
      assert.equal(parseStoredJson("{broken"), null);
      assert.equal(parseStoredJson(null), null);
    },
  },
  {
    name: "extractMemoryHighlights returns unique text leaves",
    run: () => {
      const result = extractMemoryHighlights({
        education: ["Rural school", "Rural school"],
        family: {
          note: "Needed extra support",
        },
      });

      assert.deepEqual(result, ["Rural school", "Needed extra support"]);
    },
  },
  {
    name: "buildProfilePayload exposes memory summary and compatibility fields",
    run: () => {
      const payload = buildProfilePayload({
        secondMeId: "secondme-user",
        displayName: "Remi",
        bio: "Builder",
        avatar: "avatar.png",
        shades: { style: "reflective" },
        softMemory: { note: "Grew up with limited education resources" },
      });

      assert.equal(payload.secondMeId, "secondme-user");
      assert.equal(payload.displayName, "Remi");
      assert.equal(payload.profiles[0]?.displayName, "Remi");
      assert.match(payload.memorySummary || "", /education|resources|limited/i);
      assert.deepEqual(payload.memoryHighlights, ["Grew up with limited education resources"]);
    },
  },
];

runCases("User Memory", userMemoryCases).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
