import { type VerificationItem } from "../generate-types";
import { generateText as defaultGenerateText } from "../llm";
import { searchWeb as defaultSearchWeb } from "../search";
import { type SearchEvidence } from "../types";

type AgentBDeps = {
  generateText?: (options: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    jsonMode?: boolean;
  }) => Promise<string>;
  searchWeb?: (query: string) => Promise<SearchEvidence[]>;
};

type RawVerdict = {
  result?: VerificationItem["result"];
  evidence?: string;
};

function normalizeResult(value?: string): VerificationItem["result"] {
  if (value === "verified" || value === "debunked" || value === "uncertain") {
    return value;
  }

  return "uncertain";
}

// 清理搜索结果，移除可能触发内容审查的内容
function sanitizeEvidence(evidence: SearchEvidence[]): SearchEvidence[] {
  return evidence.map((item) => ({
    ...item,
    // 只保留标题和摘要的摘要，移除完整内容
    snippet: item.snippet.slice(0, 200),
  }));
}

function buildEvidenceSummary(claim: string, evidence: SearchEvidence[], rawEvidence?: string): string {
  const evidenceLine = evidence
    .slice(0, 2)
    .map((item) => `${item.title}: ${item.snippet}`)
    .join(" | ");

  return rawEvidence?.trim() || evidenceLine || `未找到针对"${claim}"的公开证据。`;
}

// 当 API 调用失败时的备用判断逻辑
function fallbackJudgment(claim: string, evidenceCount: number): VerificationItem["result"] {
  // 如果没有搜索结果，返回 uncertain
  if (evidenceCount === 0) {
    return "uncertain";
  }
  // 有搜索结果但无法验证，倾向于 uncertain
  return "uncertain";
}

export async function runAgentB(claims: string[], deps: AgentBDeps = {}): Promise<VerificationItem[]> {
  const generateText = deps.generateText || defaultGenerateText;
  const searchWeb = deps.searchWeb || defaultSearchWeb;

  const verification: VerificationItem[] = [];

  for (const claim of claims) {
    const evidence = await searchWeb(claim);
    const sanitizedEvidence = sanitizeEvidence(evidence);

    // 简化 prompt，减少触发内容审查的可能性
    let raw: string;
    try {
      raw = await generateText({
        systemPrompt:
          "你是公正的事实核查员。基于搜索证据判断观点是否可信。\n" +
          "返回 JSON：{\"result\":\"verified/debunked/uncertain\",\"evidence\":\"简短中文说明\"}。\n" +
          "注意：verified=有证据支持，debunked=证据反驳，uncertain=证据不足。",
        userPrompt: `观点：${claim}\n搜索结果：${JSON.stringify(sanitizedEvidence).slice(0, 1000)}`,
        temperature: 0.1,
        jsonMode: true,
      });
    } catch (error) {
      // API 调用失败（如内容审查），使用备用判断
      console.warn("Agent B API call failed, using fallback:", error);
      raw = JSON.stringify({
        result: fallbackJudgment(claim, evidence.length),
        evidence: buildEvidenceSummary(claim, sanitizedEvidence),
      });
    }

    let parsed: RawVerdict = {};
    try {
      parsed = JSON.parse(raw) as RawVerdict;
    } catch {}

    verification.push({
      claim,
      result: normalizeResult(parsed.result),
      evidence: buildEvidenceSummary(claim, sanitizedEvidence, parsed.evidence),
    });
  }

  return verification;
}
