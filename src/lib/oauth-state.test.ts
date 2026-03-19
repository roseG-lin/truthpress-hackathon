import assert from "node:assert/strict";

import {
  OAUTH_STATE_MAX_AGE_SECONDS,
  createOAuthStateCookieValue,
  validateOAuthStateCookieValue,
} from "./oauth-state";

const freshCookieValue = createOAuthStateCookieValue("state-123", 999_000);
const freshState = validateOAuthStateCookieValue({
  expectedState: "state-123",
  cookieValue: freshCookieValue,
  nowMs: 1_000_000,
});

assert.equal(freshState.ok, true);

const expiredCookieValue = createOAuthStateCookieValue(
  "state-123",
  2_000_000 - (OAUTH_STATE_MAX_AGE_SECONDS * 1000 + 1),
);
const expiredState = validateOAuthStateCookieValue({
  expectedState: "state-123",
  cookieValue: expiredCookieValue,
  nowMs: 2_000_000,
});

assert.equal(expiredState.ok, false);
if (expiredState.ok) {
  throw new Error("expected expired state to be rejected");
}

assert.equal(expiredState.error, "STATE_EXPIRED");
assert.equal(expiredState.status, 400);
