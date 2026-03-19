import assert from "node:assert/strict";

import { consumeRateLimit } from "./rate-limit";

const first = consumeRateLimit({
  bucket: "test-bucket",
  key: "127.0.0.1",
  limit: 2,
  windowMs: 1000,
  nowMs: 1_000,
});
const second = consumeRateLimit({
  bucket: "test-bucket",
  key: "127.0.0.1",
  limit: 2,
  windowMs: 1000,
  nowMs: 1_100,
});
const third = consumeRateLimit({
  bucket: "test-bucket",
  key: "127.0.0.1",
  limit: 2,
  windowMs: 1000,
  nowMs: 1_200,
});

assert.equal(first.allowed, true);
assert.equal(second.allowed, true);
assert.equal(third.allowed, false);
assert.equal(third.remaining, 0);

consumeRateLimit({
  bucket: "reset-bucket",
  key: "127.0.0.1",
  limit: 1,
  windowMs: 1000,
  nowMs: 5_000,
});

const reset = consumeRateLimit({
  bucket: "reset-bucket",
  key: "127.0.0.1",
  limit: 1,
  windowMs: 1000,
  nowMs: 6_100,
});

assert.equal(reset.allowed, true);
assert.equal(reset.remaining, 0);
