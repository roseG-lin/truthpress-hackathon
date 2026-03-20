"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const rate_limit_policy_1 = require("./rate-limit-policy");
strict_1.default.equal(rate_limit_policy_1.RATE_LIMIT_POLICIES.authLogin.scope, "client");
strict_1.default.equal(rate_limit_policy_1.RATE_LIMIT_POLICIES.chat.scope, "user");
const request = new Request("https://truthpress.local/api/chat", {
    headers: {
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    },
});
strict_1.default.equal((0, rate_limit_policy_1.resolveRateLimitKey)(rate_limit_policy_1.RATE_LIMIT_POLICIES.authLogin, request), "203.0.113.10");
strict_1.default.equal((0, rate_limit_policy_1.resolveRateLimitKey)(rate_limit_policy_1.RATE_LIMIT_POLICIES.chat, request, "user-123"), "user-123");
const first = (0, rate_limit_policy_1.consumeRouteRateLimit)("authLogin", request, { nowMs: 1000 });
const second = (0, rate_limit_policy_1.consumeRouteRateLimit)("authLogin", request, { nowMs: 1100 });
strict_1.default.equal(first.allowed, true);
strict_1.default.equal(second.allowed, true);
