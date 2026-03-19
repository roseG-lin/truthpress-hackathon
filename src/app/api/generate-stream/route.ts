import { NextRequest } from "next/server";

import { jsonApiError, jsonRateLimitError } from "@/lib/api-error";
import { getSessionUser } from "@/lib/auth-session";
import { recordGenerateHistory } from "@/lib/content-history";
import { normalizeGenerateRequest } from "@/lib/generate-request";
import { runAgentA } from "@/lib/agents/agent-a";
import { runAgentB } from "@/lib/agents/agent-b";
import { runAgentC } from "@/lib/agents/agent-c";
import { consumeRouteRateLimit } from "@/lib/rate-limit-policy";
import { type GenerateRequest } from "@/lib/types";
import { getUserMemoryContextByIdentifier } from "@/lib/user-memory";
import { type GenerateResponse } from "@/lib/generate-types";

async function resolveMemorySummary(userId: string) {
  const context = await getUserMemoryContextByIdentifier(userId);
  return context?.profile.memorySummary || "";
}

function sendEvent(
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController,
  event: string,
  data: unknown,
) {
  const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(message));
}

export async function POST(request: NextRequest) {
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
    enableEmpathy: false, // 流式模式暂不支持 empathy
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
      message: "Required request fields are missing.",
    });
  }

  const { topic, userId, sessionUserId } = normalized.value;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 阶段1: Agent A 发散思考
        sendEvent(encoder, controller, "stage", { agent: "A", status: "started" });
        const agentAResult = await runAgentA(topic);
        sendEvent(encoder, controller, "agentA", {
          status: "completed",
          output: agentAResult.output,
          claims: agentAResult.claims,
        });

        // 阶段2: Agent B 联网核查
        sendEvent(encoder, controller, "stage", { agent: "B", status: "started" });
        const agentBResult = await runAgentB(agentAResult.claims);
        sendEvent(encoder, controller, "agentB", {
          status: "completed",
          verification: agentBResult,
        });

        // 阶段3: Agent C 综合结论
        sendEvent(encoder, controller, "stage", { agent: "C", status: "started" });
        const agentCResult = await runAgentC(topic, agentAResult.output, agentBResult);
        sendEvent(encoder, controller, "agentC", {
          status: "completed",
          output: agentCResult,
        });

        // 最终完整响应
        const fullResponse: GenerateResponse = {
          finalContent: agentCResult,
          stages: {
            agentA: {
              status: "completed",
              output: agentAResult.output,
            },
            agentB: {
              status: "completed",
              verification: agentBResult,
            },
            agentC: {
              status: "completed",
              output: agentCResult,
            },
            agentD: {
              status: "idle",
            },
          },
        };

        // 记录历史
        recordGenerateHistory({
          sessionId: sessionUserId,
          topic,
          response: fullResponse,
        }).catch((error) => {
          console.error("Generate history persistence failed:", error);
        });

        sendEvent(encoder, controller, "complete", fullResponse);
        sendEvent(encoder, controller, "done", {});
        controller.close();
      } catch (error) {
        console.error("Stream generate failed:", error);
        sendEvent(
          encoder,
          controller,
          "error",
          error instanceof Error ? error.message : "生成失败",
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
