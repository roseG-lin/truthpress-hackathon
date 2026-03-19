"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  FlagTriangleRight,
  MessagesSquare,
  Monitor,
  Sparkles,
  Swords,
  Terminal,
  Send,
  X,
  Zap,
} from "lucide-react";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

import {
  initLadderState,
  reduceLadderEvent,
  type LadderState,
  type LadderEvent,
} from "@/lib/ladder-engine";
import { sseEventToReducerEvent, type SSEEvent } from "@/lib/ladder-types";
import RightPanel from "./RightPanel";

const grotesk = Space_Grotesk({ subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ subsets: ["latin"] });

// ============================================
// 类型定义 - Type Definitions
// ============================================

type LogEntry = {
  id: string;
  time: string;
  text: string;
  tone?: "info" | "success" | "warn" | "danger";
};

// ============================================
// 工具函数 - Utility Functions
// ============================================

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("zh-CN", { hour12: false });
}

function createLog(text: string, tone: LogEntry["tone"] = "info"): LogEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    time: formatTime(),
    text,
    tone,
  };
}

// ============================================
// 动画变体 - Animation Variants
// 基于 Apple HIG Motion + Material 3 Easing
// ============================================

/**
 * Avatar 悬浮脉冲动画
 * 术语：关键帧动画 (Keyframe Animation)
 */
const avatarPulse = {
  initial: { y: 0 },
  animate: {
    y: [0, -6, 0],
    transition: { 
      duration: 1.4, 
      repeat: Infinity, 
      ease: "easeInOut",
      times: [0, 0.5, 1]
    },
  },
};

/**
 * Avatar 活跃状态缩放
 * 术语：属性动画 (Property Animation)
 */
const avatarActive = {
  scale: [1, 1.1, 1],
  transition: { 
    repeat: Infinity, 
    duration: 1,
    ease: "easeInOut"
  },
};

/**
 * 方块掉落动画 - Scene 1: A 的狂想
 * 术语：缓动函数 (Easing Function) - Spring Physics
 * 参考：Apple HIG Spring Animation (stiffness: 300, damping: 20)
 */
const blockDrop = {
  initial: { y: -120, opacity: 0, scale: 0.85 },
  animate: { 
    y: 0, 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 20,
      mass: 1,
      duration: 0.45
    }
  },
  exit: {
    opacity: 0,
    scale: 0.7,
    x: [0, -10, 10, 0],
    transition: { duration: 0.35, ease: "easeInOut" },
  },
};

/**
 * 方块验证通过动画 - Scene 2: B 的审判 (成功)
 * 术语：Morphing 变形 + 颜色渐变
 */
const blockVerified = {
  verified: {
    backgroundColor: ["#3b82f6", "#22c55e"],
    scale: [1, 1.05, 1],
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

/**
 * 方块被推翻动画 - Scene 2: B 的审判 (失败)
 * 术语：震动动画 (Shake) + 破碎消失
 */
const blockDebunked = {
  debunked: {
    x: [0, -8, 8, -8, 8, 0],
    opacity: [1, 1, 1, 0],
    scale: [1, 1, 0.8, 0],
    rotate: [0, 5, -5, 15],
    transition: { duration: 0.6, ease: "easeInOut" },
  },
};

/**
 * D 方块吸收动画 - Scene 3: C 吸收 D
 * 术语：视差滚动 (Parallax) + 交错动画 (Stagger)
 */
const dBlockAbsorb = {
  initial: { x: 0, opacity: 1 },
  absorb: {
    x: -180,
    y: [0, -30, 0],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      ease: "easeInOut",
      y: {
        duration: 0.8,
        repeat: 1,
        ease: "easeInOut",
      },
    },
  },
};

/**
 * C 漩涡效果
 * 术语：旋转动画 + 缩放脉冲
 */
const cVortex = {
  vortex: {
    scale: [1, 1.2, 1],
    rotate: [0, 360],
    transition: { duration: 1, ease: "easeInOut" },
  },
};

// ============================================
// 子组件 - Sub-components
// ============================================

/**
 * Agent 状态卡片
 */
const AgentCard = ({ agent, summary, color }: { agent: string; summary: string; color: string }) => (
  <motion.div
    className="rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/70"
    whileHover={{ 
      scale: 1.02, 
      backgroundColor: "rgba(255,255,255,0.08)",
      transition: { duration: 0.2 }
    }}
  >
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Agent {agent}</span>
      <Sparkles className="h-3.5 w-3.5 text-white/50" />
    </div>
    <p className="mt-2 text-sm text-white">{summary}</p>
  </motion.div>
);

/**
 * 终端日志条目
 */
const LogEntry = ({ entry }: { entry: LogEntry }) => {
  const toneStyles = {
    info: "border-sky-400/20 bg-sky-400/5 text-sky-100",
    success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    warn: "border-amber-400/30 bg-amber-400/10 text-amber-100",
    danger: "border-rose-400/30 bg-rose-400/10 text-rose-100",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-start gap-3"
    >
      <span className="text-[10px] text-white/40">{entry.time}</span>
      <div
        className={`flex-1 rounded-xl border px-3 py-2 ${toneStyles[entry.tone || "info"]}`}
      >
        {entry.text}
      </div>
    </motion.div>
  );
};

// ============================================
// 主组件 - Main Component
// ============================================

export default function LadderArena() {
  const [state, dispatch] = useReducer(
    (s: LadderState, e: LadderEvent) => reduceLadderEvent(s, e),
    initLadderState()
  );
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: "boot", time: "00:00:01", text: "Truth Ladder boot sequence engaged.", tone: "info" },
    { id: "sync", time: "00:00:02", text: "Awaiting A/B/C agents...", tone: "warn" },
  ]);
  const [streamMode, setStreamMode] = useState<"sse" | "sim">("sse");
  const [currentPhase, setCurrentPhase] = useState<"A_BUILD" | "B_CHECK" | "C_MERGE" | "DONE">("A_BUILD");
  const [userInput, setUserInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAbsorbing, setIsAbsorbing] = useState(false); // C 是否正在吸收 D
  const [absorbedBlocks, setAbsorbedBlocks] = useState<any[]>([]); // 存储被吸收的 D 方块用于动画
  const logRef = useRef<HTMLDivElement | null>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const simStartedRef = useRef(false);
  const fallbackTriggeredRef = useRef(false);

  // 计算每个 Agent 的状态
  const agents = useMemo(() => {
    const aBlocks = state.stairs.filter(s => s.agent === "A");
    const bBlocks = state.stairs.filter(s => s.agent === "B");
    const cBlocks = state.stairs.filter(s => s.agent === "C");
    const dBlocks = state.dStairs;

    return {
      A: {
        position: aBlocks.length,
        waiting: currentPhase !== "A_BUILD",
        active: currentPhase === "A_BUILD",
      },
      B: {
        position: bBlocks.length,
        waiting: currentPhase !== "B_CHECK",
        active: currentPhase === "B_CHECK",
      },
      C: {
        position: cBlocks.length,
        waiting: currentPhase !== "C_MERGE",
        active: currentPhase === "C_MERGE",
      },
      D: dBlocks.length > 0 ? {
        position: dBlocks.length,
        waiting: currentPhase !== "C_MERGE",
        active: currentPhase === "C_MERGE",
      } : undefined,
    };
  }, [state, currentPhase]);

  // 合并所有方块用于 RightPanel 显示
  const allBlocks = useMemo(() => {
    return [
      ...state.stairs.map(s => ({ ...s })),
      ...state.dStairs.map(s => ({ ...s })),
    ];
  }, [state.stairs, state.dStairs]);

  const topIndex = state.stairs.length - 1;
  const aPosition = topIndex >= 0 ? topIndex : -1;
  const bPosition = state.auditIndex >= 0 ? state.auditIndex : -1;
  const cAtTop = state.cMode === "merged" && state.stairs.length > 0;

  // 缓存方块样式计算，避免每次渲染重新计算
  const blockStyles = useMemo(() => {
    return state.stairs.map((step, index) => {
      const isVerified = step.status === "verified";
      const isDebunked = step.status === "debunked";
      return {
        background: isVerified
          ? "bg-[#22c55e]/80"
          : isDebunked
            ? "bg-[#dc2626]/80"
            : step.agent === "D"
              ? "bg-[#a855f7]/70"
              : "bg-[#3b82f6]/70",
        isTop: index === aPosition,
        isAudited: index === bPosition,
        isVerified,
        isDebunked,
      };
    });
  }, [state.stairs, aPosition, bPosition]);

  // 自动滚动日志
  useEffect(() => {
    if (!logRef.current) return;
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const appendLog = (entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
  };

  const agentSummary = {
    A: "Dream Builder - 构建论点",
    B: "Reality Auditor - 事实核查",
    C: "Truth Synthesizer - 融合总结",
    D: "Counter Memory - 用户反驳",
  };

  // 提交用户观点
  const handleSubmitUserView = async () => {
    if (!userInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    appendLog(createLog(`USER > 提交观点: ${userInput}`, "info"));

    // 重置状态
    dispatch({ event: "RESET" });
    setCurrentPhase("A_BUILD");
    setLogs([
      { id: "start", time: formatTime(), text: "开始新辩论...", tone: "info" }
    ]);

    // 创建新的 SSE 连接，带上用户观点
    const view = encodeURIComponent(userInput.trim());
    const eventSource = new EventSource(`/api/ladder?view=${view}`);

    let hasReceivedData = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    eventSource.onmessage = (message) => {
      if (!hasReceivedData) {
        hasReceivedData = true;
        appendLog(createLog("STREAM > 已连接到服务器", "success"));
      }
      try {
        const sseEvent = JSON.parse(message.data) as SSEEvent;
        handleSSEEvent(sseEvent);
        setStreamMode("sse");

        // 检查是否完成
        if (sseEvent.event === "DONE") {
          setTimeout(() => {
            eventSource.close();
            setIsSubmitting(false);
          }, 1000);
        }
      } catch {
        appendLog(createLog("STREAM > 数据解析错误", "warn"));
      }
    };

    eventSource.onerror = (e) => {
      console.error("SSE error:", e);
      appendLog(createLog("STREAM > 连接结束", "info"));
      eventSource.close();
      setIsSubmitting(false);
    };

    // 设置超时保护（30秒）
    timeoutId = setTimeout(() => {
      if (!hasReceivedData) {
        appendLog(createLog("STREAM > 连接超时，请重试", "warn"));
        eventSource.close();
        setIsSubmitting(false);
      }
    }, 30000);

    // 保存 cleanup 引用
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      eventSource.close();
    };
  };

  const handleEvent = (event: LadderEvent) => {
    // 在 dispatch 之前保存当前状态
    const prevDStairs = state.dStairs;

    dispatch(event);
    switch (event.event) {
      case "A_NEW_STEP":
        appendLog(createLog(`A_BUILD > ${event.text}`, "info"));
        break;
      case "B_VERIFY_STEP":
        appendLog(
          createLog(
            `B_AUDIT > Step ${event.index + 1} ${event.result ? "VERIFIED ✓" : "REJECTED ✗"}`,
            event.result ? "success" : "danger"
          )
        );
        break;
      case "B_DESTROY_STEP":
        appendLog(createLog(`B_STRIKE > Step ${event.index + 1} removed`, "danger"));
        break;
      case "D_NEW_STEP":
        appendLog(createLog(`D_MEMORY > ${event.text}`, "warn"));
        break;
      case "C_INITIAL_CONCLUSION":
        appendLog(createLog(`C_SYNTHESIS > 初步结论: ${event.conclusion}`, "success"));
        break;
      case "C_ABSORB_D":
        // 保存 D 的方块用于吸收动画
        setAbsorbedBlocks(state.dStairs.map(s => ({ ...s, status: 'merged' as const })));
        setIsAbsorbing(true);
        appendLog(createLog("C_MERGE > C 开始吸收 D 的观点...", "success"));

        // 2.5秒后完成吸收动画
        setTimeout(() => {
          setIsAbsorbing(false);
          setAbsorbedBlocks([]);
          appendLog(createLog("C_MERGE > 吸收完成，C 已融合所有观点", "success"));
        }, 2500);
        break;
      case "DONE":
        // DONE 事件通过 reducer 处理，这里只记录日志
        if ("text" in event) {
          appendLog(createLog(`DONE > ${(event as any).text}`, "success"));
        }
        break;
      default:
        break;
    }
  };

  // 处理 SSE 事件并转换为 reducer 事件
  const handleSSEEvent = (sseEvent: SSEEvent) => {
    const reducerEvent = sseEventToReducerEvent(sseEvent);

    // 根据事件类型更新当前阶段
    switch (sseEvent.event) {
      case "A_NEW_STEP":
        setCurrentPhase("A_BUILD");
        appendLog(createLog(`A_BUILD > ${sseEvent.data.text}`, "info"));
        break;
      case "B_VERIFY":
      case "B_DESTROY":
        setCurrentPhase("B_CHECK");
        if (sseEvent.event === "B_VERIFY") {
          appendLog(
            createLog(
              `B_AUDIT > Step ${(sseEvent.data.index || 0) + 1} ${sseEvent.data.verified ? "VERIFIED ✓" : "REJECTED ✗"}`,
              sseEvent.data.verified ? "success" : "danger"
            )
          );
        } else {
          appendLog(createLog(`B_STRIKE > Step ${(sseEvent.data.index || 0) + 1} removed`, "danger"));
        }
        break;
      case "C_INITIAL_CONCLUSION":
        setCurrentPhase("C_MERGE");
        appendLog(createLog(`C_SYNTHESIS > 初步结论: ${sseEvent.data.conclusion}`, "success"));
        break;
      case "D_NEW_STEP":
        // 修复：先 dispatch 更新 state.dStairs
        dispatch(reducerEvent);
        setCurrentPhase("C_MERGE");
        appendLog(createLog(`D_MEMORY > ${sseEvent.data.text}`, "warn"));
        return; // 提前返回，避免重复 dispatch
      case "C_MERGE_START":
        setCurrentPhase("C_MERGE");
        appendLog(createLog("C_MERGE > C 开始吸收 D 的观点...", "success"));
        // 保存 D 的方块用于吸收动画
        setAbsorbedBlocks(state.dStairs.map(s => ({ ...s, status: 'merged' as const })));
        setIsAbsorbing(true);
        // 2.5秒后完成吸收动画
        setTimeout(() => {
          setIsAbsorbing(false);
          setAbsorbedBlocks([]);
          appendLog(createLog("C_MERGE > 吸收完成，C 已融合所有观点", "success"));
        }, 2500);
        break;
      case "DONE":
        setCurrentPhase("DONE");
        // DONE 事件通过 sseEventToReducerEvent 转换后由 reducer 处理
        appendLog(createLog(`DONE > ${sseEvent.data.summary || "辩论完成"}`, "success"));
        break;
      default:
        break;
    }

    // 转换并调度 reducer 事件
    dispatch(reducerEvent);
  };

  // 模拟辩论序列 - 知乎经典问题："工作是选喜欢的还是选薪资高的？"
  const runSimulation = () => {
    if (simStartedRef.current) return;
    simStartedRef.current = true;
    setStreamMode("sim");

    const sequence: Array<{ delay: number; payload: LadderEvent; phase?: string }> = [
      // === Agent A: 辩护方（选喜欢的） ===
      { delay: 500, payload: { event: "A_NEW_STEP", text: "做自己喜欢的工作，每天早上醒来都充满期待" }, phase: "A_BUILD" },
      { delay: 1200, payload: { event: "A_NEW_STEP", text: "热爱驱动下更容易深耕专业，成为行业顶尖" }, phase: "A_BUILD" },
      { delay: 1900, payload: { event: "A_NEW_STEP", text: "兴趣是最好的老师，工作幸福感直接影响生活质量" }, phase: "A_BUILD" },
      { delay: 2600, payload: { event: "A_NEW_STEP", text: "喜欢的工作更有创造力，更容易做出成绩" }, phase: "A_BUILD" },
      { delay: 3300, payload: { event: "A_NEW_STEP", text: "人生苦短，把时间浪费在不开心的事上太可惜" }, phase: "A_BUILD" },

      // === Agent B: 反对方（选薪资高的） ===
      { delay: 4200, payload: { event: "B_VERIFY_STEP", index: 0, result: true }, phase: "B_CHECK" },
      { delay: 4600, payload: { event: "B_DESTROY_STEP", index: 1 }, phase: "B_CHECK" },
      { delay: 5000, payload: { event: "B_VERIFY_STEP", index: 2, result: true }, phase: "B_CHECK" },
      { delay: 5400, payload: { event: "B_DESTROY_STEP", index: 3 }, phase: "B_CHECK" },
      { delay: 5800, payload: { event: "B_VERIFY_STEP", index: 4, result: true }, phase: "B_CHECK" },

      // === Agent C: 基于 A+B 生成第一版结论 ===
      { delay: 6800, payload: { event: "C_INITIAL_CONCLUSION", conclusion: "基于 A 和 B 的辩论：选择喜欢的工作可以带来长期满足感和专业成就，但需要考虑现实因素。通过审核的论点表明热情驱动确实更有利于深耕和发展。" }, phase: "C_MERGE" },

      // === Agent D: 用户反驳观点 ===
      { delay: 8000, payload: { event: "D_NEW_STEP", text: "但高薪资可以带来更多自由和选择权" }, phase: "C_MERGE" },
      { delay: 8800, payload: { event: "D_NEW_STEP", text: "先赚钱再追梦也是一种策略" }, phase: "C_MERGE" },
      { delay: 9600, payload: { event: "D_NEW_STEP", text: "很多人的爱好变成工作后就不喜欢了" }, phase: "C_MERGE" },

      // === Agent C: 吸收 D 并输出最终结论 ===
      { delay: 11000, payload: { event: "C_ABSORB_D" }, phase: "C_MERGE" },
      { delay: 15000, payload: { event: "DONE", text: "最终结论：结合 D 的观点，选择工作需要在'热爱'与'现实'之间找到平衡。初期可以选择高薪资积累资本，同时培养兴趣；当有一定基础后转向热爱的领域。理想的状态是让热爱产生价值，让现实成就理想。" }, phase: "DONE" },
    ];

    sequence.forEach((item) => {
      const timer = setTimeout(() => {
        if (item.phase) {
          setCurrentPhase(item.phase as any);
        }
        handleEvent(item.payload);
      }, item.delay);
      timersRef.current.push(timer);
    });
  };

  // 自动运行模拟演示（只在首次加载时）
  useEffect(() => {
    // 延迟启动演示
    const demoTimer = setTimeout(() => {
      if (!fallbackTriggeredRef.current) {
        fallbackTriggeredRef.current = true;
        appendLog(createLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info"));
        appendLog(createLog("DEMO > 演示话题：工作是选喜欢的还是选薪资高的？", "info"));
        appendLog(createLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "info"));
        runSimulation();
      }
    }, 800);

    return () => {
      clearTimeout(demoTimer);
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  return (
    <div className={`min-h-screen bg-[#0a0e16] text-white ${grotesk.className}`}>
          {/* 背景层 - 视差层级 */}
          <div className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#1c2a41,transparent_55%)]" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[55%] bg-[linear-gradient(120deg,rgba(8,12,22,0.95),rgba(8,12,22,0.75))]" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[45%] bg-[radial-gradient(circle_at_top,#0f172a,transparent_65%)]" />
          </div>

          {/* 主内容区 - 响应式栅格 */}
          <div className="relative z-10 mx-auto max-w-7xl w-full px-6 py-6">
            {/* 用户输入区域 - Agent D 的发言框 */}
            <div className="mb-6">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-sm font-bold">D</span>
                  </div>
                  <span className="text-sm text-purple-300">你是 Agent D - 你的观点很重要</span>
                </div>
                <div className="relative">
                  <textarea
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="输入你的观点，让 AI 为你辩论... 例如：远程办公将成为未来主流"
                    className="w-full bg-[#0b1220] border border-purple-500/30 rounded-2xl px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 resize-none"
                    rows={2}
                    disabled={isSubmitting}
                    maxLength={200}
                  />
                  {userInput && (
                    <button
                      onClick={() => setUserInput("")}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs text-gray-500">
                    {userInput.length}/200 字符
                  </div>
                  <button
                    onClick={handleSubmitUserView}
                    disabled={!userInput.trim() || isSubmitting}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      !userInput.trim() || isSubmitting
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-purple-500 text-white hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-500/30'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full"
                        />
                        <span>辩论中...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>发起辩论</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 辩论展示区域 */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            
            {/* Left Panel - Truth Log Terminal */}
            <section className="flex h-[75vh] flex-col rounded-3xl border border-white/10 bg-[#0b1220]/95 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur glass-strong overflow-hidden">
              <header className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                    <Terminal className="h-5 w-5 text-sky-300" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-sky-300">Truth Log</p>
                    <h1 className="text-xl font-semibold">求真社-TRUTHPRESS · 真理之梯</h1>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-200">
                  <Activity className="h-3.5 w-3.5" />
                  {streamMode.toUpperCase()}
                </div>
              </header>

              {/* 日志滚动区 - 事件委托 */}
              <div
                ref={logRef}
                className={`mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-4 text-sm scrollbar-thin ${jetbrains.className}`}
              >
                {logs.map((entry) => (
                  <LogEntry key={entry.id} entry={entry} />
                ))}
              </div>

              {/* Agent 状态网格 */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(["A", "B", "C", "D"] as const).map((agent) => (
                  <AgentCard
                    key={agent}
                    agent={agent}
                    summary={agentSummary[agent]}
                    color={
                      agent === "A" ? "sky" :
                      agent === "B" ? "rose" :
                      agent === "C" ? "violet" :
                      "fuchsia"
                    }
                  />
                ))}
              </div>
            </section>

            {/* Right Panel - 辩论竞技场 */}
            <section className="flex h-[75vh] flex-col rounded-3xl border border-white/10 bg-[#0b1220]/95 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur overflow-hidden">
              <RightPanel
                blocks={allBlocks}
                agents={agents}
                currentPhase={currentPhase}
                dStairs={state.dStairs}
                cMode={state.cMode}
                isAbsorbing={isAbsorbing}
                absorbedBlocks={absorbedBlocks}
                initialConclusion={state.initialConclusion}
                finalConclusion={state.finalConclusion}
              />
            </section>

          </div>
        </div>
      </div>
  );
}
