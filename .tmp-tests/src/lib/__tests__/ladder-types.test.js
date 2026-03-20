"use strict";
// ============================================
// Ladder Types 单元测试
// 测试类型转换和工具函数
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ladderTypesCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const ladder_types_1 = require("../ladder-types");
exports.ladderTypesCases = [
    // ==================== sseEventToReducerEvent 测试 ====================
    {
        name: "sseEventToReducerEvent converts A_NEW_STEP correctly",
        run: () => {
            const sseEvent = {
                event: "A_NEW_STEP",
                data: { text: "Test argument" },
                timestamp: Date.now(),
            };
            const reducerEvent = (0, ladder_types_1.sseEventToReducerEvent)(sseEvent);
            strict_1.default.equal(reducerEvent.event, "A_NEW_STEP");
            if (reducerEvent.event === "A_NEW_STEP") {
                strict_1.default.equal(reducerEvent.text, "Test argument");
            }
        },
    },
    {
        name: "sseEventToReducerEvent converts B_VERIFY correctly",
        run: () => {
            const sseEvent = {
                event: "B_VERIFY",
                data: { id: "test-id", verified: true, index: 0 },
                timestamp: Date.now(),
            };
            const reducerEvent = (0, ladder_types_1.sseEventToReducerEvent)(sseEvent);
            strict_1.default.equal(reducerEvent.event, "B_VERIFY_STEP");
            if (reducerEvent.event === "B_VERIFY_STEP") {
                strict_1.default.equal(reducerEvent.result, true);
                strict_1.default.equal(reducerEvent.index, 0);
            }
        },
    },
    {
        name: "sseEventToReducerEvent converts B_DESTROY correctly",
        run: () => {
            const sseEvent = {
                event: "B_DESTROY",
                data: { id: "test-id", index: 1 },
                timestamp: Date.now(),
            };
            const reducerEvent = (0, ladder_types_1.sseEventToReducerEvent)(sseEvent);
            strict_1.default.equal(reducerEvent.event, "B_DESTROY_STEP");
            if (reducerEvent.event === "B_DESTROY_STEP") {
                strict_1.default.equal(reducerEvent.index, 1);
            }
        },
    },
    {
        name: "sseEventToReducerEvent converts D_NEW_STEP correctly",
        run: () => {
            const sseEvent = {
                event: "D_NEW_STEP",
                data: { text: "Counter argument" },
                timestamp: Date.now(),
            };
            const reducerEvent = (0, ladder_types_1.sseEventToReducerEvent)(sseEvent);
            strict_1.default.equal(reducerEvent.event, "D_NEW_STEP");
            if (reducerEvent.event === "D_NEW_STEP") {
                strict_1.default.equal(reducerEvent.text, "Counter argument");
            }
        },
    },
    {
        name: "sseEventToReducerEvent converts C_MERGE_START correctly",
        run: () => {
            const sseEvent = {
                event: "C_MERGE_START",
                data: {
                    blocks: [
                        { id: "d1", agent: "D", text: "D1" },
                        { id: "d2", agent: "D", text: "D2" },
                    ],
                },
                timestamp: Date.now(),
            };
            const reducerEvent = (0, ladder_types_1.sseEventToReducerEvent)(sseEvent);
            strict_1.default.equal(reducerEvent.event, "C_ABSORB_D");
        },
    },
    {
        name: "sseEventToReducerEvent converts DONE correctly",
        run: () => {
            const sseEvent = {
                event: "DONE",
                data: { summary: "Test summary" },
                timestamp: Date.now(),
            };
            const reducerEvent = (0, ladder_types_1.sseEventToReducerEvent)(sseEvent);
            strict_1.default.equal(reducerEvent.event, "DONE");
            if (reducerEvent.event === "DONE") {
                strict_1.default.equal(reducerEvent.text, "Test summary");
            }
        },
    },
    // ==================== createStep 测试 ====================
    {
        name: "createStep creates step with correct properties",
        run: () => {
            const agent = "A";
            const text = "Test step";
            const status = "pending";
            const step = (0, ladder_types_1.createStep)(agent, text, status);
            strict_1.default.equal(step.agent, "A");
            strict_1.default.equal(step.text, "Test step");
            strict_1.default.equal(step.status, "pending");
            strict_1.default.ok(step.id, "应生成唯一 ID");
            strict_1.default.ok(step.id.length > 0, "ID 不应为空");
        },
    },
    {
        name: "createStep with different agents",
        run: () => {
            const agents = ["A", "B", "C", "D"];
            agents.forEach((agent) => {
                const step = (0, ladder_types_1.createStep)(agent, "Test", "pending");
                strict_1.default.equal(step.agent, agent);
            });
        },
    },
    {
        name: "createStep with different statuses",
        run: () => {
            const statuses = ["pending", "verified", "debunked", "merged"];
            statuses.forEach((status) => {
                const step = (0, ladder_types_1.createStep)("A", "Test", status);
                strict_1.default.equal(step.status, status);
            });
        },
    },
    {
        name: "createStep generates unique IDs",
        run: () => {
            const step1 = (0, ladder_types_1.createStep)("A", "Test1", "pending");
            // 等待至少 1ms 确保 timestamp 不同
            const startTime = Date.now();
            while (Date.now() - startTime < 2) {
                // busy wait
            }
            const step2 = (0, ladder_types_1.createStep)("A", "Test2", "pending");
            strict_1.default.notEqual(step1.id, step2.id, "ID 应唯一");
        },
    },
    // ==================== initLadderState 测试 ====================
    {
        name: "initLadderState returns correct initial state",
        run: () => {
            const state = (0, ladder_types_1.initLadderState)();
            strict_1.default.deepEqual(state.stairs, []);
            strict_1.default.deepEqual(state.dStairs, []);
            strict_1.default.equal(state.auditIndex, -1);
            strict_1.default.equal(state.cMode, "idle");
            strict_1.default.deepEqual(state.logs, []);
        },
    },
    // ==================== 类型安全测试 ====================
    {
        name: "LadderAgent type accepts valid values",
        run: () => {
            const agents = ["A", "B", "C", "D"];
            strict_1.default.equal(agents.length, 4);
            agents.forEach((agent) => {
                strict_1.default.ok(["A", "B", "C", "D"].includes(agent));
            });
        },
    },
    {
        name: "BlockStatus type accepts valid values",
        run: () => {
            const statuses = ["pending", "verified", "debunked", "merged"];
            strict_1.default.equal(statuses.length, 4);
        },
    },
    {
        name: "PhaseType type accepts valid values",
        run: () => {
            const phases = ["A_BUILD", "B_CHECK", "C_MERGE", "DONE"];
            strict_1.default.equal(phases.length, 4);
        },
    },
    // ==================== 边缘情况测试 ====================
    {
        name: "sseEventToReducerEvent handles missing data gracefully",
        run: () => {
            const sseEvent = {
                event: "A_NEW_STEP",
                data: {},
                timestamp: Date.now(),
            };
            const reducerEvent = (0, ladder_types_1.sseEventToReducerEvent)(sseEvent);
            strict_1.default.equal(reducerEvent.event, "A_NEW_STEP");
            if (reducerEvent.event === "A_NEW_STEP") {
                strict_1.default.equal(reducerEvent.text, "");
            }
        },
    },
    {
        name: "createStep defaults to pending status",
        run: () => {
            const step = (0, ladder_types_1.createStep)("A", "Test");
            strict_1.default.equal(step.status, "pending");
        },
    },
];
