"use strict";
// ============================================
// Ladder Engine 单元测试
// 遵循 TDD 原则：先写测试，验证行为
// ============================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ladderEngineCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const ladder_engine_1 = require("../ladder-engine");
// ============================================
// 测试用例集合
// ============================================
exports.ladderEngineCases = [
    // ==================== 初始化测试 ====================
    {
        name: "initLadderState returns empty state",
        run: () => {
            const state = (0, ladder_engine_1.initLadderState)();
            strict_1.default.equal(state.stairs.length, 0, "初始状态 stairs 应为空");
            strict_1.default.equal(state.dStairs.length, 0, "初始状态 dStairs 应为空");
            strict_1.default.equal(state.auditIndex, -1, "初始 auditIndex 应为 -1");
            strict_1.default.equal(state.cMode, "idle", "初始 cMode 应为 idle");
            strict_1.default.equal(state.logs.length, 0, "初始 logs 应为空");
        },
    },
    // ==================== A_NEW_STEP 事件测试 ====================
    {
        name: "A_NEW_STEP pushes a pending stair",
        run: () => {
            const state = (0, ladder_engine_1.initLadderState)();
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "AI is great" });
            strict_1.default.equal(next.stairs.length, 1);
            strict_1.default.equal(next.stairs[0].agent, "A");
            strict_1.default.equal(next.stairs[0].status, "pending");
            strict_1.default.equal(next.stairs[0].text, "AI is great");
            strict_1.default.ok(next.stairs[0].id, "应生成唯一 ID");
        },
    },
    {
        name: "A_NEW_STEP updates auditIndex to max position",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "Step 1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "Step 2" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "Step 3" });
            strict_1.default.equal(state.stairs.length, 3);
            strict_1.default.equal(state.auditIndex, 2, "auditIndex 应更新为最新位置");
        },
    },
    {
        name: "Multiple A_NEW_STEP events create multiple stairs",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "Point 1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "Point 2" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "Point 3" });
            strict_1.default.equal(state.stairs.length, 3);
            strict_1.default.equal(state.stairs[0].text, "Point 1");
            strict_1.default.equal(state.stairs[1].text, "Point 2");
            strict_1.default.equal(state.stairs[2].text, "Point 3");
        },
    },
    // ==================== B_VERIFY_STEP 事件测试 ====================
    {
        name: "B_VERIFY_STEP with result=true marks stair as verified",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_VERIFY_STEP", index: 0, result: true });
            strict_1.default.equal(next.stairs[0].status, "verified");
            strict_1.default.equal(next.auditIndex, 0);
            strict_1.default.equal(next.stairs.length, 1, "楼梯数量不应改变");
        },
    },
    {
        name: "B_VERIFY_STEP with result=false marks stair as debunked",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_VERIFY_STEP", index: 0, result: false });
            strict_1.default.equal(next.stairs[0].status, "debunked");
            strict_1.default.equal(next.auditIndex, 0);
        },
    },
    {
        name: "B_VERIFY_STEP only affects targeted index",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A2" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A3" });
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_VERIFY_STEP", index: 1, result: true });
            strict_1.default.equal(next.stairs[0].status, "pending", "索引 0 不应受影响");
            strict_1.default.equal(next.stairs[1].status, "verified", "索引 1 应被验证");
            strict_1.default.equal(next.stairs[2].status, "pending", "索引 2 不应受影响");
        },
    },
    // ==================== B_DESTROY_STEP 事件测试 ====================
    {
        name: "B_DESTROY_STEP removes stair at index",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_DESTROY_STEP", index: 0 });
            strict_1.default.equal(next.stairs.length, 0, "楼梯应被移除");
        },
    },
    {
        name: "B_DESTROY_STEP adjusts auditIndex correctly",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A2" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A3" });
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_DESTROY_STEP", index: 1 });
            strict_1.default.equal(next.stairs.length, 2);
            strict_1.default.equal(next.auditIndex, 1, "auditIndex 应调整为有效值");
        },
    },
    {
        name: "B_DESTROY_STEP on empty state keeps auditIndex at -1",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_DESTROY_STEP", index: 0 });
            strict_1.default.equal(next.auditIndex, -1, "空状态 auditIndex 应为 -1");
        },
    },
    // ==================== D_NEW_STEP 事件测试 ====================
    {
        name: "D_NEW_STEP adds to dStairs",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "D_NEW_STEP", text: "Counter argument" });
            strict_1.default.equal(next.dStairs.length, 1);
            strict_1.default.equal(next.dStairs[0].agent, "D");
            strict_1.default.equal(next.dStairs[0].status, "pending");
            strict_1.default.equal(next.dStairs[0].text, "Counter argument");
        },
    },
    {
        name: "Multiple D_NEW_STEP events create multiple dStairs",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "D_NEW_STEP", text: "D1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "D_NEW_STEP", text: "D2" });
            strict_1.default.equal(state.dStairs.length, 2);
            strict_1.default.equal(state.stairs.length, 0, "主楼梯不应受影响");
        },
    },
    // ==================== C_ABSORB_D 事件测试 ====================
    {
        name: "C_ABSORB_D merges dStairs into main stairs",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "D_NEW_STEP", text: "D1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "D_NEW_STEP", text: "D2" });
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "C_ABSORB_D" });
            strict_1.default.equal(next.dStairs.length, 0, "dStairs 应被清空");
            strict_1.default.equal(next.stairs.length, 3, "主楼梯应包含所有台阶");
            strict_1.default.equal(next.stairs[1].agent, "D");
            strict_1.default.equal(next.stairs[2].agent, "D");
            strict_1.default.equal(next.cMode, "merged");
        },
    },
    {
        name: "C_ABSORB_D with empty dStairs only sets cMode",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "C_ABSORB_D" });
            strict_1.default.equal(next.dStairs.length, 0);
            strict_1.default.equal(next.stairs.length, 1, "主楼梯不应改变");
            strict_1.default.equal(next.cMode, "merged");
        },
    },
    // ==================== RESET 事件测试 ====================
    {
        name: "RESET event returns to initial state",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "D_NEW_STEP", text: "D1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_VERIFY_STEP", index: 0, result: true });
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "RESET" });
            strict_1.default.deepEqual(next, (0, ladder_engine_1.initLadderState)());
        },
    },
    // ==================== LOG 事件测试 ====================
    {
        name: "LOG event adds message to logs",
        run: () => {
            const state = (0, ladder_engine_1.initLadderState)();
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "LOG", text: "Test message" });
            strict_1.default.equal(next.logs.length, 1);
            strict_1.default.equal(next.logs[0], "Test message");
        },
    },
    {
        name: "Multiple LOG events append to logs",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "LOG", text: "Message 1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "LOG", text: "Message 2" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "LOG", text: "Message 3" });
            strict_1.default.equal(state.logs.length, 3);
            strict_1.default.equal(state.logs[0], "Message 1");
            strict_1.default.equal(state.logs[1], "Message 2");
            strict_1.default.equal(state.logs[2], "Message 3");
        },
    },
    // ==================== 未知事件测试 ====================
    {
        name: "UNKNOWN events keep state unchanged",
        run: () => {
            const state = (0, ladder_engine_1.initLadderState)();
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "UNKNOWN" });
            strict_1.default.deepEqual(next, state);
        },
    },
    // ==================== 不可变性测试 ====================
    {
        name: "Reducer follows immutability principle",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "Original" });
            const originalLength = state.stairs.length;
            const originalStairs = state.stairs;
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "New" });
            strict_1.default.equal(state.stairs.length, originalLength, "原状态不应被修改");
            strict_1.default.equal(next.stairs.length, originalLength + 1, "新状态应包含变化");
            strict_1.default.notEqual(next.stairs, originalStairs, "应返回新数组");
        },
    },
    // ==================== 选择器函数测试 ====================
    {
        name: "selectAgentSteps returns only specified agent's steps",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A2" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "D_NEW_STEP", text: "D1" });
            const aSteps = (0, ladder_engine_1.selectAgentSteps)(state, "A");
            const dSteps = (0, ladder_engine_1.selectAgentSteps)(state, "D");
            strict_1.default.equal(aSteps.length, 2);
            strict_1.default.equal(dSteps.length, 1);
        },
    },
    {
        name: "selectVerifiedCount counts verified steps",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A2" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A3" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_VERIFY_STEP", index: 0, result: true });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_VERIFY_STEP", index: 2, result: true });
            strict_1.default.equal((0, ladder_engine_1.selectVerifiedCount)(state), 2);
        },
    },
    {
        name: "selectDebunkedCount counts debunked steps",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A2" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_VERIFY_STEP", index: 0, result: false });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_VERIFY_STEP", index: 1, result: false });
            strict_1.default.equal((0, ladder_engine_1.selectDebunkedCount)(state), 2);
        },
    },
    {
        name: "selectIsDone returns true when merged with no dStairs",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "D_NEW_STEP", text: "D1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "C_ABSORB_D" });
            strict_1.default.equal((0, ladder_engine_1.selectIsDone)(state), true);
        },
    },
    {
        name: "selectIsDone returns false when not merged",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            strict_1.default.equal((0, ladder_engine_1.selectIsDone)(state), false);
        },
    },
    // ==================== 边缘情况测试 ====================
    {
        name: "B_VERIFY_STEP on out-of-bounds index does nothing",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            const beforeLength = state.stairs.length;
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_VERIFY_STEP", index: 10, result: true });
            strict_1.default.equal(next.stairs.length, beforeLength);
            strict_1.default.equal(next.stairs[0].status, "pending");
        },
    },
    {
        name: "B_DESTROY_STEP on out-of-bounds index does nothing",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            const next = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_DESTROY_STEP", index: 10 });
            strict_1.default.equal(next.stairs.length, 1);
        },
    },
    {
        name: "State survives complex sequence of events",
        run: () => {
            let state = (0, ladder_engine_1.initLadderState)();
            // 复杂序列
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A2" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "A_NEW_STEP", text: "A3" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_VERIFY_STEP", index: 0, result: true });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "B_DESTROY_STEP", index: 1 });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "D_NEW_STEP", text: "D1" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "D_NEW_STEP", text: "D2" });
            state = (0, ladder_engine_1.reduceLadderEvent)(state, { event: "C_ABSORB_D" });
            strict_1.default.equal(state.stairs.length, 4); // A1, A3, D1, D2
            strict_1.default.equal(state.stairs[0].status, "verified");
            strict_1.default.equal(state.cMode, "merged");
            strict_1.default.equal(state.dStairs.length, 0);
        },
    },
];
