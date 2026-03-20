"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveHistoryUserId = resolveHistoryUserId;
exports.ensureContentHistoryTable = ensureContentHistoryTable;
exports.recordGenerateHistory = recordGenerateHistory;
exports.recordEmpathyHistory = recordEmpathyHistory;
exports.countContentHistory = countContentHistory;
exports.getContentHistory = getContentHistory;
exports.getRecentContentHistory = getRecentContentHistory;
exports.parseContentHistorySnapshot = parseContentHistorySnapshot;
exports.getContentHistoryById = getContentHistoryById;
const crypto_1 = require("crypto");
const client_1 = require("@prisma/client");
const prisma_1 = require("./prisma");
let contentHistoryReady = null;
function normalizeUserCandidates(input) {
    return Array.from(new Set([input.sessionId, input.requestedUserId]
        .map((value) => value?.trim())
        .filter((value) => Boolean(value && value !== "anonymous"))));
}
async function resolveHistoryUserId(input) {
    const candidates = normalizeUserCandidates(input);
    for (const candidate of candidates) {
        const byInternalId = await prisma_1.prisma.user.findUnique({
            where: { id: candidate },
            select: { id: true },
        });
        if (byInternalId) {
            return byInternalId.id;
        }
        const bySecondMeId = await prisma_1.prisma.user.findUnique({
            where: { secondMeId: candidate },
            select: { id: true },
        });
        if (bySecondMeId) {
            return bySecondMeId.id;
        }
    }
    return null;
}
async function ensureContentHistoryTable() {
    if (!contentHistoryReady) {
        contentHistoryReady = (async () => {
            await prisma_1.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "ContentHistory" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT,
          "kind" TEXT NOT NULL,
          "topic" TEXT,
          "originalContent" TEXT,
          "finalContent" TEXT NOT NULL,
          "stageSnapshot" TEXT DEFAULT '{}',
          "empathySource" TEXT,
          "userFeedback" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
            await prisma_1.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ContentHistory_userId_idx" ON "ContentHistory"("userId")`);
            await prisma_1.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ContentHistory_kind_idx" ON "ContentHistory"("kind")`);
            await prisma_1.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ContentHistory_createdAt_idx" ON "ContentHistory"("createdAt")`);
        })();
    }
    return contentHistoryReady;
}
async function recordGenerateHistory(input) {
    await ensureContentHistoryTable();
    const userId = await resolveHistoryUserId({
        sessionId: input.sessionId,
        requestedUserId: input.requestedUserId,
    });
    const id = (0, crypto_1.randomUUID)();
    const stageSnapshot = JSON.stringify(input.response.stages);
    const empathySource = input.response.stages.agentD.status === "completed" ? (userId ? "secondme" : "anonymous") : null;
    await prisma_1.prisma.$executeRaw `
    INSERT INTO "ContentHistory" (
      "id",
      "userId",
      "kind",
      "topic",
      "finalContent",
      "stageSnapshot",
      "empathySource"
    ) VALUES (
      ${id},
      ${userId},
      ${"generate"},
      ${input.topic},
      ${input.response.finalContent},
      ${stageSnapshot},
      ${empathySource}
    )
  `;
}
async function recordEmpathyHistory(input) {
    await ensureContentHistoryTable();
    const userId = await resolveHistoryUserId({
        sessionId: input.sessionId,
        requestedUserId: input.requestedUserId,
    });
    const id = (0, crypto_1.randomUUID)();
    const stageSnapshot = JSON.stringify(input.stageSnapshot || {
        fallback: Boolean(input.fallback),
        source: input.source,
    });
    await prisma_1.prisma.$executeRaw `
    INSERT INTO "ContentHistory" (
      "id",
      "userId",
      "kind",
      "originalContent",
      "finalContent",
      "stageSnapshot",
      "empathySource",
      "userFeedback"
    ) VALUES (
      ${id},
      ${userId},
      ${"empathy"},
      ${input.originalContent},
      ${input.finalContent},
      ${stageSnapshot},
      ${input.source},
      ${input.userFeedback}
    )
  `;
}
async function countContentHistory(userId, kind) {
    await ensureContentHistoryTable();
    const kindClause = kind ? client_1.Prisma.sql `AND "kind" = ${kind}` : client_1.Prisma.empty;
    const rows = await prisma_1.prisma.$queryRaw(client_1.Prisma.sql `
    SELECT COUNT(*) AS count
    FROM "ContentHistory"
    WHERE "userId" = ${userId}
    ${kindClause}
  `);
    return Number(rows[0]?.count ?? 0);
}
async function getContentHistory(userId, options = {}) {
    await ensureContentHistoryTable();
    const limit = Math.max(1, Math.min(options.limit ?? 20, 100));
    const kindClause = options.kind ? client_1.Prisma.sql `AND "kind" = ${options.kind}` : client_1.Prisma.empty;
    return prisma_1.prisma.$queryRaw(client_1.Prisma.sql `
    SELECT
      "id",
      "userId",
      "kind",
      "topic",
      "originalContent",
      "finalContent",
      "stageSnapshot",
      "empathySource",
      "userFeedback",
      "createdAt",
      "updatedAt"
    FROM "ContentHistory"
    WHERE "userId" = ${userId}
    ${kindClause}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `);
}
async function getRecentContentHistory(userId, limit = 5) {
    return getContentHistory(userId, { limit });
}
function parseContentHistorySnapshot(raw) {
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
async function getContentHistoryById(userId, id) {
    await ensureContentHistoryTable();
    const rows = await prisma_1.prisma.$queryRaw `
    SELECT
      "id",
      "userId",
      "kind",
      "topic",
      "originalContent",
      "finalContent",
      "stageSnapshot",
      "empathySource",
      "userFeedback",
      "createdAt",
      "updatedAt"
    FROM "ContentHistory"
    WHERE "userId" = ${userId} AND "id" = ${id}
    LIMIT 1
  `;
    return rows[0] ?? null;
}
