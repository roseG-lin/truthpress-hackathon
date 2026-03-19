import Link from "next/link";
import { notFound } from "next/navigation";

import { requireSessionUser } from "@/lib/auth-session";
import {
  getContentHistoryById,
  parseContentHistorySnapshot,
  type ContentHistoryDetailRecord,
} from "@/lib/content-history";
import type { GenerateResponse } from "@/lib/generate-types";

type EmpathySnapshot = {
  fallback?: boolean;
  source?: "secondme" | "anonymous";
  contextUsed?: {
    source: "secondme" | "anonymous";
    explanation: string;
    memorySummary?: string;
    memoryHighlights?: string[];
    userBackground?: string;
    fallback?: boolean;
  };
};

function formatTimestamp(value?: string | Date | null) {
  if (!value) {
    return "时间未知";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "时间未知";
  }

  return date.toLocaleString("zh-CN");
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function renderGenerateDetail(record: ContentHistoryDetailRecord) {
  const snapshot = parseContentHistorySnapshot(record.stageSnapshot) as GenerateResponse["stages"] | null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">主题</p>
        <p className="mt-2 text-sm leading-7 text-slate-700">{record.topic || "未命名主题"}</p>
      </div>
      {snapshot?.agentA?.output && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Agent A
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{snapshot.agentA.output}</p>
        </div>
      )}
      {snapshot?.agentB?.verification?.length ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Agent B
          </p>
          <div className="mt-3 space-y-2">
            {snapshot.agentB.verification.map((item) => (
              <div
                key={item.claim}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <p className="text-sm font-medium text-slate-800">{item.claim}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  {item.result}
                </p>
                {item.evidence && (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.evidence}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {snapshot?.agentC?.output && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Agent C
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{snapshot.agentC.output}</p>
        </div>
      )}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          最终结论
        </p>
        <p className="mt-2 text-sm leading-7 text-amber-950">{record.finalContent}</p>
      </div>
    </div>
  );
}

function renderEmpathyDetail(record: ContentHistoryDetailRecord) {
  const snapshot = parseContentHistorySnapshot(record.stageSnapshot) as EmpathySnapshot | null;
  const contextUsed = snapshot?.contextUsed;

  return (
    <div className="space-y-4">
      {record.originalContent && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            原始内容
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{record.originalContent}</p>
        </div>
      )}
      {record.userFeedback && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            用户反馈
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{record.userFeedback}</p>
        </div>
      )}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
          共情补充
        </p>
        <p className="mt-2 text-sm leading-7 text-amber-950">{record.finalContent}</p>
      </div>
      {contextUsed && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            本次共情依据
          </p>
          <p className="mt-2 text-sm leading-7 text-sky-950">{contextUsed.explanation}</p>
          {contextUsed.memorySummary && (
            <p className="mt-3 rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
              {contextUsed.memorySummary}
            </p>
          )}
          {contextUsed.memoryHighlights?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {contextUsed.memoryHighlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white px-3 py-1 text-xs text-sky-900"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          {contextUsed.userBackground && (
            <p className="mt-3 rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm leading-6 text-slate-700">
              匿名背景：{contextUsed.userBackground}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default async function HistoryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const sessionUser = await requireSessionUser();
  const record = await getContentHistoryById(sessionUser.id, params.id);

  if (!record) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
            History Detail
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {record.kind === "generate" ? "生成记录详情" : "共情记录详情"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            创建时间：{formatTimestamp(record.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/history"
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
          >
            返回历史
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
          >
            返回概览
          </Link>
        </div>
      </div>

      <DetailCard title="记录元信息">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">记录类型</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{record.kind}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">共情来源</p>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {record.empathySource || "无"}
            </p>
          </div>
        </div>
      </DetailCard>

      <DetailCard title={record.kind === "generate" ? "生成内容" : "共情内容"}>
        {record.kind === "generate" ? renderGenerateDetail(record) : renderEmpathyDetail(record)}
      </DetailCard>
    </div>
  );
}
