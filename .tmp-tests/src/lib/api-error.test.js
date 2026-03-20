"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const api_error_1 = require("./api-error");
const basic = (0, api_error_1.createApiErrorPayload)({
    error: "INVALID_JSON",
    message: "Request body must be valid JSON.",
});
strict_1.default.deepEqual(basic, {
    error: "INVALID_JSON",
    message: "Request body must be valid JSON.",
});
const withDetails = (0, api_error_1.createApiErrorPayload)({
    error: "RATE_LIMITED",
    message: "Too many requests.",
    details: (0, api_error_1.createRateLimitErrorDetails)({
        retryAfterSeconds: 30,
        resetAt: 10000,
    }),
});
strict_1.default.equal(withDetails.error, "RATE_LIMITED");
strict_1.default.equal(withDetails.message, "Too many requests.");
strict_1.default.deepEqual(withDetails.details, {
    retryAfterSeconds: 30,
    resetAt: new Date(10000).toISOString(),
});
