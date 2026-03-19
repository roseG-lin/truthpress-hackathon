import { NextResponse } from "next/server";

import { jsonApiError, jsonRateLimitError } from "@/lib/api-error";
import { getSessionId } from "@/lib/auth-session";
import { getMemorySnapshotByUserId } from "@/lib/memory-snapshot";
import { consumeRouteRateLimit } from "@/lib/rate-limit-policy";
import { getUserMemoryContextByIdentifier } from "@/lib/user-memory";

export async function GET(request: Request) {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return jsonApiError({
      status: 401,
      error: "UNAUTHORIZED",
      message: "You must be signed in to view memories.",
    });
  }

  const rateLimit = consumeRouteRateLimit("memoriesRead", request, { userId: sessionId });
  if (!rateLimit.allowed) {
    return jsonRateLimitError(rateLimit);
  }

  const context = await getUserMemoryContextByIdentifier(sessionId);

  if (!context) {
    return jsonApiError({
      status: 404,
      error: "USER_NOT_FOUND",
      message: "No memory context was found for the authenticated user.",
    });
  }

  const snapshot = await getMemorySnapshotByUserId(context.userId);

  return NextResponse.json({
    source: snapshot ? "memory_snapshot" : "profile_fallback",
    memorySummary: context.profile.memorySummary,
    memoryHighlights: context.profile.memoryHighlights,
    softMemory: context.profile.softMemory,
    shades: context.profile.shades,
    secondMeId: context.secondMeId,
    updatedAt: snapshot?.updatedAt ?? null,
  });
}
