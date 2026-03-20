"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiErrorPayload = createApiErrorPayload;
exports.createRateLimitErrorDetails = createRateLimitErrorDetails;
exports.jsonApiError = jsonApiError;
exports.jsonRateLimitError = jsonRateLimitError;
const server_1 = require("next/server");
const rate_limit_1 = require("./rate-limit");
function createApiErrorPayload(input) {
    return {
        error: input.error,
        message: input.message,
        ...(input.details ? { details: input.details } : {}),
    };
}
function createRateLimitErrorDetails(input) {
    return {
        retryAfterSeconds: input.retryAfterSeconds,
        resetAt: new Date(input.resetAt).toISOString(),
    };
}
function jsonApiError(input) {
    return server_1.NextResponse.json(createApiErrorPayload(input), {
        status: input.status,
        headers: input.headers,
    });
}
function jsonRateLimitError(decision) {
    return jsonApiError({
        status: 429,
        error: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
        details: createRateLimitErrorDetails({
            retryAfterSeconds: decision.retryAfterSeconds,
            resetAt: decision.resetAt,
        }),
        headers: (0, rate_limit_1.createRateLimitHeaders)(decision),
    });
}
