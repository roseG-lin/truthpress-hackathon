"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentSummaryCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const agent_summary_1 = require("../agent-summary");
exports.agentSummaryCases = [
    {
        name: "buildAgentSummary extracts useful tokens from shades and softMemory",
        run: () => {
            const shades = {
                traits: ["curious", "skeptical"],
                values: { core: "evidence-first" },
            };
            const softMemory = {
                roles: ["researcher", "teacher"],
                notes: "Prefers verified sources and peer review.",
            };
            const summary = (0, agent_summary_1.buildAgentSummary)(shades, softMemory);
            strict_1.default.match(summary, /curious/);
            strict_1.default.match(summary, /skeptical/);
            strict_1.default.match(summary, /evidence/);
            strict_1.default.match(summary, /researcher/);
            strict_1.default.match(summary, /teacher/);
        },
    },
    {
        name: "buildAgentSummary handles empty inputs safely",
        run: () => {
            const summary = (0, agent_summary_1.buildAgentSummary)(null, null);
            strict_1.default.equal(summary, "");
        },
    },
];
