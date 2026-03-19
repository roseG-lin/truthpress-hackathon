import assert from "node:assert/strict";

import { runCases, type AsyncTestCase } from "./__tests__/test-helpers";
import { createSessionToken, hashSessionToken } from "./session-store";

export const sessionStoreCases: AsyncTestCase[] = [
  {
    name: "createSessionToken returns an opaque token rather than a user identifier",
    run: () => {
      const token = createSessionToken();

      assert.ok(token.length >= 32);
      assert.ok(!token.includes("user-123"));
      assert.match(token, /^[A-Za-z0-9_-]+$/);
    },
  },
  {
    name: "hashSessionToken is deterministic and changes when the token is tampered with",
    run: () => {
      const token = createSessionToken();
      const tampered = `${token}x`;

      assert.equal(hashSessionToken(token), hashSessionToken(token));
      assert.notEqual(hashSessionToken(token), hashSessionToken(tampered));
    },
  },
];

if (require.main === module) {
  runCases("Session Store", sessionStoreCases).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
