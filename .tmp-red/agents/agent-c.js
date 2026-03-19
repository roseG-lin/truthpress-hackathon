"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgentC = runAgentC;
const llm_1 = require("../llm");
async function runAgentC(topic, agentAOutput, verification, deps = {}) {
    const generateText = deps.generateText || llm_1.generateText;
    const response = await generateText({
        systemPrompt: "You are Agent C, the Truth Synthesizer. Write the final structured answer using only the verified or uncertainty-labeled material already provided.",
        userPrompt: `Topic: ${topic}\nAgent A output: ${agentAOutput}\nVerification: ${JSON.stringify(verification)}`,
        temperature: 0.3,
    });
    return response.trim() || `围绕“${topic}”的结论需要基于已核查的证据谨慎表达。`;
}
