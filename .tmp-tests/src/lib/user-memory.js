"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStoredJson = parseStoredJson;
exports.extractMemoryHighlights = extractMemoryHighlights;
exports.getUserMemoryContextByIdentifier = getUserMemoryContextByIdentifier;
exports.buildProfilePayload = buildProfilePayload;
const agent_summary_1 = require("./agent-summary");
const memory_snapshot_1 = require("./memory-snapshot");
const prisma_1 = require("./prisma");
const memory_accumulator_1 = require("./memory-accumulator");
function parseStoredJson(raw) {
    if (!raw) {
        return null;
    }
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
function collectStringLeaves(value, bucket) {
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
function extractMemoryHighlights(softMemory, limit = 5) {
    if (!softMemory) {
        return [];
    }
    const bucket = [];
    collectStringLeaves(softMemory, bucket);
    return Array.from(new Set(bucket)).slice(0, limit);
}
function parseStringArray(raw) {
    const parsed = parseStoredJson(raw);
    if (!Array.isArray(parsed)) {
        return [];
    }
    return parsed.filter((item) => typeof item === "string");
}
function buildMemoryContext(secondMeId, userId, profile) {
    return buildMemoryContextFromSnapshot(secondMeId, userId, profile, null);
}
function buildMemoryContextFromSnapshot(secondMeId, userId, profile, snapshot) {
    const profileShades = parseStoredJson(profile?.shades);
    const profileSoftMemory = parseStoredJson(profile?.softMemory);
    const snapshotShades = parseStoredJson(snapshot?.rawShades);
    const snapshotSoftMemory = parseStoredJson(snapshot?.rawSoftMemory);
    const summary = snapshot?.summary?.trim() || (0, agent_summary_1.buildAgentSummary)(snapshotShades || profileShades, snapshotSoftMemory || profileSoftMemory);
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
async function getUserMemoryContextByIdentifier(identifier) {
    const trimmed = identifier.trim();
    if (!trimmed) {
        return null;
    }
    const byInternalId = await prisma_1.prisma.user.findUnique({
        where: { id: trimmed },
        include: {
            profiles: {
                orderBy: { updatedAt: "desc" },
                take: 1,
            },
        },
    });
    if (byInternalId) {
        const snapshot = await (0, memory_snapshot_1.getMemorySnapshotByUserId)(byInternalId.id);
        return await buildEnhancedUserMemoryContext(byInternalId.secondMeId, byInternalId.id, byInternalId.profiles[0], snapshot);
    }
    const bySecondMeId = await prisma_1.prisma.user.findUnique({
        where: { secondMeId: trimmed },
        include: {
            profiles: {
                orderBy: { updatedAt: "desc" },
                take: 1,
            },
        },
    });
    if (bySecondMeId) {
        const snapshot = await (0, memory_snapshot_1.getMemorySnapshotByUserId)(bySecondMeId.id);
        return await buildEnhancedUserMemoryContext(bySecondMeId.secondMeId, bySecondMeId.id, bySecondMeId.profiles[0], snapshot);
    }
    return null;
}
/**
 * 构建增强的用户记忆上下文
 * 整合 SecondMe 记忆与从历史交互中累积的记忆
 */
async function buildEnhancedUserMemoryContext(secondMeId, userId, profile, snapshot) {
    const profileShades = parseStoredJson(profile?.shades);
    const profileSoftMemory = parseStoredJson(profile?.softMemory);
    const snapshotShades = parseStoredJson(snapshot?.rawShades);
    const snapshotSoftMemory = parseStoredJson(snapshot?.rawSoftMemory);
    // 检查 SecondMe 记忆是否为空
    const hasSecondMeMemory = (profileShades && Object.keys(profileShades).length > 0) ||
        (profileSoftMemory && Object.keys(profileSoftMemory).length > 0);
    // 构建增强的记忆（从历史中累积）
    const enhancedMemory = await (0, memory_accumulator_1.buildEnhancedMemoryContext)(userId, snapshotSoftMemory || profileSoftMemory);
    // 使用增强的记忆摘要
    const enhancedSummary = (0, memory_accumulator_1.buildEnhancedMemorySummary)(enhancedMemory);
    let baseSummary = snapshot?.summary?.trim() || (0, agent_summary_1.buildAgentSummary)(snapshotShades || profileShades, snapshotSoftMemory || profileSoftMemory);
    // 如果基础记忆为空，从用户资料中提取初始记忆
    if (!baseSummary && profile) {
        const profileBasedMemory = [];
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
            softMemory: enhancedMemory, // 使用增强后的记忆
            memorySummary: finalSummary,
            memoryHighlights: highlights.length > 0 ? highlights : fallbackHighlights,
        },
    };
}
function buildProfilePayload(input) {
    // 从 shades 和 softMemory 构建基础记忆
    let memorySummary = (0, agent_summary_1.buildAgentSummary)(input.shades, input.softMemory);
    let memoryHighlights = extractMemoryHighlights(input.softMemory);
    // 如果 shades 和 softMemory 都是空的，从用户资料中提取初始记忆
    const isShadesEmpty = !input.shades || Object.keys(input.shades).length === 0;
    const isSoftMemoryEmpty = !input.softMemory || Object.keys(input.softMemory).length === 0;
    if (isShadesEmpty && isSoftMemoryEmpty) {
        const profileMemory = [];
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
