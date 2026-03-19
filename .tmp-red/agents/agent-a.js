"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgentA = runAgentA;
const llm_1 = require("../llm");
function parseAgentAResult(raw, topic) {
    try {
        const parsed = JSON.parse(raw);
        const claims = Array.isArray(parsed.claims)
            ? parsed.claims.map((claim) => String(claim).trim()).filter(Boolean)
            : [];
        const output = typeof parsed.output === "string" ? parsed.output.trim() : "";
        if (output && claims.length > 0) {
            return { output, claims };
        }
    }
    catch { }
    return {
        output: `围绕“${topic}”可以先从效率、可及性、风险边界等角度展开分析。`,
        claims: [`${topic} 可能提升效率`, `${topic} 也可能带来新的边界风险`],
    };
}
async function runAgentA(topic, deps = {}) {
    const generateText = deps.generateText || llm_1.generateText;
    const response = await generateText({
        systemPrompt: "You are Agent A, the Dream Builder. Expand the topic into multiple candidate claims. Return JSON only with output and claims.",
        userPrompt: `Topic: ${topic}\nReturn JSON: {"output":"...","claims":["..."]}`,
        temperature: 0.7,
        jsonMode: true,
    });
    return parseAgentAResult(response, topic);
}
