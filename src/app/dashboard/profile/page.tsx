"use client";

import { useEffect, useState } from "react";
import { User, RefreshCw, CheckCircle, Sparkles } from "lucide-react";

interface Profile {
  displayName?: string;
  bio?: string;
  shades?: Record<string, unknown>;
  softMemory?: Record<string, unknown>;
  avatar?: string;
  secondMeId?: string;
  memorySummary?: string;
  memoryHighlights?: string[];
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile((data.profile || data.user) as Profile);
      }
    } catch (error) {
      console.error("获取资料失败:", error);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-8 shadow-xl shadow-gray-200/40 backdrop-blur-2xl">
          <div className="animate-pulse space-y-4">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto" />
            <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto" />
            <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  const memoryHighlights = profile?.memoryHighlights || [];
  const hasSoftMemory = Boolean(profile?.softMemory && Object.keys(profile.softMemory).length > 0);
  const hasShades = Boolean(profile?.shades && Object.keys(profile.shades).length > 0);

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-8 shadow-xl shadow-gray-200/40 backdrop-blur-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">个人资料</p>
            <h1 className="mt-3 text-4xl font-bold text-gray-900">个人资料</h1>
            <p className="mt-4 max-w-3xl text-lg leading-7 text-gray-600">
              这里展示当前账号在 求真社-TRUTHPRESS 中可用于共情补充的 SecondMe 信息。
            </p>
          </div>
          <button
            onClick={fetchProfile}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:border-sky-300 hover:bg-sky-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "同步中..." : "重新同步"}
          </button>
        </div>
      </div>

      {/* 用户信息卡片 */}
      <div className="rounded-3xl border border-gray-200/60 bg-white/80 p-8 shadow-xl shadow-gray-200/40 backdrop-blur-2xl">
        <div className="flex flex-col items-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-blue-600 to-violet-600 text-white text-5xl font-bold shadow-2xl shadow-sky-200">
            {(profile?.displayName || "U").charAt(0).toUpperCase()}
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {profile?.displayName || "SecondMe 用户"}
          </h2>
          {profile?.secondMeId && (
            <p className="mt-2 text-sm text-gray-500">SecondMe ID: {profile.secondMeId}</p>
          )}
          {profile?.bio && (
            <p className="mt-4 text-center text-lg leading-7 text-gray-600 max-w-2xl">{profile.bio}</p>
          )}
        </div>

        {/* 记忆摘要和片段 */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-sky-50/80 to-blue-50/40 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-200">
                <User className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">记忆摘要</h3>
            </div>
            <p className="mt-4 text-base leading-7 text-gray-700">
              {profile?.memorySummary || "当前还没有可供 Agent D 使用的记忆摘要。"}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200/60 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-6 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-200">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">共情可用片段</h3>
            </div>
            {memoryHighlights.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {memoryHighlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-amber-900 ring-1 ring-inset ring-amber-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-base text-gray-600">还没有提取到稳定的记忆片段。</p>
            )}
          </div>
        </div>
      </div>

      {/* Shades 数据 */}
      {hasShades && (
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg shadow-gray-200/30 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-200">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Shades</h3>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <pre className="text-sm leading-6 text-gray-700 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(profile?.shades, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Soft Memory 数据 */}
      {hasSoftMemory && (
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-6 shadow-lg shadow-gray-200/30 backdrop-blur">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-200">
              <User className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Soft Memory</h3>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <pre className="text-sm leading-6 text-gray-700 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(profile?.softMemory, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
