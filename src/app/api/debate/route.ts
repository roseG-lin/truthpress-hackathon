import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/api-error";
import { buildGenerateResponse } from "@/lib/generate-service";

type LegacyDebateRequest = {
  view?: string;
};

export async function POST(request: Request) {
  let payload: LegacyDebateRequest;

  try {
    payload = (await request.json()) as LegacyDebateRequest;
  } catch {
    return jsonApiError({
      status: 400,
      error: "INVALID_JSON",
      message: "Request body must be valid JSON.",
    });
  }

  const topic = payload.view?.trim() || "";

  if (!topic) {
    return jsonApiError({
      status: 400,
      error: "MISSING_TOPIC",
      message: "view is required for the legacy debate endpoint.",
    });
  }

  try {
    const generate = await buildGenerateResponse({
      topic,
      userId: "anonymous",
      enableEmpathy: false,
    });

    return NextResponse.json({
      deprecated: true,
      message:
        "This route is kept only as a legacy compatibility layer. The active product path is /api/generate plus /api/empathy-v2.",
      recommendedEndpoint: "/api/generate",
      recommendedEmpathyEndpoint: "/api/empathy-v2",
      messages: [
        {
          role: "assistant",
          agent: "Agent A",
          content: generate.stages.agentA.output,
        },
        {
          role: "assistant",
          agent: "Agent B",
          content:
            generate.stages.agentB.verification
              .map((item) => `${item.claim} -> ${item.result}${item.evidence ? ` (${item.evidence})` : ""}`)
              .join("\n") || "No verifiable claims were produced.",
        },
        {
          role: "assistant",
          agent: "Agent C",
          content: generate.stages.agentC.output,
        },
      ],
      aiPowered: true,
      stages: generate.stages,
      finalContent: generate.finalContent,
    });
  } catch (error) {
    console.error("Legacy debate route failed:", error);
    return NextResponse.json(
      {
        deprecated: true,
        message: "Legacy debate route failed. Use /api/generate instead.",
        recommendedEndpoint: "/api/generate",
        recommendedEmpathyEndpoint: "/api/empathy-v2",
        error: "DEBATE_ROUTE_FAILED",
        messages: [],
      },
      { status: 500 },
    );
  }
}
