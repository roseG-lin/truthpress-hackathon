"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consumeRateLimit = consumeRateLimit;
exports.getClientIdentifier = getClientIdentifier;
exports.createRateLimitHeaders = createRateLimitHeaders;
exports.createRateLimitResponse = createRateLimitResponse;
const rateLimitStores = new Map();
function getStore(bucket) {
    let store = rateLimitStores.get(bucket);
    if (!store) {
        store = new Map();
        rateLimitStores.set(bucket, store);
    }
    return store;
}
function pruneExpiredEntries(store, nowMs) {
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt <= nowMs) {
            store.delete(key);
        }
    }
}
function consumeRateLimit(input) {
    const nowMs = input.nowMs ?? Date.now();
    const store = getStore(input.bucket);
    pruneExpiredEntries(store, nowMs);
    const existing = store.get(input.key);
    if (!existing) {
        const resetAt = nowMs + input.windowMs;
        store.set(input.key, { count: 1, resetAt });
        return {
            allowed: true,
            limit: input.limit,
            remaining: Math.max(input.limit - 1, 0),
            resetAt,
            retryAfterSeconds: Math.ceil(input.windowMs / 1000),
        };
    }
    if (existing.count >= input.limit) {
        const retryAfterMs = Math.max(existing.resetAt - nowMs, 0);
        return {
            allowed: false,
            limit: input.limit,
            remaining: 0,
            resetAt: existing.resetAt,
            retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
        };
    }
    existing.count += 1;
    return {
        allowed: true,
        limit: input.limit,
        remaining: Math.max(input.limit - existing.count, 0),
        resetAt: existing.resetAt,
        retryAfterSeconds: Math.ceil(Math.max(existing.resetAt - nowMs, 0) / 1000),
    };
}
function getClientIdentifier(request) {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const cfConnectingIp = request.headers.get("cf-connecting-ip");
    return (forwardedFor?.split(",")[0]?.trim() ||
        realIp?.trim() ||
        cfConnectingIp?.trim() ||
        "anonymous");
}
function createRateLimitHeaders(decision) {
    return {
        "X-RateLimit-Limit": String(decision.limit),
        "X-RateLimit-Remaining": String(decision.remaining),
        "X-RateLimit-Reset": new Date(decision.resetAt).toISOString(),
        "Retry-After": String(decision.retryAfterSeconds),
    };
}
function createRateLimitResponse(decision) {
    return new Response(JSON.stringify({
        error: "RATE_LIMITED",
        retryAfterSeconds: decision.retryAfterSeconds,
        resetAt: new Date(decision.resetAt).toISOString(),
    }), {
        status: 429,
        headers: {
            "Content-Type": "application/json",
            ...createRateLimitHeaders(decision),
        },
    });
}
