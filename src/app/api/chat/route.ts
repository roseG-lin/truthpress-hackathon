import { NextResponse } from "next/server";

import { jsonApiError, jsonRateLimitError } from "@/lib/api-error";
import { getSessionId, getSessionUser } from "@/lib/auth-session";
import { normalizeChatMessage } from "@/lib/chat-request";
import { prisma } from "@/lib/prisma";
import { consumeRouteRateLimit } from "@/lib/rate-limit-policy";
import { getSecondMeConfig } from "@/lib/secondme-config";

export async function POST(request: Request) {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return jsonApiError({
      status: 401,
      error: "UNAUTHORIZED",
      message: "You must be signed in to use chat.",
    });
  }

  const user = await getSessionUser();
  if (!user) {
    return jsonApiError({
      status: 401,
      error: "USER_NOT_FOUND",
      message: "The authenticated user could not be resolved.",
    });
  }

  const rateLimit = consumeRouteRateLimit("chat", request, { userId: user.id });

  if (!rateLimit.allowed) {
    return jsonRateLimitError(rateLimit);
  }

  let payload: { message?: unknown };
  try {
    payload = (await request.json()) as { message?: unknown };
  } catch {
    return jsonApiError({
      status: 400,
      error: "INVALID_JSON",
      message: "Request body must be valid JSON.",
    });
  }

  const normalizedMessage = normalizeChatMessage(payload);
  if (!normalizedMessage.ok) {
    return jsonApiError({
      status: normalizedMessage.status,
      error: normalizedMessage.error,
      message:
        normalizedMessage.error === "INVALID_MESSAGE"
          ? "message must be a string."
          : normalizedMessage.error === "EMPTY_MESSAGE"
            ? "message cannot be empty."
            : "message is too long.",
    });
  }

  const { apiUrl } = getSecondMeConfig();
  const message = normalizedMessage.value;

  try {
    await prisma.chat.create({
      data: {
        userId: user.id,
        role: "user",
        content: message,
      },
    });

    const response = await fetch(`${apiUrl}/chat`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("SecondMe chat request failed");
    }

    const result = await response.json();
    const data = result.code === 0 ? result.data : result;
    const content = data.content || data.message || data.reply || "Reply received";

    await prisma.chat.create({
      data: {
        userId: user.id,
        role: "assistant",
        content,
      },
    });

    return NextResponse.json({ content });
  } catch (caughtError) {
    console.error("Chat error:", caughtError);
    return jsonApiError({
      status: 500,
      error: "CHAT_FAILED",
      message: "The chat service is temporarily unavailable.",
      details: {
        content: "The chat service is temporarily unavailable.",
      },
    });
  }
}

export async function GET() {
  const sessionId = await getSessionId();
  if (!sessionId) {
    return jsonApiError({
      status: 401,
      error: "UNAUTHORIZED",
      message: "You must be signed in to view chats.",
    });
  }

  const chats = await prisma.chat.findMany({
    where: { userId: sessionId },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return NextResponse.json({ chats });
}
