import { generateText as defaultGenerateText } from "../llm";

type AgentADeps = {
  generateText?: (options: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    jsonMode?: boolean;
  }) => Promise<string>;
};

export type AgentAResult = {
  output: string;
  claims: string[];
};

function parseAgentAResult(raw: string, topic: string): AgentAResult {
  try {
    const parsed = JSON.parse(raw) as Partial<AgentAResult>;
    const claims = Array.isArray(parsed.claims)
      ? parsed.claims.map((claim) => String(claim).trim()).filter(Boolean)
      : [];
    const output = typeof parsed.output === "string" ? parsed.output.trim() : "";

    if (output && claims.length > 0) {
      return { output, claims };
    }
  } catch {}

  return {
    output: `围绕“${topic}”可以先从效率、可及性、风险边界等角度展开分析。`,
    claims: [`${topic} 可能提升效率`, `${topic} 也可能带来新的边界风险`],
  };
}

export async function runAgentA(topic: string, deps: AgentADeps = {}): Promise<AgentAResult> {
  const generateText = deps.generateText || defaultGenerateText;
  const response = await generateText({
    systemPrompt:
      "你是 Agent A，发散思考者。请将主题展开为多个待核查的观点。你必须使用中文回复。返回 JSON 格式，包含 output（分析内容）和 claims（待核查观点列表）。",
    userPrompt: `Topic: ${topic}\nReturn JSON: {"output":"...","claims":["..."]}`,
    temperature: 0.7,
    jsonMode: true,
  });

  return parseAgentAResult(response, topic);
}
