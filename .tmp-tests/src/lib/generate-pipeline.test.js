"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePipelineCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const test_helpers_1 = require("./__tests__/test-helpers");
const generate_pipeline_1 = require("./generate-pipeline");
exports.generatePipelineCases = [
    {
        name: "runGeneratePipeline returns a docs-aligned A/B/C response shape",
        run: async () => {
            const llmResponses = [
                JSON.stringify({
                    output: "AI can provide 24/7 tutoring and adapt content to each learner.",
                    claims: [
                        "AI can provide 24/7 tutoring",
                        "AI can adapt content to each learner",
                    ],
                }),
                JSON.stringify({
                    result: "verified",
                    evidence: "A study found AI tutors can stay available around the clock.",
                }),
                JSON.stringify({
                    result: "uncertain",
                    evidence: "Adaptation quality depends on training data and classroom context.",
                }),
                "AI can widen access, but personalized outcomes still depend on implementation quality.",
            ];
            const result = await (0, generate_pipeline_1.runGeneratePipeline)({
                topic: "AI should replace teachers",
                userId: "user-123",
                enableEmpathy: false,
            }, {
                generateText: async () => llmResponses.shift() ?? "",
                searchWeb: async (query) => [
                    {
                        title: `Evidence for ${query}`,
                        snippet: `Snippet for ${query}`,
                        url: `https://example.com/${encodeURIComponent(query)}`,
                    },
                ],
            });
            strict_1.default.equal(result.stages.agentA.status, "completed");
            strict_1.default.equal(result.stages.agentB.status, "completed");
            strict_1.default.equal(result.stages.agentC.status, "completed");
            strict_1.default.equal(result.stages.agentD.status, "idle");
            strict_1.default.equal(result.stages.agentB.verification.length, 2);
            strict_1.default.equal(result.stages.agentB.verification[0]?.result, "verified");
            strict_1.default.equal(result.stages.agentB.verification[1]?.result, "uncertain");
            strict_1.default.equal(result.finalContent, "AI can widen access, but personalized outcomes still depend on implementation quality.");
        },
    },
];
if (require.main === module) {
    (0, test_helpers_1.runCases)("Generate Pipeline", exports.generatePipelineCases).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
