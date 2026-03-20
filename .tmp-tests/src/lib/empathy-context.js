"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildEmpathyExplanation = buildEmpathyExplanation;
function buildEmpathyExplanation(input) {
    const highlights = (input.memoryHighlights || []).filter(Boolean);
    let base;
    if (input.source === "secondme") {
        if (highlights.length > 0) {
            base = "Agent D 参考了你最近同步到 SecondMe 的记忆片段，所以会优先贴近这些经历里的情绪和处境。";
        }
        else if (input.memorySummary?.trim()) {
            base = "Agent D 参考了你的 SecondMe 记忆摘要，因此表达会尽量顺着你长期在意的经历和关注点展开。";
        }
        else {
            base = "Agent D 已尝试按登录用户的记忆上下文组织表达，但当前没有提取到稳定的记忆片段。";
        }
    }
    else {
        base = "Agent D 没有你的 SecondMe 记忆，只能依据你刚填写的一句话背景来调整表达方式。";
    }
    if (input.fallback) {
        return `${base} 本次由于生成异常，系统返回了保底共情措辞。`;
    }
    return base;
}
