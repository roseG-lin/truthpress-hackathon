"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.empathyCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const empathy_1 = require("../empathy");
exports.empathyCases = [
    {
        name: "buildEmpathyPrompt includes memory and background",
        run: () => {
            const { systemPrompt, userPrompt } = (0, empathy_1.buildEmpathyPrompt)({
                originalContent: "Judge summary",
                userFeedback: "Too cold",
                memorySummary: "grew up in rural schools",
                userBackground: "I struggled with access",
            });
            strict_1.default.ok(systemPrompt.includes("do not introduce new facts"));
            strict_1.default.ok(userPrompt.includes("Judge summary"));
            strict_1.default.ok(userPrompt.includes("Too cold"));
            strict_1.default.ok(userPrompt.includes("grew up in rural schools"));
            strict_1.default.ok(userPrompt.includes("I struggled with access"));
        },
    },
    {
        name: "generateEmpathySupplement returns trimmed LLM output",
        run: async () => {
            const result = await (0, empathy_1.generateEmpathySupplement)({
                originalContent: "Judge summary",
                userFeedback: "Too cold",
            }, {
                generateText: async () => "  empathetic reply  ",
            });
            strict_1.default.equal(result, "empathetic reply");
        },
    },
    {
        name: "resolveEmpathyContext requires background for anonymous users",
        run: () => {
            const result = (0, empathy_1.resolveEmpathyContext)({
                isAnonymous: true,
                memorySummary: "",
                userBackground: "",
            });
            strict_1.default.equal(result.ok, false);
            if (!result.ok) {
                strict_1.default.equal(result.error, "BACKGROUND_REQUIRED");
            }
        },
    },
    {
        name: "resolveEmpathyContext allows logged-in users without background",
        run: () => {
            const result = (0, empathy_1.resolveEmpathyContext)({
                isAnonymous: false,
                memorySummary: "grew up in rural schools",
                userBackground: "",
            });
            strict_1.default.equal(result.ok, true);
            if (result.ok) {
                strict_1.default.equal(result.memorySummary, "grew up in rural schools");
                strict_1.default.equal(result.userBackground, undefined);
            }
        },
    },
];
