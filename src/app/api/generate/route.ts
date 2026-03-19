import { NextResponse } from "next/server";

import { jsonApiError, jsonRateLimitError } from "@/lib/api-error";
import { getSessionUser } from "@/lib/auth-session";
import { recordGenerateHistory } from "@/lib/content-history";
import { normalizeGenerateRequest } from "@/lib/generate-request";
import { buildGenerateResponse } from "@/lib/generate-service";
import { consumeRouteRateLimit } from "@/lib/rate-limit-policy";
import { type GenerateRequest } from "@/lib/types";
import { getUserMemoryContextByIdentifier } from "@/lib/user-memory";

async function resolveMemorySummary(userId: string) {
  const context = await getUserMemoryContextByIdentifier(userId);
  return context?.profile.memorySummary || "";
}

export async function POST(request: Request) {
  const rateLimit = consumeRouteRateLimit("generate", request);

  if (!rateLimit.allowed) {
    return jsonRateLimitError(rateLimit);
  }

  let payload: Partial<GenerateRequest>;

  try {
    payload = (await request.json()) as Partial<GenerateRequest>;
  } catch {
    return jsonApiError({
      status: 400,
      error: "INVALID_JSON",
      message: "Request body must be valid JSON.",
    });
  }

  const sessionUser = await getSessionUser();
  const normalized = normalizeGenerateRequest({
    topic: payload.topic,
    requestedUserId: payload.userId,
    enableEmpathy: payload.enableEmpathy,
    sessionUser: sessionUser
      ? {
          id: sessionUser.id,
          secondMeId: sessionUser.secondMeId,
        }
      : null,
  });

  if (!normalized.ok) {
    return jsonApiError({
      status: normalized.status,
      error: normalized.error,
      message:
        normalized.error === "AUTH_REQUIRED_FOR_EMPATHY"
          ? "Authentication is required when empathy mode is enabled."
          : "Required request fields are missing.",
    });
  }

  const { topic, userId, enableEmpathy, sessionUserId } = normalized.value;
  const memorySummary =
    enableEmpathy && sessionUserId ? await resolveMemorySummary(sessionUserId) : undefined;

  try {
    const response = await buildGenerateResponse(
      {
        topic,
        userId,
        enableEmpathy,
      },
      {
        memorySummary,
      },
    );

    // 记录历史
    recordGenerateHistory({
      sessionId: sessionUserId,
      topic,
      response,
    }).catch((error) => {
      console.error("Generate history persistence failed:", error);
    });

    // 如果是登录用户，异步触发记忆同步
    if (sessionUserId) {
      // 不等待同步完成，避免阻塞响应
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/memory/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": request.headers.get("Cookie") || "",
        },
      }).catch((error) => {
        console.error("Memory sync trigger failed:", error);
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Generate route failed:", error);
    return jsonApiError({
      status: 500,
      error: "GENERATE_FAILED",
      message: "Failed to generate a response.",
    });
  }
}
