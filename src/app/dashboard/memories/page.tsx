import { requireSessionUser } from "@/lib/auth-session";
import { getMemorySnapshotByUserId } from "@/lib/memory-snapshot";
import { getUserMemoryContextByIdentifier } from "@/lib/user-memory";
import { User, Clock, CheckCircle } from "lucide-react";

function formatTimestamp(value?: string | Date | null) {
  if (!value) return "尚未同步";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未知";
  return date.toLocaleString("zh-CN");
}

export default async function MemoriesPage() {
  const sessionUser = await requireSessionUser();
  const context = await getUserMemoryContextByIdentifier(sessionUser.id);
  const snapshot = await getMemorySnapshotByUserId(sessionUser.id);

  const highlights = context?.profile.memoryHighlights || [];
  const rawMemory = context?.profile.softMemory;
  const rawShades = context?.profile.shades;

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-8 shadow-xl shadow-gray-200/40 backdrop-blur-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">记忆控制台</p>
        <h1 className="mt-3 text-4xl font-bold text-gray-900">Agent D 可用记忆</h1>
        <p className="mt-4 max-w-3xl text-lg leading-7 text-gray-600">
          这一页展示的是当前账号在 求真社-TRUTHPRESS 里会被 Agent D 使用的 SecondMe 记忆上下文。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
            <CheckCircle className="h-4 w-4 text-emerald-600" />
            当前来源：{snapshot ? "MemorySnapshot" : "Profile fallback"}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
            <Clock className="h-4 w-4" />
            最近同步：{formatTimestamp(snapshot?.updatedAt)}
          </span>
        </div>
      </div>

      {/* 记忆摘要和高频片段 */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg shadow-gray-200/30 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-200">
              <User className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">记忆摘要</h3>
          </div>
          <p className="mt-6 text-base leading-7 text-gray-700">
            {context?.profile.memorySummary || "当前还没有可用于共情补充的稳定记忆摘要。"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg shadow-gray-200/30 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-200">
              <User className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">高频记忆片段</h3>
          </div>
          {highlights.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2">
              {highlights.map((item) => (
                <span key={item} className="rounded-full bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-200">
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-base text-gray-600">还没有提取到稳定的记忆片段。</p>
          )}
        </div>
      </div>

      {rawShades && (
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg shadow-gray-200/30 backdrop-blur">
          <h3 className="text-lg font-bold text-gray-900">Shades 原始数据</h3>
          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <pre className="text-sm leading-6 text-gray-700 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(rawShades, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {rawMemory && (
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg shadow-gray-200/30 backdrop-blur">
          <h3 className="text-lg font-bold text-gray-900">Soft Memory 原始数据</h3>
          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <pre className="text-sm leading-6 text-gray-700 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(rawMemory, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
