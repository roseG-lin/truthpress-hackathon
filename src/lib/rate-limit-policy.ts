import { consumeRateLimit, getClientIdentifier } from "./rate-limit";

export const RATE_LIMIT_POLICIES = {
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
} as const;

export type RateLimitPolicyName = keyof typeof RATE_LIMIT_POLICIES;
export type RateLimitPolicy = (typeof RATE_LIMIT_POLICIES)[RateLimitPolicyName];

export function resolveRateLimitKey(
  policy: RateLimitPolicy,
  request: Request,
  userId?: string | null,
) {
  if (policy.scope === "user" && userId?.trim()) {
    return userId.trim();
  }

  return getClientIdentifier(request);
}

export function consumeRouteRateLimit(
  policyName: RateLimitPolicyName,
  request: Request,
  options?: {
    userId?: string | null;
    nowMs?: number;
  },
) {
  const policy = RATE_LIMIT_POLICIES[policyName];

  return consumeRateLimit({
    bucket: policy.bucket,
    key: resolveRateLimitKey(policy, request, options?.userId),
    limit: policy.limit,
    windowMs: policy.windowMs,
    nowMs: options?.nowMs,
  });
}
