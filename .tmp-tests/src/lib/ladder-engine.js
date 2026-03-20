"use strict";
// ============================================
// 求真社-TRUTHPRESS - 真理之梯状态机
// Ladder Engine - TruthPress State Machine
// 使用统一类型定义
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStep = exports.initLadderState = void 0;
exports.reduceLadderEvent = reduceLadderEvent;
exports.selectAgentSteps = selectAgentSteps;
exports.selectVerifiedCount = selectVerifiedCount;
exports.selectDebunkedCount = selectDebunkedCount;
exports.selectIsDone = selectIsDone;
const ladder_types_1 = require("./ladder-types");
Object.defineProperty(exports, "createStep", { enumerable: true, get: function () { return ladder_types_1.createStep; } });
// 重新导出函数以保持向后兼容
exports.initLadderState = ladder_types_1.initLadderState;
// ============================================
// 内部工具函数
// ============================================
function pushLog(state, text) {
    return {
        ...state,
        logs: [...state.logs, text],
    };
}
// ============================================
// Reducer - 状态管理核心
// ============================================
/**
 * 真理之梯状态机 Reducer
 * 根据事件更新状态，遵循不可变原则
 */
function reduceLadderEvent(state, event) {
    switch (event.event) {
        case "RESET":
            return (0, ladder_types_1.initLadderState)();
        case "LOG":
            return pushLog(state, event.text);
        case "A_NEW_STEP": {
            const step = (0, ladder_types_1.createStep)("A", event.text, "pending");
            return {
                ...state,
                stairs: [...state.stairs, step],
                auditIndex: Math.max(state.auditIndex, state.stairs.length),
            };
        }
        case "B_VERIFY_STEP": {
            const status = event.result ? "verified" : "debunked";
            const stairs = state.stairs.map((step, index) => {
                if (index !== event.index) {
                    return step;
                }
                return {
                    ...step,
                    status,
                };
            });
            return {
                ...state,
                stairs,
                auditIndex: event.index,
            };
        }
        case "B_DESTROY_STEP": {
            const stairs = state.stairs.filter((_, index) => index !== event.index);
            const nextIndex = stairs.length === 0
                ? -1
                : Math.min(event.index, Math.max(stairs.length - 1, 0));
            return {
                ...state,
                stairs,
                auditIndex: nextIndex,
            };
        }
        case "D_NEW_STEP": {
            const step = (0, ladder_types_1.createStep)("D", event.text, "pending");
            return {
                ...state,
                dStairs: [...state.dStairs, step],
            };
        }
        case "C_INITIAL_CONCLUSION": {
            return {
                ...state,
                initialConclusion: event.conclusion,
            };
        }
        case "C_ABSORB_D": {
            if (state.dStairs.length === 0) {
                return {
                    ...state,
                    cMode: "merged",
                };
            }
            return {
                ...state,
                stairs: [...state.stairs, ...state.dStairs],
                dStairs: [],
                cMode: "merged",
            };
        }
        case "DONE": {
            return {
                ...state,
                finalConclusion: event.text,
            };
        }
        default:
            return state;
    }
}
// ============================================
// 选择器函数 - 派生状态计算
// ============================================
/**
 * 获取指定 agent 的所有台阶（包括主楼梯和侧边楼梯）
 */
function selectAgentSteps(state, agent) {
    const mainSteps = state.stairs.filter((step) => step.agent === agent);
    const sideSteps = state.dStairs.filter((step) => step.agent === agent);
    return [...mainSteps, ...sideSteps];
}
/**
 * 获取已验证的台阶数量
 */
function selectVerifiedCount(state) {
    return state.stairs.filter((step) => step.status === "verified").length;
}
/**
 * 获取被推翻的台阶数量
 */
function selectDebunkedCount(state) {
    return state.stairs.filter((step) => step.status === "debunked").length;
}
/**
 * 判断是否已完成
 */
function selectIsDone(state) {
    return state.cMode === "merged" && state.dStairs.length === 0;
}
