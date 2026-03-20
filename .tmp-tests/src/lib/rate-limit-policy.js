"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_POLICIES = void 0;
exports.resolveRateLimitKey = resolveRateLimitKey;
exports.consumeRouteRateLimit = consumeRouteRateLimit;
const rate_limit_1 = require("./rate-limit");
exports.RATE_LIMIT_POLICIES = {
    authLogin: {
        bucket: "auth-login",
        scope: "client",
        limit: 10,
        windowMs: 10 * 60 * 1000,
    },
    generate: {
        bucket: "generate-post",
        scope: "client",
        limit: 20,
        windowMs: 5 * 60 * 1000,
    },
    empathy: {
        bucket: "empathy-post",
        scope: "client",
        limit: 12,
        windowMs: 5 * 60 * 1000,
    },
    chat: {
        bucket: "chat-post",
        scope: "user",
        limit: 30,
        windowMs: 5 * 60 * 1000,
    },
    profileRefresh: {
        bucket: "profile-refresh",
        scope: "user",
        limit: 12,
        windowMs: 5 * 60 * 1000,
    },
    notesRead: {
        bucket: "notes-read",
        scope: "user",
        limit: 60,
        windowMs: 5 * 60 * 1000,
    },
    notesWrite: {
        bucket: "notes-write",
        scope: "user",
        limit: 20,
        windowMs: 5 * 60 * 1000,
    },
    memoriesRead: {
        bucket: "memories-read",
        scope: "user",
        limit: 30,
        windowMs: 5 * 60 * 1000,
    },
};
function resolveRateLimitKey(policy, request, userId) {
    if (policy.scope === "user" && userId?.trim()) {
        return userId.trim();
    }
    return (0, rate_limit_1.getClientIdentifier)(request);
}
function consumeRouteRateLimit(policyName, request, options) {
    const policy = exports.RATE_LIMIT_POLICIES[policyName];
    return (0, rate_limit_1.consumeRateLimit)({
        bucket: policy.bucket,
        key: resolveRateLimitKey(policy, request, options?.userId),
        limit: policy.limit,
        windowMs: policy.windowMs,
        nowMs: options?.nowMs,
    });
}
