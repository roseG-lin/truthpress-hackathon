"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLlmSettings = getLlmSettings;
exports.generateText = generateText;
const openai_1 = __importDefault(require("openai"));
function getLlmSettings() {
    return {
        apiKey: process.env.LLM_API_KEY ||
            process.env.DEEPSEEK_API_KEY ||
            process.env.OPENAI_API_KEY ||
            "",
        baseURL: process.env.LLM_BASE_URL ||
            process.env.DEEPSEEK_BASE_URL ||
            process.env.OPENAI_BASE_URL ||
            "https://api.deepseek.com",
        model: process.env.LLM_MODEL_NAME ||
            process.env.LLM_MODEL ||
            process.env.DEEPSEEK_MODEL ||
            "deepseek-chat",
    };
}
let sharedClient = null;
function getClient() {
    const settings = getLlmSettings();
    if (!settings.apiKey) {
        throw new Error("Missing LLM_API_KEY or DEEPSEEK_API_KEY in the environment.");
    }
    if (!sharedClient) {
        sharedClient = new openai_1.default({
            apiKey: settings.apiKey,
            baseURL: settings.baseURL,
        });
    }
    return sharedClient;
}
async function generateText(options) {
    const settings = getLlmSettings();
    const completion = await getClient().chat.completions.create({
        model: settings.model,
        temperature: options.temperature ?? 0.4,
        messages: [
            { role: "system", content: options.systemPrompt },
            { role: "user", content: options.userPrompt },
        ],
        ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
    });
    return completion.choices[0]?.message?.content || "";
}
