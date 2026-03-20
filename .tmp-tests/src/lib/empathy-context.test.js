"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.empathyContextCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const empathy_context_1 = require("./empathy-context");
const test_helpers_1 = require("./__tests__/test-helpers");
exports.empathyContextCases = [
    {
        name: "buildEmpathyExplanation prefers memory-highlights explanation for logged-in users",
        run: () => {
            const result = (0, empathy_context_1.buildEmpathyExplanation)({
                source: "secondme",
                memoryHighlights: ["rural school", "limited resources"],
            });
            strict_1.default.match(result, /SecondMe|记忆片段/);
        },
    },
    {
        name: "buildEmpathyExplanation explains anonymous background fallback",
        run: () => {
            const result = (0, empathy_context_1.buildEmpathyExplanation)({
                source: "anonymous",
                userBackground: "I grew up in a small town.",
            });
            strict_1.default.match(result, /一句话背景/);
        },
    },
    {
        name: "buildEmpathyExplanation mentions fallback mode when requested",
        run: () => {
            const result = (0, empathy_context_1.buildEmpathyExplanation)({
                source: "anonymous",
                fallback: true,
            });
            strict_1.default.match(result, /保底共情措辞/);
        },
    },
];
(0, test_helpers_1.runCases)("Empathy Context", exports.empathyContextCases).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
