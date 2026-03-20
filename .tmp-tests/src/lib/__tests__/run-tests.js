"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const build_cache_test_1 = require("./build-cache.test");
const cafe_stage_test_1 = require("./cafe-stage.test");
const debate_timeline_test_1 = require("./debate-timeline.test");
const debate_engine_test_1 = require("./debate-engine.test");
const agent_summary_test_1 = require("./agent-summary.test");
const ladder_engine_test_1 = require("./ladder-engine.test");
const ladder_types_test_1 = require("./ladder-types.test");
const matchmaker_test_1 = require("./matchmaker.test");
const empathy_test_1 = require("./empathy.test");
const empathy_demo_test_1 = require("./empathy-demo.test");
const cafe_access_test_1 = require("./cafe-access.test");
const ladder_game_state_test_1 = require("./ladder-game-state.test");
const test_helpers_1 = require("./test-helpers");
const truth_console_test_1 = require("./truth-console.test");
async function main() {
    await (0, test_helpers_1.runCases)("Build Cache", build_cache_test_1.buildCacheCases);
    await (0, test_helpers_1.runCases)("Agent Summary", agent_summary_test_1.agentSummaryCases);
    await (0, test_helpers_1.runCases)("Ladder Types", ladder_types_test_1.ladderTypesCases);
    await (0, test_helpers_1.runCases)("Ladder Engine", ladder_engine_test_1.ladderEngineCases);
    await (0, test_helpers_1.runCases)("Ladder Game State", ladder_game_state_test_1.ladderGameStateCases);
    await (0, test_helpers_1.runCases)("Matchmaker", matchmaker_test_1.matchmakerCases);
    await (0, test_helpers_1.runCases)("Cafe Access", cafe_access_test_1.cafeAccessCases);
    await (0, test_helpers_1.runCases)("Empathy Demo", empathy_demo_test_1.empathyDemoCases);
    await (0, test_helpers_1.runCases)("Empathy", empathy_test_1.empathyCases);
    await (0, test_helpers_1.runCases)("Debate Engine", debate_engine_test_1.debateEngineCases);
    await (0, test_helpers_1.runCases)("Debate Timeline", debate_timeline_test_1.debateTimelineCases);
    await (0, test_helpers_1.runCases)("Cafe Stage", cafe_stage_test_1.cafeStageCases);
    await (0, test_helpers_1.runCases)("Truth Console", truth_console_test_1.truthConsoleCases);
}
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
