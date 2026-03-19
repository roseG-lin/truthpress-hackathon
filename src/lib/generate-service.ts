import { generateEmpathySupplement } from "./empathy";
import { type GenerateRequest, type GenerateResponse } from "./generate-types";
import { runGeneratePipeline } from "./generate-pipeline";
import { type SearchEvidence } from "./types";

type GenerateServiceDeps = {
  memorySummary?: string;
  userBackground?: string;
  generateText?: (options: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    jsonMode?: boolean;
  }) => Promise<string>;
  searchWeb?: (query: string) => Promise<SearchEvidence[]>;
};

function shouldGenerateEmpathy(input: GenerateRequest, deps: GenerateServiceDeps) {
  if (!input.enableEmpathy) {
    return false;
  }

  return Boolean(deps.memorySummary?.trim() || deps.userBackground?.trim());
}

export async function buildGenerateResponse(
  input: GenerateRequest,
  deps: GenerateServiceDeps = {},
): Promise<GenerateResponse> {
  const pipelineResult = await runGeneratePipeline(input, {
    generateText: deps.generateText,
    searchWeb: deps.searchWeb,
  });

  if (!shouldGenerateEmpathy(input, deps)) {
    return pipelineResult;
  }

  const empathyOutput = await generateEmpathySupplement(
    {
      originalContent: pipelineResult.finalContent,
      userFeedback: "Please express this conclusion in a warmer and more personally resonant way.",
      memorySummary: deps.memorySummary,
      userBackground: deps.userBackground,
    },
    {
      generateText: deps.generateText,
    },
  );

  return {
    ...pipelineResult,
    stages: {
      ...pipelineResult.stages,
      agentD: {
        status: "completed",
        output: empathyOutput,
      },
    },
    finalContent: pipelineResult.finalContent,
    empatheticSupplement: empathyOutput || undefined,
  };
}
