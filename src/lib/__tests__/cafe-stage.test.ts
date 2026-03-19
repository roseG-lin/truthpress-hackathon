import assert from "node:assert/strict";

import {
  ARENA_STAGE_COUNT,
  getArenaProgress,
  getArenaStageDescription,
  getArenaVisibility,
  getArenaStageLabel,
} from "../cafe-stage";
import { type AsyncTestCase } from "./test-helpers";

export const cafeStageCases: AsyncTestCase[] = [
  {
    name: "arena stage helpers reveal panels in the expected order",
    run: () => {
      assert.equal(ARENA_STAGE_COUNT, 4);

      assert.deepEqual(getArenaVisibility(0), {
        matchBanner: true,
        userPanel: false,
        opponentPanel: false,
        judgePanel: false,
      });

      assert.deepEqual(getArenaVisibility(1), {
        matchBanner: true,
        userPanel: true,
        opponentPanel: false,
        judgePanel: false,
      });

      assert.deepEqual(getArenaVisibility(2), {
        matchBanner: true,
        userPanel: true,
        opponentPanel: true,
        judgePanel: false,
      });

      assert.deepEqual(getArenaVisibility(3), {
        matchBanner: true,
        userPanel: true,
        opponentPanel: true,
        judgePanel: true,
      });
    },
  },
  {
    name: "arena stage labels match the reveal order",
    run: () => {
      assert.equal(getArenaStageLabel(0), "匹配成功");
      assert.equal(getArenaStageLabel(1), "Agent A 正在登场");
      assert.equal(getArenaStageLabel(2), "对手回应即将出现");
      assert.equal(getArenaStageLabel(3), "Judge C 正在更新求真控制台");
      assert.equal(getArenaStageLabel(99), "Judge C 正在更新求真控制台");
    },
  },
  {
    name: "arena progress helpers return stable percentages and descriptions",
    run: () => {
      assert.equal(getArenaProgress(0), 25);
      assert.equal(getArenaProgress(1), 50);
      assert.equal(getArenaProgress(2), 75);
      assert.equal(getArenaProgress(3), 100);
      assert.equal(
        getArenaStageDescription(2),
        "Agent B 正带着对手人格设定进入现场并发起反击。",
      );
    },
  },
];
