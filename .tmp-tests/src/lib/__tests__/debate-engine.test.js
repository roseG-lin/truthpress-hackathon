"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debateEngineCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const debate_engine_1 = require("../debate-engine");
exports.debateEngineCases = [
    {
        name: "generateDebateRound returns user, opponent, and judge verdict payload",
        run: async () => {
            const responses = [
                "AI helps scale education access by lowering teacher workload.",
                "AI cannot replace teachers because empathy and in-room judgment matter.",
                JSON.stringify({
                    claims: [
                        { speaker: "user", claim: "AI lowers teacher workload.", query: "AI teacher workload study" },
                        { speaker: "opponent", claim: "Teachers provide empathy AI lacks.", query: "teacher empathy classroom research" },
                    ],
                }),
                JSON.stringify({
                    verdict: "supported",
                    reason: "Evidence highlights AI workflow gains for teachers.",
                }),
                JSON.stringify({
                    verdict: "mixed",
                    reason: "Empathy is supported, but the evidence is qualitative.",
                }),
                JSON.stringify({
                    verdict: "mixed",
                    summary: "Both sides surfaced real points, but neither proved total victory.",
                    winningSide: "draw",
                }),
            ];
            const seenQueries = [];
            const result = await (0, debate_engine_1.generateDebateRound)({
                topic: "AI should replace teachers",
                userStance: "AI should replace teachers because scale matters.",
                user: {
                    userId: "user-1",
                    displayName: "Alex",
                    avatarUrl: "",
                    sourceType: "anonymous",
                },
                opponent: {
                    name: "Jordan",
                    avatarUrl: "",
                    bio: "A skeptical classroom veteran.",
                    argument: "AI cannot replace teachers because empathy and in-room judgment matter.",
                    sourceType: "secondme",
                },
            }, {
                generateText: async () => responses.shift() ?? "",
                searchWeb: async (query) => {
                    seenQueries.push(query);
                    return [
                        {
                            title: `Evidence for ${query}`,
                            snippet: `Snippet for ${query}`,
                            url: `https://example.com/${encodeURIComponent(query)}`,
                        },
                    ];
                },
            });
            strict_1.default.equal(result.user.name, "Alex");
            strict_1.default.equal(result.opponent.name, "Jordan");
            strict_1.default.equal(result.judge.verdict, "mixed");
            strict_1.default.equal(result.judge.winningSide, "draw");
            strict_1.default.equal(result.truthConsole.checks.length, 2);
            strict_1.default.deepEqual(seenQueries, ["AI teacher workload study", "teacher empathy classroom research"]);
            strict_1.default.equal(result.truthConsole.checks[0].evidence[0]?.url, "https://example.com/AI%20teacher%20workload%20study");
        },
    },
];
