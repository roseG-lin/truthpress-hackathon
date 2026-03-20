"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAgentC = runAgentC;
const llm_1 = require("../llm");
async function runAgentC(topic, agentAOutput, verification, deps = {}) {
    const generateText = deps.generateText || llm_1.generateText;
    const response = await generateText({
        systemPrompt: "你是 Agent C，真理综合者。你的任务是输出言简意赅、有理有据的结论总结。\n\n" +
            "输出要求：\n" +
            "1. 言简意赅 - 用最少的字传达核心信息，避免冗余\n" +
            "2. 有理有据 - 每个结论都要有核查证据支撑，区分已证实和存疑\n" +
            "3. 结构清晰 - 先给核心结论，再补充关键细节\n" +
            "4. 客观中立 - 承认不确定性，不做过度推断\n\n" +
            "不要简单罗列各点，要综合提炼出洞察。",
        userPrompt: `请对以下主题给出言简意赅、有理有据的结论：\n\n主题：${topic}\n\n发散分析：${agentAOutput}\n\n核查结果：${JSON.stringify(verification, null, 2)}\n\n请直接输出结论（100-200字）：`,
        temperature: 0.3,
    });
    return response.trim() || `围绕“${topic}”的结论需要基于已核查的证据谨慎表达。`;
}
