import { buildAgentSummary } from "./agent-summary";
import { getMemorySnapshotByUserId } from "./memory-snapshot";
import { prisma } from "./prisma";
import { buildEnhancedMemoryContext, buildEnhancedMemorySummary, type EnhancedSoftMemory } from "./memory-accumulator";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ProfileRecord = {
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  shades: string | null;
  softMemory: string | null;
};

export type UserMemoryContext = {
  userId: string;
  secondMeId: string;
  profile: {
    displayName?: string;
    bio?: string;
    avatar?: string;
    shades: JsonValue | null;
    softMemory: JsonValue | null;
    memorySummary: string;
    memoryHighlights: string[];
  };
};

export function parseStoredJson(raw?: string | null): JsonValue | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as JsonValue;
  } catch {
    return null;
  }
}

function collectStringLeaves(value: JsonValue, bucket: string[]) {
  if (value === null || value === undefined) {
    return;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) {
      bucket.push(trimmed);
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectStringLeaves(entry, bucket));
    return;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((entry) => collectStringLeaves(entry, bucket));
  }
}

export function extractMemoryHighlights(softMemory: JsonValue | null, limit = 5) {
  if (!softMemory) {
    return [];
  }

  const bucket: string[] = [];
  collectStringLeaves(softMemory, bucket);

  return Array.from(new Set(bucket)).slice(0, limit);
}

function parseStringArray(raw?: string | null) {
  const parsed = parseStoredJson(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter((item): item is string => typeof item === "string");
}

function buildMemoryContext(secondMeId: string, userId: string, profile?: ProfileRecord | null): UserMemoryContext {
  return buildMemoryContextFromSnapshot(secondMeId, userId, profile, null);
}

function buildMemoryContextFromSnapshot(
  secondMeId: string,
  userId: string,
  profile: ProfileRecord | null | undefined,
  snapshot?: {
    summary?: string | null;
    highlights?: string | null;
    rawSoftMemory?: string | null;
    rawShades?: string | null;
  } | null,
): UserMemoryContext {
  const profileShades = parseStoredJson(profile?.shades);
  const profileSoftMemory = parseStoredJson(profile?.softMemory);
  const snapshotShades = parseStoredJson(snapshot?.rawShades);
  const snapshotSoftMemory = parseStoredJson(snapshot?.rawSoftMemory);
  const summary =
    snapshot?.summary?.trim() || buildAgentSummary(snapshotShades || profileShades, snapshotSoftMemory || profileSoftMemory);
  const highlights = parseStringArray(snapshot?.highlights);

  return {
    userId,
    secondMeId,
    profile: {
      displayName: profile?.displayName || undefined,
      bio: profile?.bio || undefined,
      avatar: profile?.avatar || undefined,
      shades: snapshotShades || profileShades,
      softMemory: snapshotSoftMemory || profileSoftMemory,
      memorySummary: summary,
      memoryHighlights: highlights.length > 0 ? highlights : extractMemoryHighlights(snapshotSoftMemory || profileSoftMemory),
    },
  };
}

export async function getUserMemoryContextByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return null;
  }

  const byInternalId = await prisma.user.findUnique({
    where: { id: trimmed },
    include: {
      profiles: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (byInternalId) {
    const snapshot = await getMemorySnapshotByUserId(byInternalId.id);
    return await buildEnhancedUserMemoryContext(byInternalId.secondMeId, byInternalId.id, byInternalId.profiles[0], snapshot);
  }

  const bySecondMeId = await prisma.user.findUnique({
    where: { secondMeId: trimmed },
    include: {
      profiles: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (bySecondMeId) {
    const snapshot = await getMemorySnapshotByUserId(bySecondMeId.id);
    return await buildEnhancedUserMemoryContext(
      bySecondMeId.secondMeId,
      bySecondMeId.id,
      bySecondMeId.profiles[0],
      snapshot,
    );
  }

  return null;
}

/**
 * 构建增强的用户记忆上下文
 * 整合 SecondMe 记忆与从历史交互中累积的记忆
 */
async function buildEnhancedUserMemoryContext(
  secondMeId: string,
  userId: string,
  profile: ProfileRecord | null | undefined,
  snapshot?: {
    summary?: string | null;
    highlights?: string | null;
    rawSoftMemory?: string | null;
    rawShades?: string | null;
  } | null,
): Promise<UserMemoryContext> {
  const profileShades = parseStoredJson(profile?.shades);
  const profileSoftMemory = parseStoredJson(profile?.softMemory);
  const snapshotShades = parseStoredJson(snapshot?.rawShades);
  const snapshotSoftMemory = parseStoredJson(snapshot?.rawSoftMemory);

  // 检查 SecondMe 记忆是否为空
  const hasSecondMeMemory =
    (profileShades && Object.keys(profileShades).length > 0) ||
    (profileSoftMemory && Object.keys(profileSoftMemory).length > 0);

  // 构建增强的记忆（从历史中累积）
  const enhancedMemory = await buildEnhancedMemoryContext(userId, snapshotSoftMemory || profileSoftMemory);

  // 使用增强的记忆摘要
  const enhancedSummary = buildEnhancedMemorySummary(enhancedMemory);
  let baseSummary = snapshot?.summary?.trim() || buildAgentSummary(snapshotShades || profileShades, snapshotSoftMemory || profileSoftMemory);

  // 如果基础记忆为空，从用户资料中提取初始记忆
  if (!baseSummary && profile) {
    const profileBasedMemory: string[] = [];
    if (profile.displayName) {
      profileBasedMemory.push(`用户名: ${profile.displayName}`);
    }
    if (profile.bio) {
      profileBasedMemory.push(`简介: ${profile.bio}`);
    }
    if (profileBasedMemory.length > 0) {
      baseSummary = profileBasedMemory.join(" | ");
    }
  }

  // 合并摘要：基础摘要 + 增强摘要
  const finalSummary = enhancedSummary
    ? `${baseSummary}${enhancedSummary ? " | " + enhancedSummary : ""}`
    : baseSummary;

  const highlights = parseStringArray(snapshot?.highlights);

  // 如果没有高亮，尝试从用户资料中提取
  const fallbackHighlights = !highlights || highlights.length === 0
    ? (profile?.bio ? [profile.bio] : []).concat(profile?.displayName ? [profile.displayName] : [])
    : [];

  return {
    userId,
    secondMeId,
    profile: {
      displayName: profile?.displayName || undefined,
      bio: profile?.bio || undefined,
      avatar: profile?.avatar || undefined,
      shades: snapshotShades || profileShades,
      softMemory: enhancedMemory as JsonValue, // 使用增强后的记忆
      memorySummary: finalSummary,
      memoryHighlights: highlights.length > 0 ? highlights : fallbackHighlights,
    },
  };
}

export function buildProfilePayload(input: {
  secondMeId: string;
  displayName?: string | null;
  bio?: string | null;
  avatar?: string | null;
  shades: JsonValue | null;
  softMemory: JsonValue | null;
}) {
  // 从 shades 和 softMemory 构建基础记忆
  let memorySummary = buildAgentSummary(input.shades, input.softMemory);
  let memoryHighlights = extractMemoryHighlights(input.softMemory);

  // 如果 shades 和 softMemory 都是空的，从用户资料中提取初始记忆
  const isShadesEmpty = !input.shades || Object.keys(input.shades).length === 0;
  const isSoftMemoryEmpty = !input.softMemory || Object.keys(input.softMemory).length === 0;

  if (isShadesEmpty && isSoftMemoryEmpty) {
    const profileMemory: string[] = [];

    // 从 bio 中提取记忆
    if (input.bio && input.bio.trim()) {
      profileMemory.push(input.bio.trim());
    }

    // 从 displayName 中提取信息
    if (input.displayName && input.displayName.trim()) {
      profileMemory.push(input.displayName.trim());
    }

    // 如果有资料信息，创建基础记忆摘要
    if (profileMemory.length > 0) {
      memorySummary = profileMemory.join(" ");
      memoryHighlights = profileMemory;
    }
  }

  return {
    displayName: input.displayName || undefined,
    bio: input.bio || undefined,
    avatar: input.avatar || undefined,
    shades: input.shades,
    softMemory: input.softMemory,
    secondMeId: input.secondMeId,
    memorySummary,
    memoryHighlights,
    profiles: input.displayName ? [{ displayName: input.displayName }] : [],
  };
}
