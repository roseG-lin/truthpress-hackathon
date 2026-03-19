// ============================================
// Ladder Types 单元测试
// 测试类型转换和工具函数
// ============================================

import assert from "node:assert/strict";

import {
  sseEventToReducerEvent,
  createStep,
  initLadderState,
  type SSEEvent,
  type ReducerEvent,
  type LadderAgent,
  type BlockStatus,
  type PhaseType,
} from "../ladder-types";
import { type AsyncTestCase } from "./test-helpers";

export const ladderTypesCases: AsyncTestCase[] = [
  // ==================== sseEventToReducerEvent 测试 ====================
  {
    name: "sseEventToReducerEvent converts A_NEW_STEP correctly",
    run: () => {
      const sseEvent: SSEEvent = {
        event: "A_NEW_STEP",
        data: { text: "Test argument" },
        timestamp: Date.now(),
      };

      const reducerEvent = sseEventToReducerEvent(sseEvent);

      assert.equal(reducerEvent.event, "A_NEW_STEP");
      if (reducerEvent.event === "A_NEW_STEP") {
        assert.equal(reducerEvent.text, "Test argument");
      }
    },
  },

  {
    name: "sseEventToReducerEvent converts B_VERIFY correctly",
    run: () => {
      const sseEvent: SSEEvent = {
        event: "B_VERIFY",
        data: { id: "test-id", verified: true, index: 0 },
        timestamp: Date.now(),
      };

      const reducerEvent = sseEventToReducerEvent(sseEvent);

      assert.equal(reducerEvent.event, "B_VERIFY_STEP");
      if (reducerEvent.event === "B_VERIFY_STEP") {
        assert.equal(reducerEvent.result, true);
        assert.equal(reducerEvent.index, 0);
      }
    },
  },

  {
    name: "sseEventToReducerEvent converts B_DESTROY correctly",
    run: () => {
      const sseEvent: SSEEvent = {
        event: "B_DESTROY",
        data: { id: "test-id", index: 1 },
        timestamp: Date.now(),
      };

      const reducerEvent = sseEventToReducerEvent(sseEvent);

      assert.equal(reducerEvent.event, "B_DESTROY_STEP");
      if (reducerEvent.event === "B_DESTROY_STEP") {
        assert.equal(reducerEvent.index, 1);
      }
    },
  },

  {
    name: "sseEventToReducerEvent converts D_NEW_STEP correctly",
    run: () => {
      const sseEvent: SSEEvent = {
        event: "D_NEW_STEP",
        data: { text: "Counter argument" },
        timestamp: Date.now(),
      };

      const reducerEvent = sseEventToReducerEvent(sseEvent);

      assert.equal(reducerEvent.event, "D_NEW_STEP");
      if (reducerEvent.event === "D_NEW_STEP") {
        assert.equal(reducerEvent.text, "Counter argument");
      }
    },
  },

  {
    name: "sseEventToReducerEvent converts C_MERGE_START correctly",
    run: () => {
      const sseEvent: SSEEvent = {
        event: "C_MERGE_START",
        data: {
          blocks: [
            { id: "d1", agent: "D", text: "D1" },
            { id: "d2", agent: "D", text: "D2" },
          ],
        },
        timestamp: Date.now(),
      };

      const reducerEvent = sseEventToReducerEvent(sseEvent);

      assert.equal(reducerEvent.event, "C_ABSORB_D");
    },
  },

  {
    name: "sseEventToReducerEvent converts DONE correctly",
    run: () => {
      const sseEvent: SSEEvent = {
        event: "DONE",
        data: { summary: "Test summary" },
        timestamp: Date.now(),
      };

      const reducerEvent = sseEventToReducerEvent(sseEvent);

      assert.equal(reducerEvent.event, "DONE");
      if (reducerEvent.event === "DONE") {
        assert.equal(reducerEvent.text, "Test summary");
      }
    },
  },

  // ==================== createStep 测试 ====================
  {
    name: "createStep creates step with correct properties",
    run: () => {
      const agent: LadderAgent = "A";
      const text = "Test step";
      const status: BlockStatus = "pending";

      const step = createStep(agent, text, status);

      assert.equal(step.agent, "A");
      assert.equal(step.text, "Test step");
      assert.equal(step.status, "pending");
      assert.ok(step.id, "应生成唯一 ID");
      assert.ok(step.id.length > 0, "ID 不应为空");
    },
  },

  {
    name: "createStep with different agents",
    run: () => {
      const agents: LadderAgent[] = ["A", "B", "C", "D"];

      agents.forEach((agent) => {
        const step = createStep(agent, "Test", "pending");
        assert.equal(step.agent, agent);
      });
    },
  },

  {
    name: "createStep with different statuses",
    run: () => {
      const statuses: BlockStatus[] = ["pending", "verified", "debunked", "merged"];

      statuses.forEach((status) => {
        const step = createStep("A", "Test", status);
        assert.equal(step.status, status);
      });
    },
  },

  {
    name: "createStep generates unique IDs",
    run: () => {
      const step1 = createStep("A", "Test1", "pending");
      // 等待至少 1ms 确保 timestamp 不同
      const startTime = Date.now();
      while (Date.now() - startTime < 2) {
        // busy wait
      }
      const step2 = createStep("A", "Test2", "pending");

      assert.notEqual(step1.id, step2.id, "ID 应唯一");
    },
  },

  // ==================== initLadderState 测试 ====================
  {
    name: "initLadderState returns correct initial state",
    run: () => {
      const state = initLadderState();

      assert.deepEqual(state.stairs, []);
      assert.deepEqual(state.dStairs, []);
      assert.equal(state.auditIndex, -1);
      assert.equal(state.cMode, "idle");
      assert.deepEqual(state.logs, []);
    },
  },

  // ==================== 类型安全测试 ====================
  {
    name: "LadderAgent type accepts valid values",
    run: () => {
      const agents: LadderAgent[] = ["A", "B", "C", "D"];

      assert.equal(agents.length, 4);
      agents.forEach((agent) => {
        assert.ok(["A", "B", "C", "D"].includes(agent));
      });
    },
  },

  {
    name: "BlockStatus type accepts valid values",
    run: () => {
      const statuses: BlockStatus[] = ["pending", "verified", "debunked", "merged"];

      assert.equal(statuses.length, 4);
    },
  },

  {
    name: "PhaseType type accepts valid values",
    run: () => {
      const phases: PhaseType[] = ["A_BUILD", "B_CHECK", "C_MERGE", "DONE"];

      assert.equal(phases.length, 4);
    },
  },

  // ==================== 边缘情况测试 ====================
  {
    name: "sseEventToReducerEvent handles missing data gracefully",
    run: () => {
      const sseEvent: SSEEvent = {
        event: "A_NEW_STEP",
        data: {},
        timestamp: Date.now(),
      };

      const reducerEvent = sseEventToReducerEvent(sseEvent);

      assert.equal(reducerEvent.event, "A_NEW_STEP");
      if (reducerEvent.event === "A_NEW_STEP") {
        assert.equal(reducerEvent.text, "");
      }
    },
  },

  {
    name: "createStep defaults to pending status",
    run: () => {
      const step = createStep("A", "Test");

      assert.equal(step.status, "pending");
    },
  },
];
