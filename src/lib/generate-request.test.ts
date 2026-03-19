import assert from "node:assert/strict";

import { runCases, type AsyncTestCase } from "./__tests__/test-helpers";
import { normalizeGenerateRequest } from "./generate-request";

export const generateRequestCases: AsyncTestCase[] = [
  {
    name: "normalizeGenerateRequest allows anonymous generate requests without empathy",
    run: () => {
      const result = normalizeGenerateRequest({
        topic: "AI should replace teachers",
        requestedUserId: "someone-else",
        enableEmpathy: false,
        sessionUser: null,
      });

      assert.equal(result.ok, true);
      if (!result.ok) {
        throw new Error("expected anonymous request to be accepted");
      }

      assert.equal(result.value.userId, "anonymous");
      assert.equal(result.value.enableEmpathy, false);
    },
  },
  {
    name: "normalizeGenerateRequest rejects anonymous empathy requests",
    run: () => {
      const result = normalizeGenerateRequest({
        topic: "AI should replace teachers",
        requestedUserId: "secondme-user",
        enableEmpathy: true,
        sessionUser: null,
      });

      assert.equal(result.ok, false);
      if (result.ok) {
        throw new Error("expected anonymous empathy request to be rejected");
      }

      assert.equal(result.error, "AUTH_REQUIRED_FOR_EMPATHY");
    },
  },
  {
    name: "normalizeGenerateRequest ignores mismatched client userId for authenticated users",
    run: () => {
      const result = normalizeGenerateRequest({
        topic: "AI should replace teachers",
        requestedUserId: "attacker-controlled-id",
        enableEmpathy: true,
        sessionUser: {
          id: "db-user-1",
          secondMeId: "secondme-user-1",
        },
      });

      assert.equal(result.ok, true);
      if (!result.ok) {
        throw new Error("expected authenticated request to be accepted");
      }

      assert.equal(result.value.userId, "secondme-user-1");
      assert.equal(result.value.sessionUserId, "db-user-1");
      assert.equal(result.value.enableEmpathy, true);
    },
  },
];

if (require.main === module) {
  runCases("Generate Request", generateRequestCases).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
