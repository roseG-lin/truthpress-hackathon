"use strict";
// ============================================
// 求真社-TRUTHPRESS - 真理之梯类型定义
// Ladder Types - TruthPress Type Definitions
// 用于 API 路由、状态机和前端组件之间的事件通信
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.sseEventToReducerEvent = sseEventToReducerEvent;
exports.createStep = createStep;
exports.initLadderState = initLadderState;
// ============================================
// 工具函数
// ============================================
/**
 * 将 SSE 事件转换为 Reducer 事件
 * 用于前端接收到 SSE 事件后更新本地状态
 */
function sseEventToReducerEvent(sseEvent) {
    switch (sseEvent.event) {
        case "A_NEW_STEP":
            return { event: "A_NEW_STEP", text: sseEvent.data.text || "" };
        case "B_VERIFY":
            return { event: "B_VERIFY_STEP", index: sseEvent.data.index || 0, result: sseEvent.data.verified || false };
        case "B_DESTROY":
            return { event: "B_DESTROY_STEP", index: sseEvent.data.index || 0 };
        case "C_INITIAL_CONCLUSION":
            return { event: "C_INITIAL_CONCLUSION", conclusion: sseEvent.data.conclusion || "" };
        case "D_NEW_STEP":
            return { event: "D_NEW_STEP", text: sseEvent.data.text || "" };
        case "C_MERGE_START":
            return { event: "C_ABSORB_D" };
        case "DONE":
            return { event: "DONE", text: sseEvent.data.summary || "" };
        default:
            return { event: "UNKNOWN" };
    }
}
/**
 * 创建新台阶
 */
function createStep(agent, text, status = "pending") {
    return {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        agent,
        text,
        status,
    };
}
/**
 * 初始化梯子状态
 */
function initLadderState() {
    return {
        stairs: [],
        dStairs: [],
        auditIndex: -1,
        cMode: "idle",
        initialConclusion: undefined,
        finalConclusion: undefined,
        logs: [],
    };
}
