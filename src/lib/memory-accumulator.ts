// ============================================
// 记忆累积器 - 从用户历史交互中提取并累积记忆
// ============================================

import { type JsonValue } from "./user-memory";
import {
  getContentHistory,
  getRecentContentHistory,
  type ContentHistoryRecord,
} from "./content-history";

/**
 * 从内容历史中提取的记忆片段
 */
export interface ExtractedMemory {
  /** 提取的关键主题 */
  topics: string[];
  /** 用户反馈/态度 */
  feedback: string[];
  /** 用户关心的领域 */
  interests: string[];
  /** 提取时间戳 */
  extractedAt: Date;
}

/**
 * 增强后的软记忆结构
 */
export interface EnhancedSoftMemory {
  /** 来自 SecondMe 的原始软记忆 */
  secondme?: JsonValue;
  /** 从历史生成中提取的主题 */
  accumulatedTopics?: string[];
  /** 从共情交互中提取的用户反馈 */
  accumulatedFeedback?: string[];
  /** 用户兴趣标签 */
  interestTags?: string[];
  /** 最近活跃的领域 */
  recentInterests?: string[];
  /** 最后更新时间 */
  lastUpdatedAt?: string;
}

/**
 * 从单条历史记录中提取记忆
 */
function extractMemoryFromRecord(record: ContentHistoryRecord): ExtractedMemory {
  const topics: string[] = [];
  const feedback: string[] = [];
  const interests: string[] = [];

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
export function extractMemoriesFromHistory(records: ContentHistoryRecord[]): ExtractedMemory {
  const allTopics: string[] = [];
  const allFeedback: string[] = [];
  const allInterests: string[] = [];

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
export function mergeMemories(
  secondmeSoftMemory: JsonValue | null,
  extractedMemory: ExtractedMemory,
): EnhancedSoftMemory {
  const base: EnhancedSoftMemory = {
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
export async function buildEnhancedMemoryContext(
  userId: string,
  secondmeSoftMemory: JsonValue | null,
  limit: number = 20,
): Promise<EnhancedSoftMemory> {
  // 获取用户的历史记录
  const historyRecords = await getContentHistory(userId, { limit });

  // 提取记忆
  const extractedMemory = extractMemoriesFromHistory(historyRecords);

  // 合并记忆
  return mergeMemories(secondmeSoftMemory, extractedMemory);
}

/**
 * 增量更新记忆（在每次生成/共情后调用）
 */
export async function incrementallyUpdateMemory(
  userId: string,
  currentSoftMemory: JsonValue | null,
): Promise<JsonValue> {
  // 获取最近的记录（用于增量更新）
  const recentRecords = await getRecentContentHistory(userId, 10);
  const extractedMemory = extractMemoriesFromHistory(recentRecords);

  const enhanced = mergeMemories(currentSoftMemory, extractedMemory);

  return enhanced as JsonValue;
}

/**
 * 从增强的记忆中构建用于 Agent D 的记忆摘要
 */
export function buildEnhancedMemorySummary(enhancedMemory: EnhancedSoftMemory): string {
  const parts: string[] = [];

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
