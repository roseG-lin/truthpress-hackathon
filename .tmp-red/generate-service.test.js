"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateServiceCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const test_helpers_1 = require("./__tests__/test-helpers");
const generate_service_1 = require("./generate-service");
exports.generateServiceCases = [
    {
        name: "buildGenerateResponse keeps Agent D idle when empathy is disabled",
        run: async () => {
            const llmResponses = [
                JSON.stringify({
                    output: "AI can improve access and tutor availability.",
                    claims: ["AI can improve access"],
                }),
                JSON.stringify({
                    result: "verified",
                    evidence: "Evidence supports broader tutoring availability.",
                }),
                "AI can improve access, but the claim still depends on how it is deployed.",
            ];
            const result = await (0, generate_service_1.buildGenerateResponse)({
                topic: "AI should replace teachers",
                userId: "user-1",
                enableEmpathy: false,
            }, {
                generateText: async () => llmResponses.shift() ?? "",
                searchWeb: async (query) => [
                    {
                        title: query,
                        snippet: "Sample evidence",
                        url: "https://example.com/evidence",
                    },
                ],
            });
            strict_1.default.equal(result.stages.agentD.status, "idle");
            strict_1.default.equal(result.finalContent, "AI can improve access, but the claim still depends on how it is deployed.");
        },
    },
    {
        name: "buildGenerateResponse keeps Agent C as finalContent and exposes Agent D as a supplement",
        run: async () => {
            const llmResponses = [
                JSON.stringify({
                    output: "AI can tailor explanations to different learners.",
                    claims: ["AI can tailor explanations to different learners"],
                }),
                JSON.stringify({
                    result: "uncertain",
                    evidence: "Evidence is mixed across classroom settings.",
                }),
                "AI may help some learners more than others, and the rollout context matters.",
                "If education felt uneven in your experience, this conclusion is really about setting realistic expectations without dismissing that pain.",
            ];
            const result = await (0, generate_service_1.buildGenerateResponse)({
                topic: "AI should replace teachers",
                userId: "user-2",
                enableEmpathy: true,
            }, {
                memorySummary: "The user grew up with limited education resources.",
                generateText: async () => llmResponses.shift() ?? "",
                searchWeb: async (query) => [
                    {
                        title: query,
                        snippet: "Sample evidence",
                        url: "https://example.com/evidence",
                    },
                ],
            });
            strict_1.default.equal(result.stages.agentD.status, "completed");
            strict_1.default.match(result.stages.agentD.output || "", /education felt uneven/i);
            strict_1.default.equal(result.finalContent, "AI may help some learners more than others, and the rollout context matters.");
            strict_1.default.match(result.empatheticSupplement || "", /education felt uneven/i);
        },
    },
];
if (require.main === module) {
    (0, test_helpers_1.runCases)("Generate Service", exports.generateServiceCases).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
