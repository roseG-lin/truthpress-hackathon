import { NextResponse } from "next/server";

import { jsonApiError, jsonRateLimitError } from "@/lib/api-error";
import { getSessionId, getSessionUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { consumeRouteRateLimit } from "@/lib/rate-limit-policy";
import { getSecondMeConfig } from "@/lib/secondme-config";

export async function GET(request: Request) {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return jsonApiError({
      status: 401,
      error: "UNAUTHORIZED",
      message: "You must be signed in to view notes.",
    });
  }

  const rateLimit = consumeRouteRateLimit("notesRead", request, { userId: sessionId });
  if (!rateLimit.allowed) {
    return jsonRateLimitError(rateLimit);
  }

  const notes = await prisma.note.findMany({
    where: { userId: sessionId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return jsonApiError({
      status: 401,
      error: "UNAUTHORIZED",
      message: "You must be signed in to create notes.",
    });
  }

  const rateLimit = consumeRouteRateLimit("notesWrite", request, { userId: sessionId });
  if (!rateLimit.allowed) {
    return jsonRateLimitError(rateLimit);
  }

  try {
    const { title, content, tags = [] } = await request.json();

    const note = await prisma.note.create({
      data: {
        userId: sessionId,
        title,
        content,
        tags: JSON.stringify(tags),
      },
    });

    const user = await getSessionUser();

    if (user) {
      try {
        const { apiUrl } = getSecondMeConfig();
        await fetch(`${apiUrl}/note`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, content }),
        });
      } catch (error) {
        console.error("SecondMe note creation failed:", error);
      }
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Note creation error:", error);
    return jsonApiError({
      status: 500,
      error: "NOTE_CREATE_FAILED",
      message: "Failed to create note.",
    });
  }
}
