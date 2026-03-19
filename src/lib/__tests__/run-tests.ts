import { buildCacheCases } from "./build-cache.test";
import { cafeStageCases } from "./cafe-stage.test";
import { debateTimelineCases } from "./debate-timeline.test";
import { debateEngineCases } from "./debate-engine.test";
import { agentSummaryCases } from "./agent-summary.test";
import { ladderEngineCases } from "./ladder-engine.test";
import { ladderTypesCases } from "./ladder-types.test";
import { matchmakerCases } from "./matchmaker.test";
import { empathyCases } from "./empathy.test";
import { empathyDemoCases } from "./empathy-demo.test";
import { cafeAccessCases } from "./cafe-access.test";
import { ladderGameStateCases } from "./ladder-game-state.test";
import { runCases } from "./test-helpers";
import { truthConsoleCases } from "./truth-console.test";

async function main() {
  await runCases("Build Cache", buildCacheCases);
  await runCases("Agent Summary", agentSummaryCases);
  await runCases("Ladder Types", ladderTypesCases);
  await runCases("Ladder Engine", ladderEngineCases);
  await runCases("Ladder Game State", ladderGameStateCases);
  await runCases("Matchmaker", matchmakerCases);
  await runCases("Cafe Access", cafeAccessCases);
  await runCases("Empathy Demo", empathyDemoCases);
  await runCases("Empathy", empathyCases);
  await runCases("Debate Engine", debateEngineCases);
  await runCases("Debate Timeline", debateTimelineCases);
  await runCases("Cafe Stage", cafeStageCases);
  await runCases("Truth Console", truthConsoleCases);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
