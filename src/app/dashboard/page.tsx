import Link from "next/link";
import { requireSessionUser } from "@/lib/auth-session";
import { countContentHistory, getRecentContentHistory } from "@/lib/content-history";
import { prisma } from "@/lib/prisma";
import { CheckCircle, Clock, Brain, Heart, User } from "lucide-react";

/**
 * 检查记忆是否已准备好
 * 记忆来源可以是：
 * 1. SecondMe 的 softMemory（解析后的对象有内容）
 * 2. 用户的 bio（简介）
 * 3. 用户的 displayName（名称）
 */
function checkMemoryReady(
  softMemoryJson: string | null | undefined,
  bio: string | null | undefined,
  displayName: string | null | undefined,
): boolean {
  // 检查 softMemory
  if (softMemoryJson && softMemoryJson.trim() !== "{}") {
    try {
      const parsed = JSON.parse(softMemoryJson);
      if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
        return true;
      }
    } catch {
      // 解析失败，继续检查其他来源
    }
  }

  // 检查 bio
  if (bio && bio.trim() && bio.trim() !== "null") {
    return true;
  }

  // 检查 displayName（至少要有名称）
  if (displayName && displayName.trim() && displayName.trim() !== "null") {
    return true;
  }

  return false;
}

function formatPreview(value?: string | null, fallback = "暂无内容") {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed.length > 110 ? `${trimmed.slice(0, 110)}...` : trimmed;
}

function formatTimestamp(value?: string | Date | null) {
  if (!value) return "尚无记录";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "时间未知";
  return date.toLocaleString("zh-CN");
}

async function getDashboardState(sessionId: string) {
  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    include: {
      profiles: { orderBy: { updatedAt: "desc" }, take: 1 },
      chats: { orderBy: { createdAt: "desc" }, take: 1 },
      notes: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!user) return null;

  const [chatCount, noteCount, historyCount, recentHistory] = await Promise.all([
    prisma.chat.count({ where: { userId: sessionId } }),
    prisma.note.count({ where: { userId: sessionId } }),
    countContentHistory(sessionId),
    getRecentContentHistory(sessionId),
  ]);

  return {
    user,
    profile: user.profiles[0] ?? null,
    latestChat: user.chats[0] ?? null,
    latestNote: user.notes[0] ?? null,
    recentHistory,
    chatCount,
    noteCount,
    historyCount,
  };
}

function StatCard({
  icon: Icon,
  gradient,
  shadow,
  label,
  value,
  valueColor,
  description,
}: {
  icon: React.ElementType;
  gradient: string;
  shadow: string;
  label: string;
  value: string | number;
  valueColor?: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg shadow-gray-200/30 backdrop-blur transition-all hover:shadow-xl hover:-translate-y-1">
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg ${shadow}`}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${valueColor || "text-gray-900"}`}>{value}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function HistoryCard({
  icon: Icon,
  gradient,
  title,
  topic,
  content,
  fallback,
  timestamp,
}: {
  icon: React.ElementType;
  gradient: string;
  title: string;
  topic: string;
  content?: string | null;
  fallback: string;
  timestamp?: string | Date | null;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg shadow-gray-200/30 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      </div>
      <div className="mt-6">
        <p className="text-sm font-medium text-gray-500">{topic.includes("记录") ? "来源" : "主题"}</p>
        <p className="mt-2 text-lg font-semibold text-gray-900">{topic}</p>
        <p className="mt-4 text-base leading-7 text-gray-600">
          {formatPreview(content, fallback)}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          {timestamp ? `记录时间：${formatTimestamp(timestamp)}` : "尚无记录"}
        </p>
      </div>
    </div>
  );
}

function LinkCard({
  href,
  icon: Icon,
  gradient,
  shadow,
  title,
  content,
}: {
  href: string;
  icon: React.ElementType;
  gradient: string;
  shadow: string;
  title: string;
  content: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg shadow-gray-200/30 backdrop-blur transition-all hover:shadow-xl hover:-translate-y-1"
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-md ${shadow} transition-transform group-hover:scale-110`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">{content}</p>
        </div>
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const sessionUser = await requireSessionUser();
  const state = await getDashboardState(sessionUser.id);

  const displayName = state?.profile?.displayName ?? state?.user?.secondMeId?.slice(0, 8) ?? "SecondMe 用户";
  const recentGenerate = state?.recentHistory?.find((item) => item.kind === "generate") ?? null;
  const recentEmpathy = state?.recentHistory?.find((item) => item.kind === "empathy") ?? null;

  // 检查记忆是否已同步：解析 softMemory 并检查是否有内容
  const hasMemory = checkMemoryReady(state?.profile?.softMemory, state?.profile?.bio, state?.profile?.displayName);
  const memoryReady = hasMemory;

  return (
    <div className="space-y-8">
      {/* 欢迎区域 */}
      <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-8 shadow-xl shadow-gray-200/40 backdrop-blur-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">求真社控制台</p>
        <h1 className="mt-3 text-4xl font-bold text-gray-900">欢迎回来，{displayName}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-7 text-gray-600">
          这里展示的是你在 求真社-TRUTHPRESS 的完整状态，包括生成历史、共情补充记录，以及 SecondMe 记忆同步情况。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/cafe"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-200 transition-all hover:shadow-xl hover:shadow-sky-300 hover:-translate-y-0.5"
          >
            <Brain className="h-5 w-5" />
            进入真理之梯
          </Link>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition-all hover:border-sky-300 hover:bg-sky-50"
          >
            <User className="h-5 w-5" />
            查看资料
          </Link>
          <Link
            href="/dashboard/history"
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition-all hover:border-sky-300 hover:bg-sky-50"
          >
            <Clock className="h-5 w-5" />
            浏览历史
          </Link>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          icon={Clock}
          gradient="from-sky-500 to-blue-600"
          shadow="shadow-sky-200"
          label="内容历史"
          value={state?.historyCount ?? 0}
          description="已记录的生成和共情输出次数"
        />
        <StatCard
          icon={CheckCircle}
          gradient={memoryReady ? "from-emerald-500 to-green-600" : "from-gray-400 to-gray-500"}
          shadow={memoryReady ? "shadow-emerald-200" : "shadow-gray-200"}
          label="记忆状态"
          value={memoryReady ? "已同步" : "待同步"}
          valueColor={memoryReady ? "text-emerald-600" : "text-gray-600"}
          description={memoryReady ? "可以为 Agent D 提供个性化共情上下文" : "先访问资料页或重新同步 profile"}
        />
        <StatCard
          icon={Heart}
          gradient="from-violet-500 to-purple-600"
          shadow="shadow-violet-200"
          label="附带模板"
          value={(state?.chatCount ?? 0) + (state?.noteCount ?? 0)}
          description={`对话 ${state?.chatCount ?? 0} 条，笔记 ${state?.noteCount ?? 0} 条`}
        />
      </div>

      {/* 最近记录 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <HistoryCard
          icon={Brain}
          gradient="from-blue-500 to-sky-600"
          title="最近一次 A/B/C 生成"
          topic={recentGenerate?.topic ?? "还没有真实生成记录"}
          content={recentGenerate?.finalContent}
          fallback="登录后在真理之梯提交观点，这里会出现最新结论。"
          timestamp={recentGenerate?.createdAt}
        />
        <HistoryCard
          icon={Heart}
          gradient="from-amber-500 to-orange-600"
          title="最近一次 Agent D 共情补充"
          topic={recentEmpathy?.empathySource ?? "暂无共情记录"}
          content={recentEmpathy?.finalContent}
          fallback={'当你在主流程里表达"我不认同 / 希望被理解"后，这里会展示最新补充。'}
          timestamp={recentEmpathy?.createdAt}
        />
      </div>

      {/* 历史记录列表 */}
      <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg shadow-gray-200/30 backdrop-blur">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">最近记录</h3>
          <Link href="/dashboard/history" className="text-sm font-medium text-sky-600 hover:text-sky-700">
            查看全部 →
          </Link>
        </div>
        <div className="space-y-3">
          {state?.recentHistory?.length ? (
            state.recentHistory.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/history/${item.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white px-5 py-4 transition-all hover:border-sky-200 hover:shadow-md hover:shadow-sky-100/50"
              >
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {item.kind === "generate" ? "🧠 生成结果" : "❤️ 共情补充"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {item.topic ?? formatPreview(item.originalContent, "未命名记录")}
                  </p>
                </div>
                <span className="text-sm text-gray-500">{formatTimestamp(item.createdAt)}</span>
              </Link>
            ))
          ) : (
            <p className="text-base text-gray-500">还没有内容历史。先去真理之梯跑一次真实流程。</p>
          )}
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="grid gap-6 md:grid-cols-2">
        <LinkCard
          href="/dashboard/chat"
          icon={Brain}
          gradient="from-sky-500 to-blue-600"
          shadow="shadow-sky-200"
          title="SecondMe 对话"
          content={formatPreview(state?.latestChat?.content, "暂无对话记录")}
        />
        <LinkCard
          href="/dashboard/notes"
          icon={Brain}
          gradient="from-violet-500 to-purple-600"
          shadow="shadow-violet-200"
          title="SecondMe 笔记"
          content={state?.latestNote?.title ?? "暂无笔记记录"}
        />
      </div>
    </div>
  );
}
