import { NextResponse } from "next/server";

import { createRateLimitHeaders, type RateLimitDecision } from "./rate-limit";

type ApiErrorPayloadInput = {
  error: string;
  message: string;
  details?: Record<string, unknown>;
};

type ApiErrorResponseInput = ApiErrorPayloadInput & {
  status: number;
  headers?: HeadersInit;
};

export function createApiErrorPayload(input: ApiErrorPayloadInput) {
  return {
    error: input.error,
    message: input.message,
    ...(input.details ? { details: input.details } : {}),
  };
}

export function createRateLimitErrorDetails(input: {
  retryAfterSeconds: number;
  resetAt: number;
}) {
  return {
    retryAfterSeconds: input.retryAfterSeconds,
    resetAt: new Date(input.resetAt).toISOString(),
  };
}

export function jsonApiError(input: ApiErrorResponseInput) {
  return NextResponse.json(createApiErrorPayload(input), {
    status: input.status,
    headers: input.headers,
  });
}

export function jsonRateLimitError(decision: RateLimitDecision) {
  return jsonApiError({
    status: 429,
    error: "RATE_LIMITED",
    message: "Too many requests. Please try again later.",
    details: createRateLimitErrorDetails({
      retryAfterSeconds: decision.retryAfterSeconds,
      resetAt: decision.resetAt,
    }),
    headers: createRateLimitHeaders(decision),
  });
}
