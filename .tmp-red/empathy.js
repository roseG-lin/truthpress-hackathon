"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveEmpathyContext = resolveEmpathyContext;
exports.buildEmpathyPrompt = buildEmpathyPrompt;
exports.generateEmpathySupplement = generateEmpathySupplement;
function resolveEmpathyContext(input) {
    const memorySummary = input.memorySummary?.trim() || "";
    const userBackground = input.userBackground?.trim() || "";
    if (input.isAnonymous && !userBackground) {
        return { ok: false, error: "BACKGROUND_REQUIRED" };
    }
    return {
        ok: true,
        memorySummary: memorySummary || undefined,
        userBackground: userBackground || undefined,
    };
}
function buildEmpathyPrompt(input) {
    const memoryLine = input.memorySummary ? `User memory: ${input.memorySummary}` : "";
    const backgroundLine = input.userBackground ? `User background: ${input.userBackground}` : "";
    return {
        systemPrompt: "You are Agent D, an empathy bridge. do not introduce new facts. Only rephrase the verified content to feel understood.",
        userPrompt: [
            `Verified content: ${input.originalContent}`,
            `User feedback: ${input.userFeedback}`,
            memoryLine,
            backgroundLine,
            "Write a warm, concise supplement (80-150 Chinese characters).",
        ]
            .filter(Boolean)
            .join("\n"),
    };
}
async function generateEmpathySupplement(input, deps = {}) {
    if (!input.originalContent?.trim()) {
        throw new Error("originalContent is required");
    }
    if (!input.userFeedback?.trim()) {
        throw new Error("userFeedback is required");
    }
    const prompt = buildEmpathyPrompt(input);
    if (!deps.generateText) {
        const { generateText: defaultGenerateText } = await Promise.resolve().then(() => __importStar(require("./llm")));
        const result = await defaultGenerateText({
            systemPrompt: prompt.systemPrompt,
            userPrompt: prompt.userPrompt,
            temperature: 0.5,
        });
        return result.trim();
    }
    const result = await deps.generateText({
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        temperature: 0.5,
    });
    return result.trim();
}
