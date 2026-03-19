import Link from "next/link";

import { requireSessionUser } from "@/lib/auth-session";
import {
  countContentHistory,
  getContentHistory,
  type ContentHistoryKind,
  type ContentHistoryRecord,
} from "@/lib/content-history";

type HistoryPageProps = {
  searchParams?: {
    kind?: string;
  };
};

type FilterOption = {
  key: "all" | ContentHistoryKind;
  label: string;
  count: number;
  href: string;
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

function formatPreview(value?: string | null, fallback = "暂无内容") {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }

  return trimmed.length > 140 ? `${trimmed.slice(0, 140)}...` : trimmed;
}

function getHistoryTitle(record: ContentHistoryRecord) {
  if (record.kind === "generate") {
    return record.topic?.trim() || "未命名生成记录";
  }

  return formatPreview(record.originalContent, "未命名共情记录");
}

function getHistoryDescription(record: ContentHistoryRecord) {
  if (record.kind === "generate") {
    return formatPreview(record.finalContent, "暂无生成结果");
  }

  return formatPreview(record.finalContent, "暂无共情补充");
}

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const sessionUser = await requireSessionUser();
  const selectedKind =
    searchParams?.kind === "generate" || searchParams?.kind === "empathy"
      ? (searchParams.kind as ContentHistoryKind)
      : null;

  const [records, totalCount, generateCount, empathyCount] = await Promise.all([
    getContentHistory(sessionUser.id, {
      kind: selectedKind ?? undefined,
      limit: 60,
    }),
    countContentHistory(sessionUser.id),
    countContentHistory(sessionUser.id, "generate"),
    countContentHistory(sessionUser.id, "empathy"),
  ]);

  const filters: FilterOption[] = [
    { key: "all", label: "全部", count: totalCount, href: "/dashboard/history" },
    {
      key: "generate",
      label: "生成",
      count: generateCount,
      href: "/dashboard/history?kind=generate",
    },
    {
      key: "empathy",
      label: "共情",
      count: empathyCount,
      href: "/dashboard/history?kind=empathy",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
              History Browser
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">内容历史</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
              这里汇总 TruthPress 主链路里已经落库的生成与共情记录，可按类型筛选并回看详情。
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"
          >
            返回概览
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {filters.map((filter) => {
          const active =
            (filter.key === "all" && !selectedKind) || filter.key === selectedKind;

          return (
            <Link
              key={filter.key}
              href={filter.href}
              className={`card p-6 transition ${
                active
                  ? "border-sky-300 bg-sky-50 shadow-sm"
                  : "hover:border-sky-200 hover:shadow-sm"
              }`}
            >
              <p className="text-sm text-slate-500">{filter.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{filter.count}</p>
              <p className="mt-2 text-sm text-slate-500">
                {filter.key === "all"
                  ? "全部历史记录"
                  : filter.key === "generate"
                    ? "A/B/C 生成结果"
                    : "Agent D 共情补充"}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {selectedKind === "generate"
                ? "生成记录"
                : selectedKind === "empathy"
                  ? "共情记录"
                  : "全部记录"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">当前最多展示最近 60 条记录。</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const active =
                (filter.key === "all" && !selectedKind) || filter.key === selectedKind;

              return (
                <Link
                  key={`${filter.key}-pill`}
                  href={filter.href}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-sky-50"
                  }`}
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {records.length ? (
            records.map((record) => (
              <Link
                key={record.id}
                href={`/dashboard/history/${record.id}`}
                className="block rounded-2xl border border-slate-200 bg-white px-5 py-4 transition hover:border-sky-300 hover:bg-sky-50"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
                          record.kind === "generate"
                            ? "bg-amber-100 text-amber-900"
                            : "bg-sky-100 text-sky-900"
                        }`}
                      >
                        {record.kind === "generate" ? "Generate" : "Empathy"}
                      </span>
                      {record.empathySource && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">
                          来源：{record.empathySource}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-base font-semibold text-slate-900">
                      {getHistoryTitle(record)}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {getHistoryDescription(record)}
                    </p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>{formatTimestamp(record.createdAt)}</p>
                    <p className="mt-2 font-semibold text-slate-500">查看详情</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-slate-700">当前筛选下还没有历史记录。</p>
              <p className="mt-2 text-sm text-slate-500">
                先去 TruthPress 真理之梯跑一次真实生成，或触发一次 Agent D 共情补充。
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
