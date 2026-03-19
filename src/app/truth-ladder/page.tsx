"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  FlagTriangleRight,
  Lightbulb,
  Scale,
  Sparkles,
  User,
  Zap,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  X,
  Loader2,
} from "lucide-react";

import { GameAvatar } from "@/components/ladder/GameAvatar";
import { GameBlock } from "@/components/ladder/GameBlock";
import { Logo } from "@/components/Logo";
import type { AgentType } from "@/components/ladder/game-types";
import { useLadderGame } from "@/components/ladder/useLadderGame";
import { resolveCafeAccess } from "@/lib/cafe-access";
import { buildEmpathyDemoPayload } from "@/lib/empathy-demo";
import type { GenerateResponse } from "@/lib/generate-types";

type UserPayload = {
  secondMeId?: string;
  profiles?: Array<{ displayName?: string }>;
  memorySummary?: string;
  memoryHighlights?: string[];
};

type EmpathyContextUsed = {
  source: "secondme" | "anonymous";
  explanation: string;
  memorySummary?: string;
  memoryHighlights?: string[];
  userBackground?: string;
  fallback?: boolean;
};

type EmpathyResponse = {
  empatheticSupplement?: string;
  source?: "secondme" | "anonymous";
  fallback?: boolean;
  contextUsed?: EmpathyContextUsed;
};

// 智能体分工卡片 - 横向紧凑版
function AgentBadge({
  title,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex flex-1 items-center gap-2.5 rounded-xl border border-slate-200/60 bg-white/70 px-4 py-2.5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${color} shadow-md`}>
        <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-700 truncate">{title}</p>
        <p className="text-[10px] text-slate-500 truncate">{description}</p>
      </div>
    </div>
  );
}

// Hacker Terminal - Agent B 核查时的滚动日志
function HackerTerminal({ logs }: { logs: string[] }) {
  return (
    <div className="rounded-xl border-2 border-green-500/50 bg-black p-3 font-mono text-[10px] shadow-lg shadow-green-500/20">
      <div className="flex items-center gap-2 mb-2 border-b border-green-500/30 pb-2">
        <div className="flex gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
        </div>
        <span className="text-green-500 font-semibold">AGENT_B_TERMINAL</span>
      </div>
      <div className="h-32 overflow-y-auto space-y-1 text-green-400">
        {logs.map((log, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-green-600">{">"}</span>
            <span className="flex-1">{log}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-green-500 animate-pulse">{">"}</span>
          <span className="w-1.5 h-3 bg-green-400 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// 生成结果详情卡片 - 可折叠
function GenerateResultCard({
  result,
  isOpen,
  onToggle,
}: {
  result: GenerateResponse;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span className="text-sm font-semibold text-slate-700">真实生成结果</span>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-xs">
            {result.stages.agentB.verification.length} 个核查点
          </span>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="max-h-80 overflow-y-auto p-4 space-y-4 text-xs">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">A</span>
                  </div>
                  <span className="font-semibold text-slate-700">Agent A · 发散思考</span>
                </div>
                <p className="text-slate-600 leading-relaxed pl-6">{result.stages.agentA.output}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">B</span>
                  </div>
                  <span className="font-semibold text-slate-700">Agent B · 联网核查</span>
                </div>
                <div className="space-y-1.5 pl-6">
                  {result.stages.agentB.verification.map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          item.result === "verified" ? "bg-emerald-500" : 
                          item.result === "debunked" ? "bg-rose-500" : "bg-amber-500"
                        }`} />
                        <p className="font-medium text-slate-700 text-[11px]">{item.claim}</p>
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-slate-500 ml-3.5">{item.result}</p>
                      {item.evidence && <p className="mt-1 text-[10px] leading-4 text-slate-500 ml-3.5">{item.evidence}</p>}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">C</span>
                  </div>
                  <span className="font-semibold text-slate-700">Agent C · 总结优化</span>
                </div>
                <p className="text-slate-600 leading-relaxed pl-6">{result.stages.agentC.output}</p>
              </div>
              
              {result.stages.agentD?.output && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white">D</span>
                    </div>
                    <span className="font-semibold text-slate-700">Agent D · 共情桥梁</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed pl-6">{result.stages.agentD?.output}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TruthLadderPage() {
  const {
    gameState,
    activeBlock,
    mergingBlocks,
    showConfetti,
    auditPulseKey,
    buildBlock,
    auditBlock,
    challengeBlock,
    mergeStacks,
    setInitialConclusion,
    resetGame,
  } = useLadderGame();

  const [user, setUser] = useState<UserPayload | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [simulationStarted, setSimulationStarted] = useState(false);
  const [opinionInput, setOpinionInput] = useState("");
  const [dissentInput, setDissentInput] = useState("");
  const [generateResult, setGenerateResult] = useState<GenerateResponse | null>(null);
  const [isFlowRunning, setIsFlowRunning] = useState(false);
  const [generatingStep, setGeneratingStep] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showEmpathyModal, setShowEmpathyModal] = useState(false);
  const [empathyFeedback, setEmpathyFeedback] = useState("");
  const [empathyBackground, setEmpathyBackground] = useState("");
  const [empathyResult, setEmpathyResult] = useState("");
  const [empathyContextUsed, setEmpathyContextUsed] = useState<EmpathyContextUsed | null>(null);
  const [empathyError, setEmpathyError] = useState("");
  const [isEmpathyPending, setIsEmpathyPending] = useState(false);
  const [showResultDetails, setShowResultDetails] = useState(false);

  const access = resolveCafeAccess(user);
  const wait = useCallback((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)), []);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => {
        if (!res.ok) {
          return null;
        }
        return (await res.json()) as { user?: UserPayload | null };
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsProfileLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isProfileLoading || access.mode !== "demo" || simulationStarted) {
      return;
    }

    setSimulationStarted(true);

    const runSimulation = async () => {
      const claim1 = "AI 可以提供全天候辅导支持。";
      const claim2 = "AI 可以根据每个学习者调整解释方式。";

      await buildBlock(claim1);
      await wait(500);
      await buildBlock(claim2);
      await wait(700);
      await auditBlock(claim1, "verified");
      await wait(500);
      await auditBlock(claim2, "debunked");
      await wait(700);
      const initialSummary =
        "阶段总结：AI 能扩大支持覆盖面，但个性化效果和教育公平仍取决于实际部署。";
      setInitialConclusion(initialSummary);
      await wait(700);
      await challengeBlock("教育仍然依赖于信任和人文环境。");
      await wait(700);
      let finalConclusion = initialSummary;
      try {
        const response = await fetch("/api/empathy-v2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildEmpathyDemoPayload(initialSummary)),
        });

        if (response.ok) {
          const data = (await response.json()) as EmpathyResponse;
          if (data?.empatheticSupplement) {
            finalConclusion = data.empatheticSupplement;
          }
          if (data?.contextUsed) {
            setEmpathyContextUsed(data.contextUsed);
          }
        }
      } catch {}

      await mergeStacks(finalConclusion);
    };

    runSimulation();
  }, [
    access.mode,
    auditBlock,
    buildBlock,
    challengeBlock,
    isProfileLoading,
    mergeStacks,
    setInitialConclusion,
    simulationStarted,
    wait,
  ]);

  const resetAll = useCallback(() => {
    setDissentInput("");
    setEmpathyBackground("");
    setEmpathyError("");
    setEmpathyFeedback("");
    setEmpathyContextUsed(null);
    setEmpathyResult("");
    setGenerateResult(null);
    setShowResultDetails(false);
    setIsFlowRunning(false);
    setGeneratingStep(null);
    setTerminalLogs([]);
    setShowTerminal(false);
    setShowEmpathyModal(false);
    resetGame();
  }, [resetGame]);

  const handleOpinionSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!access.canInput || isFlowRunning) {
      return;
    }

    const trimmed = opinionInput.trim();
    if (!trimmed) {
      return;
    }

    setIsFlowRunning(true);
    setEmpathyContextUsed(null);
    setEmpathyError("");
    setEmpathyResult("");
    setGenerateResult(null);
    setShowResultDetails(false);
    setDissentInput("");
    resetGame();
    await wait(300);

    try {
      // 使用流式 API
      const response = await fetch("/api/generate-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: trimmed,
          userId: user?.secondMeId || "anonymous",
        }),
      });

      if (!response.ok) {
        setEmpathyError("生成流程失败，请稍后再试。");
        setGeneratingStep(null);
        setIsFlowRunning(false);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        setEmpathyError("响应格式错误");
        setIsFlowRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      // 临时存储各阶段结果
      let agentAClaims: string[] = [];
      let agentBVerification: any[] = [];
      let agentCOutput = "";
      let currentEvent = ""; // 跟踪当前事件类型

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              handleStreamEvent(currentEvent, data, {
                onAgentA: async (output: string, claims: string[]) => {
                  setGeneratingStep(null);
                  agentAClaims = claims;
                  // 显示 A 的观点块
                  for (const claim of claims) {
                    await buildBlock(claim);
                    await wait(200);
                  }
                },
                onAgentB: async (verification: any[]) => {
                  agentBVerification = verification;
                  // 显示 Hacker Terminal 并开始生成日志
                  setShowTerminal(true);

                  // 生成假日志来缓解等待
                  const fakeLogs = [
                    "Initializing verification protocol...",
                    `Parsing ${agentAClaims.length} claim(s) from Agent A...`,
                    "Connecting to neural search nodes...",
                    "Extracting atomic propositions...",
                    "Loading fact-check database...",
                    "Cross-referencing knowledge graph...",
                    "Analyzing logical consistency...",
                    "Computing confidence scores...",
                    "Validating source credibility...",
                  ];

                  // 快速显示初始日志
                  for (const log of fakeLogs) {
                    setTerminalLogs((prev) => [...prev, log]);
                    await wait(80);
                  }

                  // 从后往前处理，避免索引问题
                  for (let i = verification.length - 1; i >= 0; i--) {
                    const claim = agentAClaims[i] || `Claim ${i + 1}`;
                    const result = verification[i].result || "uncertain";

                    setTerminalLogs((prev) => [...prev, `> Verifying: "${claim.slice(0, 30)}..."`]);
                    setTerminalLogs((prev) => [...prev, `> Querying search index...`]);
                    setTerminalLogs((prev) => [...prev, `> Analyzing ${verification[i].evidence?.slice(0, 50) || "evidence"}...`]);
                    setTerminalLogs((prev) => [...prev, `> Confidence: ${result}`]);
                    setTerminalLogs((prev) => [...prev, `> Result: ${result === "verified" ? "VERIFIED" : result === "debunked" ? "DEBUNKED" : "UNCERTAIN"}`]);

                    await wait(300);
                    // 传入 claim 的 text 而不是索引
                    await auditBlock(claim, result);
                  }

                  setTerminalLogs((prev) => [...prev, "> Verification complete."]);
                  await wait(500);
                  setShowTerminal(false);
                },
                onAgentC: async (output: string) => {
                  agentCOutput = output;
                  await wait(500);
                  setInitialConclusion(output);
                },
                onComplete: (fullResult: GenerateResponse) => {
                  setGenerateResult(fullResult);
                  setShowResultDetails(true);
                  setGeneratingStep(null);
                },
                onError: (error: string) => {
                  setEmpathyError(error || "生成流程失败，请稍后再试。");
                  setGeneratingStep(null);
                },
              });
            } catch (e) {
              console.error("Failed to parse SSE data:", e);
            }
            currentEvent = ""; // 重置事件类型
          }
        }
      }
    } catch (error) {
      console.error("Generate error:", error);
      setEmpathyError("生成流程失败，请稍后再试。");
      setGeneratingStep(null);
    } finally {
      setIsFlowRunning(false);
    }
  };

  // 处理 SSE 事件
  function handleStreamEvent(
    eventType: string,
    data: any,
    handlers: {
      onAgentA: (output: string, claims: string[]) => Promise<void>;
      onAgentB: (verification: any[]) => Promise<void>;
      onAgentC: (output: string) => Promise<void>;
      onComplete: (result: GenerateResponse) => void;
      onError: (error: string) => void;
    },
  ) {
    if (eventType === "stage") {
      if (data.agent === "A") setGeneratingStep("Agent A 正在发散思考...");
      if (data.agent === "B") setGeneratingStep("Agent B 正在联网核查...");
      if (data.agent === "C") setGeneratingStep("Agent C 正在综合结论...");
    } else if (eventType === "agentA" && data.status === "completed") {
      handlers.onAgentA(data.output, data.claims || []);
    } else if (eventType === "agentB" && data.status === "completed") {
      handlers.onAgentB(data.verification || []);
    } else if (eventType === "agentC" && data.status === "completed") {
      handlers.onAgentC(data.output);
    } else if (eventType === "complete") {
      handlers.onComplete(data);
    } else if (eventType === "error") {
      handlers.onError(data);
    }
  }

  const handleDissentSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!access.canInput || isFlowRunning) {
      return;
    }

    const trimmed = dissentInput.trim();
    const baseSummary = gameState.conclusion?.initial;
    if (!trimmed || !baseSummary) {
      return;
    }

    setIsFlowRunning(true);
    setEmpathyError("");
    setEmpathyContextUsed(null);
    setEmpathyResult("");

    try {
      await challengeBlock(trimmed);
      await wait(600);

      let finalConclusion = baseSummary;
      const response = await fetch("/api/empathy-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalContent: baseSummary,
          userFeedback: trimmed,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as EmpathyResponse;
        const supplement = data?.empatheticSupplement?.trim();
        if (supplement) {
          finalConclusion = supplement;
          setGenerateResult((prev) =>
            prev
              ? {
                  ...prev,
                  stages: {
                    ...prev.stages,
                    agentD: {
                      status: "completed",
                      output: supplement,
                    },
                  },
                  finalContent: supplement,
                }
              : prev,
          );
        }
        if (data?.contextUsed) {
          setEmpathyContextUsed(data.contextUsed);
        }
      } else {
        setEmpathyError("共情生成失败，请稍后再试。");
      }

      await mergeStacks(finalConclusion);
    } catch {
      setEmpathyError("网络异常，请稍后再试。");
    } finally {
      setIsFlowRunning(false);
    }
  };

  const handleEmpathySubmit = async () => {
    if (!gameState.conclusion?.final || isEmpathyPending) {
      return;
    }

    setEmpathyError("");
    setIsEmpathyPending(true);

    try {
      const response = await fetch("/api/empathy-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalContent: gameState.conclusion.final,
          userFeedback: empathyFeedback,
          userBackground: empathyBackground,
        }),
      });

      const payload = (await response.json()) as EmpathyResponse & { error?: string };
      if (!response.ok) {
        if (payload?.error === "BACKGROUND_REQUIRED") {
          setEmpathyError("匿名用户需要填写一句背景。");
        } else if (payload?.error === "MISSING_FIELDS") {
          setEmpathyError("请填写反馈内容后再提交。");
        } else {
          setEmpathyError("共情补充生成失败，请稍后再试。");
        }
        return;
      }

      setEmpathyResult(payload?.empatheticSupplement || "");
      setEmpathyContextUsed(payload?.contextUsed || null);
      setShowEmpathyModal(false);
    } catch (error) {
      setEmpathyError(error instanceof Error ? error.message : "网络异常，请稍后再试。");
    } finally {
      setIsEmpathyPending(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-[1600px] px-4 py-4">
        {/* 导航栏 */}
        <nav className="sticky top-0 z-30 mb-4 flex items-center justify-between rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-2.5 backdrop-blur-xl shadow-sm">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-slate-600 transition-all hover:text-slate-900 hover:bg-slate-100 rounded-xl px-3 py-1.5">
            <ArrowLeft className="h-4 w-4" />
            返回首页
          </Link>

          <Logo size="sm" withText={true} />

          {isProfileLoading ? (
            <div className="h-8 w-16 animate-pulse rounded-full bg-slate-200" />
          ) : access.showLogin ? (
            <Link
              href="/api/auth/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
            >
              <User className="h-4 w-4" />
              登录
            </Link>
          ) : (
            <span className="text-xs text-slate-600">
              {user?.profiles?.[0]?.displayName || user?.secondMeId?.slice(0, 8) || "用户"}
            </span>
          )}
        </nav>

        {/* 顶部区域：标题 + 智能体分工 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1">
                <Zap className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-violet-700">LIVE</span>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-slate-900">真理之梯</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {access.mode === "interactive" ? "已登录 · 完整功能可用" : "演示模式 · 登录后解锁完整功能"}
              </p>
            </div>
            
            <button
              onClick={resetAll}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
            >
              重置
            </button>
          </div>

          {/* 智能体分工 - 横向排列 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            <AgentBadge 
              title="Agent A · 发散思考" 
              description="扩展论据与观察角度" 
              icon={Brain} 
              color="from-blue-500 to-blue-600" 
            />
            <AgentBadge 
              title="Agent B · 联网核查" 
              description="只判对错，不扩展新观点" 
              icon={CheckCircle2} 
              color="from-red-500 to-red-600" 
            />
            <AgentBadge 
              title="Agent C · 总结优化" 
              description="只基于核查结果输出结论" 
              icon={Scale} 
              color="from-violet-500 to-violet-600" 
            />
            <AgentBadge 
              title="Agent D · 共情桥梁" 
              description="按记忆或背景补充表达" 
              icon={Lightbulb} 
              color="from-amber-500 to-amber-600" 
            />
          </div>
        </div>

        {/* 操作流程介绍 */}
        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Sparkles className="h-4 w-4 text-violet-600" />
            操作流程
          </h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-blue-50 to-slate-50 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-sm">1</div>
                <h3 className="text-xs font-semibold text-slate-700">输入观点</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                在 Agent A 上方输入观点，点击"开始"启动流程
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-red-50 to-slate-50 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">2</div>
                <h3 className="text-xs font-semibold text-slate-700">核查验证</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Agent A 发散 → Agent B 核查 → 观察验证结果
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-violet-50 to-slate-50 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white shadow-sm">3</div>
                <h3 className="text-xs font-semibold text-slate-700">生成结论</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                Agent C 基于核查结果输出最终结论
              </p>
            </div>

            <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-amber-50 to-slate-50 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-sm">4</div>
                <h3 className="text-xs font-semibold text-slate-700">共情补充</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600">
                有不同意见可让 Agent D 补充表达
              </p>
            </div>
          </div>
        </section>

        {/* 主内容区：左侧梯子 + 右侧面板 */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">
          {/* 左侧：梯子动画区 */}
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="absolute left-5 top-5 flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">当前阶段：</span>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">{gameState.phase}</span>
            </div>

            {showConfetti && (
              <div className="pointer-events-none absolute inset-0 rounded-3xl border-2 border-amber-300 bg-amber-50/30" />
            )}

            <div className="mt-10 grid h-[520px] grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {(["A", "B", "C", "D"] as AgentType[]).map((agent) => {
                const laneBlocks = gameState.stacks[agent];
                const laneLabel =
                  agent === "A"
                    ? "Dream Builder"
                    : agent === "B"
                    ? "Reality Auditor"
                    : agent === "C"
                    ? "Truth Synthesizer"
                    : "Empathy Bridge";

                return (
                  <div key={agent} className="flex h-full flex-col">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">Agent {agent}</span>
                      <span className="text-[9px] text-slate-400">{laneLabel}</span>
                    </div>

                    {agent === "A" && (
                      <div className="mb-2">
                        {access.canInput ? (
                          <form onSubmit={handleOpinionSubmit} className="flex gap-1.5">
                            <input
                              value={opinionInput}
                              onChange={(event) => setOpinionInput(event.target.value)}
                              placeholder="输入观点"
                              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                              disabled={isFlowRunning}
                            />
                            <button
                              type="submit"
                              className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                              disabled={isFlowRunning || !opinionInput.trim()}
                            >
                              开始
                            </button>
                          </form>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] text-slate-500">
                            演示模式
                          </div>
                        )}
                      </div>
                    )}

                    <div className="relative flex-1 overflow-y-auto overflow-x-hidden rounded-2xl border border-slate-100 bg-slate-50/50 shadow-inner">
                      <div className="absolute bottom-2 left-2 right-2 h-0.5 rounded-full bg-slate-200" />

                      {agent === "B" && auditPulseKey && (
                        <motion.div
                          key={auditPulseKey}
                          initial={{ scale: 0.4, opacity: 0.6 }}
                          animate={{ scale: 1.4, opacity: 0 }}
                          transition={{ duration: 1.1, ease: "easeOut" }}
                          className="pointer-events-none absolute inset-6 rounded-full border-2 border-red-300/50"
                        />
                      )}

                      <div className="absolute bottom-5 left-0 right-0 z-10 flex flex-col-reverse gap-2 px-2">
                        {laneBlocks.map((block, index) => (
                          <div key={block.id} className="relative">
                            <GameBlock
                              block={block}
                              index={index}
                              isActive={activeBlock === block.id}
                              isMerging={mergingBlocks.includes(block.id)}
                            />
                            {gameState.agentPositions[agent].stackIndex === index && (
                              <div className="absolute -top-12 left-1/2 z-20 -translate-x-1/2 scale-90">
                                <GameAvatar
                                  agent={agent}
                                  position={gameState.agentPositions[agent]}
                                  isActive={false}
                                  isWaiting={false}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {gameState.agentPositions[agent].stackIndex === -1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center scale-90">
                          <GameAvatar
                            agent={agent}
                            position={gameState.agentPositions[agent]}
                            isActive={false}
                            isWaiting
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 右侧：控制面板 */}
          <aside className="space-y-3">
            {/* 输入/反馈区 */}
            {access.canInput ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-amber-600" />
                  <h3 className="text-sm font-semibold text-slate-700">不同点 / 反馈</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Agent C 输出结论后，提交不同点让 Agent D 补充表达
                </p>
                <form onSubmit={handleDissentSubmit} className="space-y-2">
                  <textarea
                    value={dissentInput}
                    onChange={(event) => setDissentInput(event.target.value)}
                    placeholder="写下你的不同意之处或希望被理解的感受"
                    className="min-h-[70px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
                    disabled={isFlowRunning || !gameState.conclusion?.initial}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:shadow-md disabled:opacity-50"
                    disabled={isFlowRunning || !gameState.conclusion?.initial || !dissentInput.trim()}
                  >
                    启动 D 共情
                  </button>
                </form>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  登录后即可输入观点并体验完整的 A/B/C 生成流程
                </p>
              </div>
            )}

            {/* 用户记忆 */}
            {access.canInput && (user?.memorySummary || (user?.memoryHighlights || []).length > 0) && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-slate-700 mb-2">Agent D 可用记忆</h3>
                {user?.memorySummary && (
                  <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 mb-2">{user.memorySummary}</p>
                )}
                {(user?.memoryHighlights || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(user?.memoryHighlights || []).map((item) => (
                      <span key={item} className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] text-amber-900">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hacker Terminal - Agent B 核查时显示 */}
            {showTerminal && terminalLogs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <HackerTerminal logs={terminalLogs} />
              </motion.div>
            )}

            {/* 生成状态提示 - 非 Agent B 时显示 */}
            {generatingStep && !showTerminal && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-violet-600 animate-spin" />
                  <div>
                    <p className="text-xs font-semibold text-violet-700">正在思考中</p>
                    <p className="text-[11px] text-violet-600">{generatingStep}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 生成结果详情 - 可折叠 */}
            {generateResult && (
              <GenerateResultCard
                result={generateResult}
                isOpen={showResultDetails}
                onToggle={() => setShowResultDetails(!showResultDetails)}
              />
            )}

            {/* 最终输出 */}
            {gameState.conclusion?.final && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FlagTriangleRight className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700">最终输出</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-800">{gameState.conclusion.final}</p>
                
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowEmpathyModal(true)}
                    className="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100"
                  >
                    我不认同 / 希望被理解
                  </button>
                </div>
                
                {empathyResult && (
                  <div className="mt-3 rounded-xl border border-amber-200/60 bg-white/70 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-600">共情补充</p>
                    <p className="mt-2 text-xs leading-relaxed text-amber-900">{empathyResult}</p>
                  </div>
                )}
                
                {empathyContextUsed && (
                  <div className="mt-3 rounded-xl border border-sky-200 bg-white/70 p-3">
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-sky-600">本次共情依据</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-700">{empathyContextUsed.explanation}</p>
                    {empathyContextUsed.memorySummary && (
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 bg-slate-50 rounded-lg p-2">
                        {empathyContextUsed.memorySummary}
                      </p>
                    )}
                    {(empathyContextUsed.memoryHighlights || []).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {(empathyContextUsed.memoryHighlights || []).map((item) => (
                          <span key={item} className="rounded-full bg-white px-2 py-0.5 text-[9px] text-sky-700">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {empathyError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {empathyError}
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* 共情模态框 */}
      {showEmpathyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">Empathy Bridge</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-900">告诉我你为什么不认同</h3>
              </div>
              <button
                onClick={() => setShowEmpathyModal(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-700">你的反馈</span>
                <textarea
                  value={empathyFeedback}
                  onChange={(event) => setEmpathyFeedback(event.target.value)}
                  className="min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white resize-none"
                  placeholder="例如：这段话太理性了，没有体现我的处境。"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-700">一句话背景（匿名用户需要）</span>
                <input
                  value={empathyBackground}
                  onChange={(event) => setEmpathyBackground(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white"
                  placeholder="例如：我来自教育资源较少的地区。"
                />
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleEmpathySubmit}
                disabled={isEmpathyPending || !empathyFeedback.trim()}
                className="flex-1 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                {isEmpathyPending ? "生成中..." : "生成共情补充"}
              </button>
              <button
                onClick={() => setShowEmpathyModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
