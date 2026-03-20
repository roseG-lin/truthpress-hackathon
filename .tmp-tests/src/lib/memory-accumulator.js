"use strict";
// ============================================
// 记忆累积器 - 从用户历史交互中提取并累积记忆
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMemoriesFromHistory = extractMemoriesFromHistory;
exports.mergeMemories = mergeMemories;
exports.buildEnhancedMemoryContext = buildEnhancedMemoryContext;
exports.incrementallyUpdateMemory = incrementallyUpdateMemory;
exports.buildEnhancedMemorySummary = buildEnhancedMemorySummary;
const content_history_1 = require("./content-history");
/**
 * 从单条历史记录中提取记忆
 */
function extractMemoryFromRecord(record) {
    const topics = [];
    const feedback = [];
    const interests = [];
    // 从主题中提取
    if (record.topic) {
        topics.push(record.topic);
        // 简单的关键词提取
        const keywords = record.topic
            .split(/[，。、；：,;\s]/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 2);
        interests.push(...keywords);
    }
    // 从用户反馈中提取
    if (record.userFeedback) {
        feedback.push(record.userFeedback);
    }
    // 从最终内容中提取关键信息
    if (record.finalContent) {
        // 提取句子级别的关键片段
        const sentences = record.finalContent
            .split(/[。！？.!?]/)
            .map((s) => s.trim())
            .filter((s) => s.length >= 10 && s.length <= 100);
        if (sentences.length > 0) {
            interests.push(...sentences.slice(0, 2));
        }
    }
    return {
        topics,
        feedback,
        interests: Array.from(new Set(interests)),
        extractedAt: record.createdAt,
    };
}
/**
 * 从多条历史记录中聚合记忆
 */
function extractMemoriesFromHistory(records) {
    const allTopics = [];
    const allFeedback = [];
    const allInterests = [];
    records.forEach((record) => {
        const extracted = extractMemoryFromRecord(record);
        allTopics.push(...extracted.topics);
        allFeedback.push(...extracted.feedback);
        allInterests.push(...extracted.interests);
    });
    return {
        topics: Array.from(new Set(allTopics)),
        feedback: Array.from(new Set(allFeedback)),
        interests: Array.from(new Set(allInterests)),
        extractedAt: new Date(),
    };
}
/**
 * 将 SecondMe 软记忆与累积记忆合并
 */
function mergeMemories(secondmeSoftMemory, extractedMemory) {
    const base = {
        secondme: secondmeSoftMemory || undefined,
        lastUpdatedAt: new Date().toISOString(),
    };
    // 只在有数据时才添加字段
    if (extractedMemory.topics.length > 0) {
        base.accumulatedTopics = extractedMemory.topics.slice(0, 20); // 限制数量
    }
    if (extractedMemory.feedback.length > 0) {
        base.accumulatedFeedback = extractedMemory.feedback.slice(0, 15);
    }
    if (extractedMemory.interests.length > 0) {
        // 提取最常出现的兴趣标签
        base.interestTags = extractedMemory.interests.slice(0, 30);
    }
    // 最近活跃的领域（来自最近的主题）
    const recentTopics = extractedMemory.topics.slice(0, 5);
    if (recentTopics.length > 0) {
        base.recentInterests = recentTopics;
    }
    return base;
}
/**
 * 为用户构建增强的记忆上下文
 * 这个函数会：
 * 1. 获取用户的历史记录
 * 2. 从中提取关键信息
 * 3. 与 SecondMe 的软记忆合并
 */
async function buildEnhancedMemoryContext(userId, secondmeSoftMemory, limit = 20) {
    // 获取用户的历史记录
    const historyRecords = await (0, content_history_1.getContentHistory)(userId, { limit });
    // 提取记忆
    const extractedMemory = extractMemoriesFromHistory(historyRecords);
    // 合并记忆
    return mergeMemories(secondmeSoftMemory, extractedMemory);
}
/**
 * 增量更新记忆（在每次生成/共情后调用）
 */
async function incrementallyUpdateMemory(userId, currentSoftMemory) {
    // 获取最近的记录（用于增量更新）
    const recentRecords = await (0, content_history_1.getRecentContentHistory)(userId, 10);
    const extractedMemory = extractMemoriesFromHistory(recentRecords);
    const enhanced = mergeMemories(currentSoftMemory, extractedMemory);
    return enhanced;
}
/**
 * 从增强的记忆中构建用于 Agent D 的记忆摘要
 */
function buildEnhancedMemorySummary(enhancedMemory) {
    const parts = [];
    // SecondMe 原始记忆
    if (enhancedMemory.secondme) {
        const secondmeStr = JSON.stringify(enhancedMemory.secondme);
        if (secondmeStr !== "{}" && secondmeStr !== "null") {
            parts.push(`基础背景: ${secondmeStr}`);
        }
    }
    // 累积的主题兴趣
    if (enhancedMemory.accumulatedTopics && enhancedMemory.accumulatedTopics.length > 0) {
        parts.push(`关注主题: ${enhancedMemory.accumulatedTopics.slice(0, 5).join(", ")}`);
    }
    // 用户反馈态度
    if (enhancedMemory.accumulatedFeedback && enhancedMemory.accumulatedFeedback.length > 0) {
        parts.push(`用户态度: ${enhancedMemory.accumulatedFeedback.slice(0, 3).join("; ")}`);
    }
    // 最近兴趣
    if (enhancedMemory.recentInterests && enhancedMemory.recentInterests.length > 0) {
        parts.push(`最近关注: ${enhancedMemory.recentInterests.join(", ")}`);
    }
    return parts.join(" | ");
}
