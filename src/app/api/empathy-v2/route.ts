import { NextResponse } from "next/server";

import { jsonApiError, jsonRateLimitError } from "@/lib/api-error";
import { getSessionId } from "@/lib/auth-session";
import { recordEmpathyHistory } from "@/lib/content-history";
import { buildEmpathyExplanation } from "@/lib/empathy-context";
import { generateEmpathySupplement, resolveEmpathyContext } from "@/lib/empathy";
import { consumeRouteRateLimit } from "@/lib/rate-limit-policy";
import { getUserMemoryContextByIdentifier } from "@/lib/user-memory";

type EmpathyRequest = {
  originalContent?: string;
  userFeedback?: string;
  userBackground?: string;
};

function buildFallbackSupplement(originalContent: string): string {
  return `我理解你对这段结论的感受。为了不误导你，我先保留原有事实结论：${originalContent}。如果你愿意，可以再补充一点背景，我会尽量用更有温度的方式解释。`;
}

export async function POST(request: Request) {
  const rateLimit = consumeRouteRateLimit("empathy", request);

  if (!rateLimit.allowed) {
    return jsonRateLimitError(rateLimit);
  }

  let payload: EmpathyRequest;
  try {
    payload = (await request.json()) as EmpathyRequest;
  } catch {
    return jsonApiError({
      status: 400,
      error: "INVALID_JSON",
      message: "Request body must be valid JSON.",
    });
  }

  const originalContent = payload.originalContent?.trim() || "";
  const userFeedback = payload.userFeedback?.trim() || "";
  const userBackground = payload.userBackground?.trim() || "";

  if (!originalContent || !userFeedback) {
    return jsonApiError({
      status: 400,
      error: "MISSING_FIELDS",
      message: "Both originalContent and userFeedback are required.",
    });
  }

  const sessionId = await getSessionId();
  const memoryContext = sessionId ? await getUserMemoryContextByIdentifier(sessionId) : null;
  const memorySummary = memoryContext?.profile.memorySummary;
  const memoryHighlights = memoryContext?.profile.memoryHighlights || [];

  const context = resolveEmpathyContext({
    isAnonymous: !sessionId,
    memorySummary,
    userBackground,
  });

  if (!context.ok) {
    return jsonApiError({
      status: 400,
      error: context.error,
      message: "Anonymous empathy requests require additional user background.",
    });
  }

  const source = sessionId ? "secondme" : "anonymous";

  try {
    const empatheticSupplement = await generateEmpathySupplement({
      originalContent,
      userFeedback,
      memorySummary: context.memorySummary,
      userBackground: context.userBackground,
    });

    recordEmpathyHistory({
      sessionId,
      originalContent,
      finalContent: empatheticSupplement,
      userFeedback,
      source,
      stageSnapshot: {
        fallback: false,
        source,
        contextUsed: {
          source,
          explanation: buildEmpathyExplanation({
            source,
            memorySummary: context.memorySummary,
            memoryHighlights,
            userBackground: context.userBackground,
          }),
          memorySummary: context.memorySummary,
          memoryHighlights,
          userBackground: context.userBackground,
        },
      },
    }).catch((error) => {
      console.error("Empathy history persistence failed:", error);
    });

    // 如果是登录用户，异步触发记忆同步
    if (sessionId) {
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

    return NextResponse.json({
      empatheticSupplement,
      source,
      contextUsed: {
        source,
        explanation: buildEmpathyExplanation({
          source,
          memorySummary: context.memorySummary,
          memoryHighlights,
          userBackground: context.userBackground,
        }),
        memorySummary: context.memorySummary,
        memoryHighlights,
        userBackground: context.userBackground,
      },
    });
  } catch (error) {
    console.error("Empathy generation failed:", error);
    const fallbackSupplement = buildFallbackSupplement(originalContent);

    recordEmpathyHistory({
      sessionId,
      originalContent,
      finalContent: fallbackSupplement,
      userFeedback,
      source,
      fallback: true,
      stageSnapshot: {
        fallback: true,
        source,
        contextUsed: {
          source,
          explanation: buildEmpathyExplanation({
            source,
            memorySummary: context.memorySummary,
            memoryHighlights,
            userBackground: context.userBackground,
            fallback: true,
          }),
          memorySummary: context.memorySummary,
          memoryHighlights,
          userBackground: context.userBackground,
          fallback: true,
        },
      },
    }).catch((persistenceError) => {
      console.error("Fallback empathy history persistence failed:", persistenceError);
    });

    return NextResponse.json({
      empatheticSupplement: fallbackSupplement,
      source,
      fallback: true,
      contextUsed: {
        source,
        explanation: buildEmpathyExplanation({
          source,
          memorySummary: context.memorySummary,
          memoryHighlights,
          userBackground: context.userBackground,
          fallback: true,
        }),
        memorySummary: context.memorySummary,
        memoryHighlights,
        userBackground: context.userBackground,
        fallback: true,
      },
    });
  }
}
