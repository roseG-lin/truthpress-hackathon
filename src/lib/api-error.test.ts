import assert from "node:assert/strict";

import { createApiErrorPayload, createRateLimitErrorDetails } from "./api-error";

const basic = createApiErrorPayload({
  error: "INVALID_JSON",
  message: "Request body must be valid JSON.",
});

assert.deepEqual(basic, {
  error: "INVALID_JSON",
  message: "Request body must be valid JSON.",
});

const withDetails = createApiErrorPayload({
  error: "RATE_LIMITED",
  message: "Too many requests.",
  details: createRateLimitErrorDetails({
    retryAfterSeconds: 30,
    resetAt: 10_000,
  }),
});

assert.equal(withDetails.error, "RATE_LIMITED");
assert.equal(withDetails.message, "Too many requests.");
assert.deepEqual(withDetails.details, {
  retryAfterSeconds: 30,
  resetAt: new Date(10_000).toISOString(),
});
