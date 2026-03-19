"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildGenerateResponse = buildGenerateResponse;
const empathy_1 = require("./empathy");
const generate_pipeline_1 = require("./generate-pipeline");
function shouldGenerateEmpathy(input, deps) {
    if (!input.enableEmpathy) {
        return false;
    }
    return Boolean(deps.memorySummary?.trim() || deps.userBackground?.trim());
}
async function buildGenerateResponse(input, deps = {}) {
    const pipelineResult = await (0, generate_pipeline_1.runGeneratePipeline)(input, {
        generateText: deps.generateText,
        searchWeb: deps.searchWeb,
    });
    if (!shouldGenerateEmpathy(input, deps)) {
        return pipelineResult;
    }
    const empathyOutput = await (0, empathy_1.generateEmpathySupplement)({
        originalContent: pipelineResult.finalContent,
        userFeedback: "Please express this conclusion in a warmer and more personally resonant way.",
        memorySummary: deps.memorySummary,
        userBackground: deps.userBackground,
    }, {
        generateText: deps.generateText,
    });
    return {
        ...pipelineResult,
        stages: {
            ...pipelineResult.stages,
            agentD: {
                status: "completed",
                output: empathyOutput,
            },
        },
        finalContent: empathyOutput || pipelineResult.finalContent,
    };
}
