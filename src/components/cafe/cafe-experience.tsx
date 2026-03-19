"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { generateDebateRound } from "@/app/actions/debate";
import {
  ARENA_STAGE_COUNT,
  getArenaProgress,
  getArenaStageDescription,
  getArenaStageLabel,
  getArenaVisibility,
} from "@/lib/cafe-stage";
import { getDebateTimeline } from "@/lib/debate-timeline";
import { getEvidenceStrength, getVerdictAccent, summarizeWinningSide } from "@/lib/truth-console";
import { type DebateRoundResult } from "@/lib/types";

type MatchPayload = Awaited<ReturnType<typeof generateDebateRound>>;

const DEFAULT_TOPIC = "AI 应该取代教师";
const DEFAULT_STANCE =
  "AI 应该在课堂的大量环节中取代教师，因为它比负担过重的教育系统更容易规模化地提供个性化学习支持。";

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="h-16 w-16 rounded-2xl object-cover" />;
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-500/15 text-xl font-semibold text-sky-600">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function VerdictTone({ verdict }: { verdict: DebateRoundResult["judge"]["verdict"] }) {
  const styles = {
    supported: "border-emerald-200 bg-emerald-100 text-emerald-700",
    mixed: "border-amber-200 bg-amber-100 text-amber-700",
    unsupported: "border-rose-200 bg-rose-100 text-rose-700",
    uncertain: "border-slate-200 bg-slate-100 text-slate-700",
  } as const;

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${styles[verdict]}`}>
      {verdict}
    </span>
  );
}

function ConfidenceBadge({ strength }: { strength: "strong" | "medium" | "weak" }) {
  const styles = {
    strong: "border-emerald-200 bg-emerald-100 text-emerald-700",
    medium: "border-amber-200 bg-amber-100 text-amber-700",
    weak: "border-slate-200 bg-slate-100 text-slate-700",
  } as const;

  const labels = {
    strong: "强证据",
    medium: "中证据",
    weak: "弱证据",
  } as const;

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${styles[strength]}`}>
      {labels[strength]}
    </span>
  );
}

export function CafeExperience() {
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [stanceText, setStanceText] = useState(DEFAULT_STANCE);
  const [result, setResult] = useState<MatchPayload | null>(null);
  const [error, setError] = useState("");
  const [arenaStage, setArenaStage] = useState(0);
  const [isPending, startTransition] = useTransition();
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const [showEmpathyModal, setShowEmpathyModal] = useState(false);
  const [empathyFeedback, setEmpathyFeedback] = useState("");
  const [empathyBackground, setEmpathyBackground] = useState("");
  const [empathyResult, setEmpathyResult] = useState("");
  const [empathyError, setEmpathyError] = useState("");
  const [isEmpathyPending, setIsEmpathyPending] = useState(false);

  const stage = useMemo(() => {
    if (isPending) {
      return "loading";
    }
    if (result) {
      return "arena";
    }
    return "lobby";
  }, [isPending, result]);

  const arenaVisibility = useMemo(() => getArenaVisibility(arenaStage), [arenaStage]);
  const arenaProgress = useMemo(() => getArenaProgress(arenaStage), [arenaStage]);
  const debateTimeline = useMemo(() => getDebateTimeline(arenaStage), [arenaStage]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  useEffect(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current = [];

    if (!result) {
      setArenaStage(0);
      setShowEmpathyModal(false);
      setEmpathyFeedback("");
      setEmpathyBackground("");
      setEmpathyResult("");
      setEmpathyError("");
      return;
    }

    setArenaStage(0);
    setShowEmpathyModal(false);
    setEmpathyFeedback("");
    setEmpathyBackground("");
    setEmpathyResult("");
    setEmpathyError("");

    for (let stageIndex = 1; stageIndex < ARENA_STAGE_COUNT; stageIndex += 1) {
      const timer = setTimeout(() => {
        setArenaStage(stageIndex);
      }, stageIndex * 900);
      timersRef.current.push(timer);
    }

    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
    };
  }, [result]);

  const handleMatchmaking = () => {
    setError("");
    setResult(null);
    startTransition(async () => {
      try {
        const nextResult = await generateDebateRound({ topic, stanceText });
        setResult(nextResult);
      } catch (nextError) {
        setResult(null);
        setError(nextError instanceof Error ? nextError.message : "启动辩论失败，请稍后再试。");
      }
    });
  };

  const handleEmpathySubmit = async () => {
    if (!result || isEmpathyPending) {
      return;
    }

    setEmpathyError("");
    setIsEmpathyPending(true);

    try {
      const response = await fetch("/api/empathy-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalContent: result.round.judge.summary,
          userFeedback: empathyFeedback,
          userBackground: empathyBackground,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        if (payload?.error === "BACKGROUND_REQUIRED") {
          setEmpathyError("未登录用户需要填写一句背景（例如你的经历或关切点）。");
        } else if (payload?.error === "MISSING_FIELDS") {
          setEmpathyError("请填写反馈内容后再提交。");
        } else {
          setEmpathyError("共情补充生成失败，请稍后再试。");
        }
        return;
      }

      setEmpathyResult(payload?.empatheticSupplement || "");
      setShowEmpathyModal(false);
    } catch (submitError) {
      setEmpathyError(submitError instanceof Error ? submitError.message : "网络异常，请稍后再试。");
    } finally {
      setIsEmpathyPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#eff6ff,white_40%,#f8fafc)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-10">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-[0_30px_120px_rgba(15,23,42,0.08)] backdrop-blur">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600">共识引擎</span>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-semibold text-slate-900">Agent 求真报社 · 辩论咖啡馆</h1>
              <p className="mt-2 max-w-3xl text-slate-600">
                输入一个有争议的观点，系统会为你匹配值得交锋的对手，再由多智能体求真流水线替双方辩论并进行中立核查。
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              流程：大厅 → 匹配器 → 用户辩手 → 对手辩手 → 裁判控制台
            </div>
          </div>
        </header>

        {stage === "lobby" && (
          <section className="grid flex-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/60 bg-white/95 p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500">大厅</span>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">输入你的争议观点</h2>
              <p className="mt-2 text-slate-600">
                系统会先寻找真实存在的反方声音；如果暂时没有合适对手，DeepSeek 会生成一个可信的网络人格，让辩论照样开始。
              </p>

              <div className="mt-8 space-y-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">议题标题</span>
                  <input
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    placeholder="例如：AI 应该取代教师"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">你的观点</span>
                  <textarea
                    value={stanceText}
                    onChange={(event) => setStanceText(event.target.value)}
                    className="min-h-[220px] w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    placeholder="告诉擂台你相信什么，以及为什么。"
                  />
                </label>
              </div>

              {error && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

              <button
                onClick={handleMatchmaking}
                disabled={isPending}
                className="mt-8 inline-flex items-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                寻找对手
              </button>
            </div>

            <div className="grid gap-6">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_20px_80px_rgba(15,23,42,0.18)]">
                <span className="text-xs uppercase tracking-[0.35em] text-sky-300">玩法说明</span>
                <div className="mt-5 space-y-4 text-sm text-slate-300">
                  <p>1. 你的观点会先写入本地共识池。</p>
                  <p>2. 匹配器会扫描是否已有概念上相反的立场。</p>
                  <p>3. 如果没有真人匹配，就生成合成对手人格。</p>
                  <p>4. Agent A、Agent B 与 Judge C 会依次完成辩论与核查。</p>
                </div>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8">
                <span className="text-xs uppercase tracking-[0.35em] text-slate-400">为什么重要</span>
                <h3 className="mt-4 text-2xl font-semibold text-slate-900">当分歧被清楚展示时，共识才更值得信任。</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  SecondMe 提供身份与社交语境，求真社-TRUTHPRESS 提供结构化冲突、证据核查，以及能总结谁更经得起审视的裁判体系。
                </p>
              </div>
            </div>
          </section>
        )}

        {stage === "loading" && (
          <section className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-3xl rounded-[2.5rem] border border-sky-100 bg-white/95 p-14 text-center shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-sky-200 bg-sky-50">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-500" />
              </div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.35em] text-sky-500">正在扫描人群</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">正在寻找值得交锋的对手……</h2>
              <p className="mt-3 text-slate-600">
                系统正在把你的立场与历史观点匹配，同时准备双方开场陈词并预热中央求真控制台。
              </p>
            </div>
          </section>
        )}

        {stage === "arena" && result && (
          <section className="flex-1 space-y-6">
            <div
              className={`flex flex-col gap-3 rounded-[2rem] border border-emerald-200 bg-emerald-50 p-6 transition duration-500 lg:flex-row lg:items-center lg:justify-between ${
                arenaVisibility.matchBanner ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-600">匹配成功</p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">{result.round.topic}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  对手来源：<span className="font-medium text-slate-900">{result.matchSource}</span>
                </p>
                <p className="mt-3 text-sm font-medium text-emerald-700">{getArenaStageLabel(arenaStage)}</p>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">{getArenaStageDescription(arenaStage)}</p>
                <div className="mt-4 max-w-xl">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <span>擂台进度</span>
                    <span>{arenaProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-500 to-violet-500 transition-all duration-700"
                      style={{ width: `${arenaProgress}%` }}
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setResult(null);
                  setError("");
                }}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                返回大厅
              </button>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr_1fr]">
              <article
                className={`rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)] transition duration-500 ${
                  arenaVisibility.userPanel ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
              >
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">用户</span>
                <div className="mt-4 flex items-center gap-4">
                  <Avatar name={result.round.user.name} avatarUrl={result.round.user.avatarUrl} />
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{result.round.user.name}</h3>
                    <p className="text-sm text-slate-500">原始观点持有者</p>
                  </div>
                </div>
                <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {result.round.user.stance}
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-900">Agent A 开场陈词</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{result.round.transcript.userArgument}</p>
                </div>
              </article>

              <article
                className={`rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_80px_rgba(15,23,42,0.18)] transition duration-500 ${
                  arenaVisibility.judgePanel ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-sky-300">求真控制台</p>
                    <h3 className="mt-3 text-2xl font-semibold">Judge C 裁决</h3>
                  </div>
                  <VerdictTone verdict={result.round.judge.verdict} />
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-300">{result.round.judge.summary}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowEmpathyModal(true)}
                    className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/20"
                  >
                    我不认同/希望被理解
                  </button>
                  <span className="text-xs text-slate-400">
                    点击后可生成共情补充（不会替换原结论）
                  </span>
                </div>

                {empathyResult && (
                  <div className="mt-6 rounded-[1.5rem] border border-amber-300/40 bg-amber-200/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">共情补充</p>
                    <p className="mt-3 text-sm leading-7 text-amber-100">{empathyResult}</p>
                  </div>
                )}

                <div
                  className={`mt-6 rounded-[1.5rem] border p-4 ${
                    getVerdictAccent(result.round.judge.verdict) === "emerald"
                      ? "border-emerald-400/30 bg-emerald-400/10"
                      : getVerdictAccent(result.round.judge.verdict) === "amber"
                        ? "border-amber-400/30 bg-amber-400/10"
                        : getVerdictAccent(result.round.judge.verdict) === "rose"
                          ? "border-rose-400/30 bg-rose-400/10"
                          : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>当前占优方</span>
                    <span className="font-semibold uppercase tracking-[0.2em]">{result.round.judge.winningSide}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-white">{summarizeWinningSide(result.round.judge.winningSide)}</p>
                </div>

                <div className="mt-6 space-y-4">
                  {result.round.truthConsole.checks.map((check, index) => (
                    <div key={`${check.claim}-${index}`} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-200">
                          {check.speaker}
                        </span>
                        <VerdictTone verdict={check.verdict} />
                        <ConfidenceBadge strength={getEvidenceStrength(check.evidence)} />
                      </div>
                      <p className="mt-3 text-sm font-medium leading-6 text-white">{check.claim}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{check.reason}</p>
                      <div className="mt-3 space-y-2">
                        {check.evidence.map((item, evidenceIndex) => (
                          <div
                            key={`${item.url}-${evidenceIndex}`}
                            className={`rounded-2xl border p-3 ${
                              getEvidenceStrength([item]) === "strong"
                                ? "border-emerald-400/25 bg-emerald-400/10"
                                : getEvidenceStrength([item]) === "medium"
                                  ? "border-amber-400/25 bg-amber-400/10"
                                  : "border-white/10 bg-black/20"
                            }`}
                          >
                            <p className="text-sm font-medium text-sky-100">{item.title}</p>
                            <p className="mt-1 text-xs leading-6 text-slate-300">{item.snippet}</p>
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-block text-xs text-sky-300 underline-offset-4 hover:underline"
                              >
                                打开来源
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article
                className={`rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.06)] transition duration-500 ${
                  arenaVisibility.opponentPanel ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
                }`}
              >
                <span className="text-xs uppercase tracking-[0.3em] text-slate-400">对手</span>
                <div className="mt-4 flex items-center gap-4">
                  <Avatar name={result.round.opponent.name} avatarUrl={result.round.opponent.avatarUrl} />
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900">{result.round.opponent.name}</h3>
                    <p className="text-sm text-slate-500">{result.round.opponent.sourceType} 挑战者</p>
                  </div>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-600">{result.round.opponent.bio}</p>
                <div className="mt-6 rounded-[1.5rem] bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                  {result.round.opponent.argument}
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-900">Agent B 开场陈词</h4>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{result.round.transcript.opponentArgument}</p>
                </div>
              </article>
            </div>

            <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_60px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">辩论时间线</p>
                  <h3 className="mt-3 text-2xl font-semibold text-slate-900">发言顺序</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                  第 {arenaStage + 1} 阶段
                </span>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-4">
                {debateTimeline.map((entry, index) => (
                  <div
                    key={entry.label}
                    className={`rounded-[1.5rem] border p-4 transition duration-500 ${
                      entry.status === "complete"
                        ? "border-emerald-200 bg-emerald-50"
                        : entry.status === "current"
                          ? "border-sky-300 bg-sky-50 shadow-[0_10px_30px_rgba(14,165,233,0.16)]"
                          : "border-slate-200 bg-slate-50"
                    } ${entry.status === "current" ? "scale-[1.02]" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                          entry.status === "complete"
                            ? "bg-emerald-500 text-white"
                            : entry.status === "current"
                              ? "bg-sky-500 text-white"
                              : "bg-white text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                          {entry.status === "complete" ? "已完成" : entry.status === "current" ? "进行中" : "待开始"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{entry.description}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}
        {showEmpathyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-10">
            <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white p-8 shadow-[0_30px_120px_rgba(15,23,42,0.25)]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">共情补充</p>
                  <h3 className="mt-3 text-2xl font-semibold text-slate-900">告诉我你为何不认同</h3>
                </div>
                <button
                  onClick={() => setShowEmpathyModal(false)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                >
                  关闭
                </button>
              </div>

              <div className="mt-6 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">你的反馈</span>
                  <textarea
                    value={empathyFeedback}
                    onChange={(event) => setEmpathyFeedback(event.target.value)}
                    className="min-h-[140px] w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    placeholder="例如：这段话太理性了，没有体现我的处境..."
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">一句话背景（匿名用户需要）</span>
                  <input
                    value={empathyBackground}
                    onChange={(event) => setEmpathyBackground(event.target.value)}
                    className="w-full rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    placeholder="例如：我来自小城市，教育资源很少"
                  />
                  <p className="mt-2 text-xs text-slate-500">已登录用户可留空，匿名用户需要填写。</p>
                </label>
              </div>

              {empathyError && (
                <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {empathyError}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleEmpathySubmit}
                  disabled={isEmpathyPending || !empathyFeedback.trim()}
                  className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isEmpathyPending ? "生成中..." : "生成共情补充"}
                </button>
                <button
                  onClick={() => setShowEmpathyModal(false)}
                  className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
