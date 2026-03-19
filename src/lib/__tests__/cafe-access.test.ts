import assert from "node:assert/strict";
import { resolveCafeAccess } from "../cafe-access";
import { type AsyncTestCase } from "./test-helpers";

export const cafeAccessCases: AsyncTestCase[] = [
  {
    name: "resolveCafeAccess returns demo mode for anonymous user",
    run: () => {
      const access = resolveCafeAccess(null);
      assert.equal(access.mode, "demo");
      assert.equal(access.canInput, false);
      assert.equal(access.showLogin, true);
    },
  },
  {
    name: "resolveCafeAccess returns interactive mode for logged-in user",
    run: () => {
      const access = resolveCafeAccess({ id: "user" });
      assert.equal(access.mode, "interactive");
      assert.equal(access.canInput, true);
      assert.equal(access.showLogin, false);
    },
  },
];
