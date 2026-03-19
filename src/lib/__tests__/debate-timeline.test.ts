import assert from "node:assert/strict";

import { getDebateTimeline } from "../debate-timeline";
import { type AsyncTestCase } from "./test-helpers";

export const debateTimelineCases: AsyncTestCase[] = [
  {
    name: "debate timeline marks earlier stages as complete and current stage as live",
    run: () => {
      const timeline = getDebateTimeline(2);

      assert.equal(timeline.length, 4);
      assert.equal(timeline[0]?.status, "complete");
      assert.equal(timeline[1]?.status, "complete");
      assert.equal(timeline[2]?.status, "current");
      assert.equal(timeline[3]?.status, "upcoming");
    },
  },
  {
    name: "debate timeline preserves the intended speaking order",
    run: () => {
      const timeline = getDebateTimeline(3);

      assert.deepEqual(
        timeline.map((entry: { label: string }) => entry.label),
        ["匹配器", "Agent A", "Agent B", "Judge C"],
      );
      assert.equal(timeline[3]?.description, "求真控制台正在发布裁决与证据堆栈。");
    },
  },
];
