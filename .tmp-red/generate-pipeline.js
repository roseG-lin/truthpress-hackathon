"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGeneratePipeline = runGeneratePipeline;
const agent_a_1 = require("./agents/agent-a");
const agent_b_1 = require("./agents/agent-b");
const agent_c_1 = require("./agents/agent-c");
async function runGeneratePipeline(input, deps = {}) {
    const agentA = await (0, agent_a_1.runAgentA)(input.topic, {
        generateText: deps.generateText,
    });
    const verification = await (0, agent_b_1.runAgentB)(agentA.claims, {
        generateText: deps.generateText,
        searchWeb: deps.searchWeb,
    });
    const finalContent = await (0, agent_c_1.runAgentC)(input.topic, agentA.output, verification, {
        generateText: deps.generateText,
    });
    return {
        stages: {
            agentA: {
                status: "completed",
                output: agentA.output,
            },
            agentB: {
                status: "completed",
                verification,
            },
            agentC: {
                status: "completed",
                output: finalContent,
            },
            agentD: {
                status: "idle",
            },
        },
        finalContent,
    };
}
