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
function buildEvidenceSummary(claim, evidence, rawEvidence) {
    const evidenceLine = evidence
        .slice(0, 2)
        .map((item) => `${item.title}: ${item.snippet}`)
        .join(" | ");
    return rawEvidence?.trim() || evidenceLine || `No public evidence summary was returned for "${claim}".`;
}
async function runAgentB(claims, deps = {}) {
    const generateText = deps.generateText || llm_1.generateText;
    const searchWeb = deps.searchWeb || search_1.searchWeb;
    const verification = [];
    for (const claim of claims) {
        const evidence = await searchWeb(claim);
        const raw = await generateText({
            systemPrompt: "You are Agent B, the Reality Auditor. Judge only the supplied claim. Return JSON only with result and evidence. Allowed result values: verified, debunked, uncertain.",
            userPrompt: `Claim: ${claim}\nEvidence: ${JSON.stringify(evidence)}`,
            temperature: 0.1,
            jsonMode: true,
        });
        let parsed = {};
        try {
            parsed = JSON.parse(raw);
        }
        catch { }
        verification.push({
            claim,
            result: normalizeResult(parsed.result),
            evidence: buildEvidenceSummary(claim, evidence, parsed.evidence),
        });
    }
    return verification;
}
