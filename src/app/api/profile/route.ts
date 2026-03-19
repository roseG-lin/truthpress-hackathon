import { NextResponse } from "next/server";

import { jsonApiError, jsonRateLimitError } from "@/lib/api-error";
import { getSessionUser } from "@/lib/auth-session";
import { upsertMemorySnapshot } from "@/lib/memory-snapshot";
import { prisma } from "@/lib/prisma";
import { consumeRouteRateLimit } from "@/lib/rate-limit-policy";
import { getSecondMeConfig } from "@/lib/secondme-config";
import { buildProfilePayload, parseStoredJson } from "@/lib/user-memory";
import { buildEnhancedMemoryContext, buildEnhancedMemorySummary } from "@/lib/memory-accumulator";

// 从增强记忆中提取高亮（本地函数）
function extractHighlightsFromEnhanced(softMemory: any): string[] {
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

  // 去重并限制数量
  return Array.from(new Set(highlights)).slice(0, 10);
}

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return jsonApiError({
      status: 401,
      error: "UNAUTHORIZED",
      message: "You must be signed in to view the profile.",
    });
  }

  const rateLimit = consumeRouteRateLimit("profileRefresh", request, { userId: user.id });
  if (!rateLimit.allowed) {
    return jsonRateLimitError(rateLimit);
  }

  const { apiUrl } = getSecondMeConfig();

  try {
    const [userInfo, shades, softMemory] = await Promise.all([
      fetch(`${apiUrl}/user/info`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }),
      fetch(`${apiUrl}/user/info/shades`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }).catch(() => null),
      fetch(`${apiUrl}/user/info/softmemory`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }).catch(() => null),
    ]);

    const userResult = await userInfo.json();
    const userData = userResult.code === 0 ? userResult.data : userResult;
    const shadesResult = shades?.ok ? await shades.json() : null;
    const softMemoryResult = softMemory?.ok ? await softMemory.json() : null;

    const shadesData = shadesResult?.code === 0 ? shadesResult.data : shadesResult || {};
    const softMemoryData = softMemoryResult?.code === 0 ? softMemoryResult.data : softMemoryResult || {};

    const profileData = buildProfilePayload({
      secondMeId: user.secondMeId,
      displayName: userData.nickname || userData.name,
      bio: userData.bio,
      avatar: userData.avatar,
      shades: shadesData,
      softMemory: softMemoryData,
    });

    // 构建增强的记忆（从历史中累积）
    const enhancedMemory = await buildEnhancedMemoryContext(user.id, profileData.softMemory);
    const enhancedSummary = buildEnhancedMemorySummary(enhancedMemory);
    const enhancedHighlights = extractHighlightsFromEnhanced(enhancedMemory);

    // 合并基础记忆和增强记忆
    const finalMemorySummary = enhancedSummary || profileData.memorySummary;
    const finalMemoryHighlights = enhancedHighlights.length > 0
      ? Array.from(new Set([...profileData.memoryHighlights || [], ...enhancedHighlights]))
      : profileData.memoryHighlights || [];

    // 使用增强后的记忆数据
    const enhancedProfileData = {
      ...profileData,
      memorySummary: finalMemorySummary,
      memoryHighlights: finalMemoryHighlights,
      softMemory: enhancedMemory,
    };

    if (user.profiles.length > 0) {
      await prisma.profile.update({
        where: { id: user.profiles[0].id },
        data: {
          displayName: enhancedProfileData.displayName,
          bio: enhancedProfileData.bio,
          shades: JSON.stringify(enhancedProfileData.shades),
          softMemory: JSON.stringify(enhancedProfileData.softMemory),
          avatar: enhancedProfileData.avatar,
        },
      });
    } else {
      await prisma.profile.create({
        data: {
          userId: user.id,
          displayName: enhancedProfileData.displayName,
          bio: enhancedProfileData.bio,
          shades: JSON.stringify(enhancedProfileData.shades),
          softMemory: JSON.stringify(enhancedProfileData.softMemory),
          avatar: enhancedProfileData.avatar,
        },
      });
    }

    await upsertMemorySnapshot({
      userId: user.id,
      secondMeId: user.secondMeId,
      summary: enhancedProfileData.memorySummary || "",
      highlights: enhancedProfileData.memoryHighlights || [],
      rawSoftMemory: enhancedProfileData.softMemory,
      rawShades: enhancedProfileData.shades,
    });

    return NextResponse.json({
      user: enhancedProfileData,
      profile: enhancedProfileData,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);

    if (user.profiles.length > 0) {
      const cached = user.profiles[0];
      const profileData = buildProfilePayload({
        secondMeId: user.secondMeId,
        displayName: cached.displayName,
        bio: cached.bio,
        avatar: cached.avatar,
        shades: parseStoredJson(cached.shades),
        softMemory: parseStoredJson(cached.softMemory),
      });

      return NextResponse.json({
        user: profileData,
        profile: profileData,
      });
    }

    return NextResponse.json({ user: null });
  }
}
