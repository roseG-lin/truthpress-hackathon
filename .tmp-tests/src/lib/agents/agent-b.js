"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgentB = runAgentB;
const llm_1 = require("../llm");
const search_1 = require("../search");
function normalizeResult(value) {
    if (value === "verified" || value === "debunked" || value === "uncertain") {
        return value;
    }
    return "uncertain";
}
// 清理搜索结果，移除可能触发内容审查的内容
function sanitizeEvidence(evidence) {
    return evidence.map((item) => ({
        ...item,
        // 只保留标题和摘要的摘要，移除完整内容
        snippet: item.snippet.slice(0, 200),
    }));
}
function buildEvidenceSummary(claim, evidence, rawEvidence) {
    const evidenceLine = evidence
        .slice(0, 2)
        .map((item) => `${item.title}: ${item.snippet}`)
        .join(" | ");
    return rawEvidence?.trim() || evidenceLine || `未找到针对"${claim}"的公开证据。`;
}
// 当 API 调用失败时的备用判断逻辑
function fallbackJudgment(claim, evidenceCount) {
    // 如果没有搜索结果，返回 uncertain
    if (evidenceCount === 0) {
        return "uncertain";
    }
    // 有搜索结果但无法验证，倾向于 uncertain
    return "uncertain";
}
async function runAgentB(claims, deps = {}) {
    const generateText = deps.generateText || llm_1.generateText;
    const searchWeb = deps.searchWeb || search_1.searchWeb;
    const verification = [];
    for (const claim of claims) {
        const evidence = await searchWeb(claim);
        const sanitizedEvidence = sanitizeEvidence(evidence);
        // 简化 prompt，减少触发内容审查的可能性
        let raw;
        try {
            raw = await generateText({
                systemPrompt: "你是公正的事实核查员。基于搜索证据判断观点是否可信。\n" +
                    "返回 JSON：{\"result\":\"verified/debunked/uncertain\",\"evidence\":\"简短中文说明\"}。\n" +
                    "注意：verified=有证据支持，debunked=证据反驳，uncertain=证据不足。",
                userPrompt: `观点：${claim}\n搜索结果：${JSON.stringify(sanitizedEvidence).slice(0, 1000)}`,
                temperature: 0.1,
                jsonMode: true,
            });
        }
        catch (error) {
            // API 调用失败（如内容审查），使用备用判断
            console.warn("Agent B API call failed, using fallback:", error);
            raw = JSON.stringify({
                result: fallbackJudgment(claim, evidence.length),
                evidence: buildEvidenceSummary(claim, sanitizedEvidence),
            });
        }
        let parsed = {};
        try {
            parsed = JSON.parse(raw);
        }
        catch { }
        verification.push({
            claim,
            result: normalizeResult(parsed.result),
            evidence: buildEvidenceSummary(claim, sanitizedEvidence, parsed.evidence),
        });
    }
    return verification;
}
