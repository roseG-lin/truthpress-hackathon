// ============================================
// 求真社-TRUTHPRESS - 真理之梯类型定义
// Ladder Types - TruthPress Type Definitions
// 用于 API 路由、状态机和前端组件之间的事件通信
// ============================================

/**
 * 代理类型标识
 */
export type LadderAgent = "A" | "B" | "C" | "D";

/**
 * 方块状态
 */
export type BlockStatus = "pending" | "verified" | "debunked" | "merged";

/**
 * 辩论阶段
 */
export type PhaseType = "A_BUILD" | "B_CHECK" | "C_MERGE" | "DONE";

/**
 * SSE 事件类型 - API 路由使用
 * 统一的事件格式，支持前后端通信
 */
export type SSEEventType =
  | "A_NEW_STEP"            // Agent A 生成新论点
  | "B_VERIFY"              // Agent B 验证论点通过
  | "B_DESTROY"             // Agent B 推翻论点
  | "C_INITIAL_CONCLUSION"  // Agent C 生成第一版结论（基于 A+B）
  | "D_NEW_STEP"            // Agent D 生成反驳论点
  | "C_MERGE_START"         // Agent C 开始吸收融合 D
  | "C_MERGE_COMPLETE"      // Agent C 完成融合
  | "DONE";                 // 辩论完成

/**
 * SSE 事件数据结构
 */
export interface SSEEventData {
  id?: string;
  text?: string;
  index?: number;
  verified?: boolean;
  blocks?: Array<{ id: string; agent: string; text: string }>;
  summary?: string;
  conclusion?: string; // C 的结论文本
}

/**
 * SSE 完整事件 - API 路由发送到前端
 */
export interface SSEEvent {
  event: SSEEventType;
  data: SSEEventData;
  timestamp: number;
}

/**
 * Reducer 事件类型 - 状态机使用
 * 内部状态管理专用
 */
export type ReducerEventType =
  | "A_NEW_STEP"           // 添加 A 的论点
  | "B_VERIFY_STEP"        // 验证步骤
  | "B_DESTROY_STEP"       // 销毁步骤
  | "C_INITIAL_CONCLUSION" // C 生成第一版结论
  | "D_NEW_STEP"           // 添加 D 的论点
  | "C_ABSORB_D"           // C 吸收 D
  | "RESET"                // 重置状态
  | "LOG"                  // 添加日志
  | "UNKNOWN";             // 未知事件

/**
 * Reducer 事件 - 内部状态管理
 */
export type ReducerEvent =
  | { event: "A_NEW_STEP"; text: string }
  | { event: "B_VERIFY_STEP"; index: number; result: boolean }
  | { event: "B_DESTROY_STEP"; index: number }
  | { event: "C_INITIAL_CONCLUSION"; conclusion: string }
  | { event: "D_NEW_STEP"; text: string }
  | { event: "C_ABSORB_D" }
  | { event: "DONE"; text: string }
  | { event: "RESET" }
  | { event: "LOG"; text: string }
  | { event: "UNKNOWN" };

/**
 * 梯子台阶数据结构
 */
export interface LadderStep {
  id: string;
  agent: LadderAgent;
  text: string;
  status: BlockStatus;
}

/**
 * 梯子整体状态
 */
export interface LadderState {
  stairs: LadderStep[];           // 主梯子的台阶
  dStairs: LadderStep[];          // Agent D 的侧边梯子
  auditIndex: number;             // 当前审查的索引
  cMode: "idle" | "merged";       // Agent C 的状态
  initialConclusion?: string;     // C 的第一版结论（基于 A+B）
  finalConclusion?: string;       // C 的最终结论（吸收 D 后）
  logs: string[];                 // 日志记录
}

/**
 * Agent 状态（用于 UI 显示）
 */
export interface AgentState {
  position: number;   // 当前在第几层
  waiting: boolean;   // 是否等待中
  active: boolean;    // 是否活跃
}

/**
 * 前端日志条目
 */
export interface LogEntry {
  id: string;
  time: string;
  text: string;
  tone?: "info" | "success" | "warn" | "danger";
}

// ============================================
// 工具函数
// ============================================

/**
 * 将 SSE 事件转换为 Reducer 事件
 * 用于前端接收到 SSE 事件后更新本地状态
 */
export function sseEventToReducerEvent(sseEvent: SSEEvent): ReducerEvent {
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
export function createStep(agent: LadderAgent, text: string, status: BlockStatus = "pending"): LadderStep {
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
export function initLadderState(): LadderState {
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
