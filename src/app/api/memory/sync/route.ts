// ============================================
// 记忆同步 API - 在每次交互后更新记忆快照
// ============================================

import { NextResponse } from "next/server";

import { jsonApiError } from "@/lib/api-error";
import { getSessionUser } from "@/lib/auth-session";
import { upsertMemorySnapshot } from "@/lib/memory-snapshot";
import { prisma } from "@/lib/prisma";
import { buildEnhancedMemoryContext, buildEnhancedMemorySummary } from "@/lib/memory-accumulator";
import { parseStoredJson } from "@/lib/user-memory";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return jsonApiError({
      status: 401,
      error: "UNAUTHORIZED",
      message: "必须登录才能同步记忆",
    });
  }

  try {
    // 获取用户的 profile
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        profiles: {
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!userProfile) {
      return jsonApiError({
        status: 404,
        error: "USER_NOT_FOUND",
        message: "用户不存在",
      });
    }

    const profile = userProfile.profiles[0];
    const currentSoftMemory = parseStoredJson(profile?.softMemory);

    // 构建增强的记忆（从历史中累积）
    const enhancedMemory = await buildEnhancedMemoryContext(user.id, currentSoftMemory);

    // 生成增强的记忆摘要
    const enhancedSummary = buildEnhancedMemorySummary(enhancedMemory);

    // 提取记忆高亮
    const highlights = extractMemoryHighlights(enhancedMemory as any);

    // 更新记忆快照
    await upsertMemorySnapshot({
      userId: user.id,
      secondMeId: user.secondMeId,
      summary: enhancedSummary,
      highlights: highlights,
      rawSoftMemory: enhancedMemory,
      rawShades: parseStoredJson(profile?.shades),
    });

    // 同时更新 profile 中的 softMemory
    if (profile) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: {
          softMemory: JSON.stringify(enhancedMemory),
        },
      });
    }

    return NextResponse.json({
      success: true,
      memory: {
        summary: enhancedSummary,
        highlights: highlights,
        softMemory: enhancedMemory,
      },
    });
  } catch (error) {
    console.error("记忆同步失败:", error);
    return jsonApiError({
      status: 500,
      error: "SYNC_FAILED",
      message: "记忆同步失败",
    });
  }
}

function extractMemoryHighlights(softMemory: any): string[] {
  const highlights: string[] = [];

  if (!softMemory) {
    return highlights;
  }

  // 提取累积的主题
  if (softMemory.accumulatedTopics && Array.isArray(softMemory.accumulatedTopics)) {
    highlights.push(...softMemory.accumulatedTopics.slice(0, 5));
  }

  // 提取用户反馈
  if (softMemory.accumulatedFeedback && Array.isArray(softMemory.accumulatedFeedback)) {
    highlights.push(...softMemory.accumulatedFeedback.slice(0, 3));
  }

  // 提取兴趣标签
  if (softMemory.interestTags && Array.isArray(softMemory.interestTags)) {
    highlights.push(...softMemory.interestTags.slice(0, 5));
  }

  // 提取最近关注
  if (softMemory.recentInterests && Array.isArray(softMemory.recentInterests)) {
    highlights.push(...softMemory.recentInterests.slice(0, 3));
  }

  return Array.from(new Set(highlights)).slice(0, 10);
}
