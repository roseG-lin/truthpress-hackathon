import { randomUUID } from "crypto";

import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { type GenerateResponse } from "./generate-types";

export type ContentHistoryKind = "generate" | "empathy";

export type ContentHistoryRecord = {
  id: string;
  userId: string | null;
  kind: ContentHistoryKind;
  topic: string | null;
  originalContent: string | null;
  finalContent: string;
  stageSnapshot: string | null;
  empathySource: string | null;
  userFeedback: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ContentHistoryDetailRecord = ContentHistoryRecord;

type ContentHistoryListOptions = {
  kind?: ContentHistoryKind;
  limit?: number;
};

type HistoryUserLookupInput = {
  sessionId?: string | null;
  requestedUserId?: string | null;
};

type GenerateHistoryInput = {
  sessionId?: string | null;
  requestedUserId?: string | null;
  topic: string;
  response: GenerateResponse;
};

type EmpathyHistoryInput = {
  sessionId?: string | null;
  requestedUserId?: string | null;
  originalContent: string;
  finalContent: string;
  userFeedback: string;
  source: "secondme" | "anonymous";
  fallback?: boolean;
  stageSnapshot?: unknown;
};

let contentHistoryReady: Promise<void> | null = null;

function normalizeUserCandidates(input: HistoryUserLookupInput) {
  return Array.from(
    new Set(
      [input.sessionId, input.requestedUserId]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value && value !== "anonymous")),
    ),
  );
}

export async function resolveHistoryUserId(input: HistoryUserLookupInput): Promise<string | null> {
  const candidates = normalizeUserCandidates(input);

  for (const candidate of candidates) {
    const byInternalId = await prisma.user.findUnique({
      where: { id: candidate },
      select: { id: true },
    });
    if (byInternalId) {
      return byInternalId.id;
    }

    const bySecondMeId = await prisma.user.findUnique({
      where: { secondMeId: candidate },
      select: { id: true },
    });
    if (bySecondMeId) {
      return bySecondMeId.id;
    }
  }

  return null;
}

export async function ensureContentHistoryTable() {
  if (!contentHistoryReady) {
    contentHistoryReady = (async () => {
      await prisma.$executeRawUnsafe(`
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
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "ContentHistory_userId_idx" ON "ContentHistory"("userId")`,
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "ContentHistory_kind_idx" ON "ContentHistory"("kind")`,
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "ContentHistory_createdAt_idx" ON "ContentHistory"("createdAt")`,
      );
    })();
  }

  return contentHistoryReady;
}

export async function recordGenerateHistory(input: GenerateHistoryInput) {
  await ensureContentHistoryTable();

  const userId = await resolveHistoryUserId({
    sessionId: input.sessionId,
    requestedUserId: input.requestedUserId,
  });
  const id = randomUUID();
  const stageSnapshot = JSON.stringify(input.response.stages);
  const empathySource =
    input.response.stages.agentD.status === "completed" ? (userId ? "secondme" : "anonymous") : null;

  await prisma.$executeRaw`
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

export async function recordEmpathyHistory(input: EmpathyHistoryInput) {
  await ensureContentHistoryTable();

  const userId = await resolveHistoryUserId({
    sessionId: input.sessionId,
    requestedUserId: input.requestedUserId,
  });
  const id = randomUUID();
  const stageSnapshot = JSON.stringify(
    input.stageSnapshot || {
      fallback: Boolean(input.fallback),
      source: input.source,
    },
  );

  await prisma.$executeRaw`
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

export async function countContentHistory(userId: string, kind?: ContentHistoryKind) {
  await ensureContentHistoryTable();

  const kindClause = kind ? Prisma.sql`AND "kind" = ${kind}` : Prisma.empty;
  const rows = await prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
    SELECT COUNT(*) AS count
    FROM "ContentHistory"
    WHERE "userId" = ${userId}
    ${kindClause}
  `);

  return Number(rows[0]?.count ?? 0);
}

export async function getContentHistory(userId: string, options: ContentHistoryListOptions = {}) {
  await ensureContentHistoryTable();

  const limit = Math.max(1, Math.min(options.limit ?? 20, 100));
  const kindClause = options.kind ? Prisma.sql`AND "kind" = ${options.kind}` : Prisma.empty;

  return prisma.$queryRaw<ContentHistoryRecord[]>(Prisma.sql`
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

export async function getRecentContentHistory(userId: string, limit = 5) {
  return getContentHistory(userId, { limit });
}

export function parseContentHistorySnapshot(raw?: string | null) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function getContentHistoryById(userId: string, id: string) {
  await ensureContentHistoryTable();

  const rows = await prisma.$queryRaw<ContentHistoryDetailRecord[]>`
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
