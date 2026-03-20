"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const rate_limit_1 = require("./rate-limit");
const first = (0, rate_limit_1.consumeRateLimit)({
    bucket: "test-bucket",
    key: "127.0.0.1",
    limit: 2,
    windowMs: 1000,
    nowMs: 1000,
});
const second = (0, rate_limit_1.consumeRateLimit)({
    bucket: "test-bucket",
    key: "127.0.0.1",
    limit: 2,
    windowMs: 1000,
    nowMs: 1100,
});
const third = (0, rate_limit_1.consumeRateLimit)({
    bucket: "test-bucket",
    key: "127.0.0.1",
    limit: 2,
    windowMs: 1000,
    nowMs: 1200,
});
strict_1.default.equal(first.allowed, true);
strict_1.default.equal(second.allowed, true);
strict_1.default.equal(third.allowed, false);
strict_1.default.equal(third.remaining, 0);
(0, rate_limit_1.consumeRateLimit)({
    bucket: "reset-bucket",
    key: "127.0.0.1",
    limit: 1,
    windowMs: 1000,
    nowMs: 5000,
});
const reset = (0, rate_limit_1.consumeRateLimit)({
    bucket: "reset-bucket",
    key: "127.0.0.1",
    limit: 1,
    windowMs: 1000,
    nowMs: 6100,
});
strict_1.default.equal(reset.allowed, true);
strict_1.default.equal(reset.remaining, 0);
