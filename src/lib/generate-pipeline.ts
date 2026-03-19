import { runAgentA } from "./agents/agent-a";
import { runAgentB } from "./agents/agent-b";
import { runAgentC } from "./agents/agent-c";
import { type GenerateRequest, type GenerateResponse } from "./generate-types";
import { type SearchEvidence } from "./types";

type PipelineDeps = {
  generateText?: (options: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    jsonMode?: boolean;
  }) => Promise<string>;
  searchWeb?: (query: string) => Promise<SearchEvidence[]>;
};

export async function runGeneratePipeline(
  input: GenerateRequest,
  deps: PipelineDeps = {},
): Promise<GenerateResponse> {
  const agentA = await runAgentA(input.topic, {
    generateText: deps.generateText,
  });

  const verification = await runAgentB(agentA.claims, {
    generateText: deps.generateText,
    searchWeb: deps.searchWeb,
  });

  const finalContent = await runAgentC(input.topic, agentA.output, verification, {
    generateText: deps.generateText,
  });

  return {
    stages: {
      agentA: {
        status: "completed",
        output: agentA.output,
      },
      agentB: {
        status: "completed",
        verification,
      },
      agentC: {
        status: "completed",
        output: finalContent,
      },
      agentD: {
        status: "idle",
      },
    },
    finalContent,
  };
}
