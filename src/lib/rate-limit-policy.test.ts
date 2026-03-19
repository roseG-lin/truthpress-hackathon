import assert from "node:assert/strict";

import {
  RATE_LIMIT_POLICIES,
  consumeRouteRateLimit,
  resolveRateLimitKey,
} from "./rate-limit-policy";

assert.equal(RATE_LIMIT_POLICIES.authLogin.scope, "client");
assert.equal(RATE_LIMIT_POLICIES.chat.scope, "user");

const request = new Request("https://truthpress.local/api/chat", {
  headers: {
    "x-forwarded-for": "203.0.113.10, 10.0.0.1",
  },
});

assert.equal(resolveRateLimitKey(RATE_LIMIT_POLICIES.authLogin, request), "203.0.113.10");
assert.equal(resolveRateLimitKey(RATE_LIMIT_POLICIES.chat, request, "user-123"), "user-123");

const first = consumeRouteRateLimit("authLogin", request, { nowMs: 1_000 });
const second = consumeRouteRateLimit("authLogin", request, { nowMs: 1_100 });

assert.equal(first.allowed, true);
assert.equal(second.allowed, true);
