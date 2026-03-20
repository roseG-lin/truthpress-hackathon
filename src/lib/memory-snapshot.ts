import { randomUUID } from "crypto";

import { prisma } from "./prisma";

export type MemorySnapshotRecord = {
  id: string;
  userId: string;
  secondMeId: string;
  summary: string;
  highlights: string | null;
  rawSoftMemory: string | null;
  rawShades: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type UpsertMemorySnapshotInput = {
  userId: string;
  secondMeId: string;
  summary: string;
  highlights: string[];
  rawSoftMemory: unknown;
  rawShades: unknown;
};

let memorySnapshotReady: Promise<void> | null = null;

export async function ensureMemorySnapshotTable() {
  if (!memorySnapshotReady) {
    memorySnapshotReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MemorySnapshot" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL UNIQUE,
          "secondMeId" TEXT NOT NULL,
          "summary" TEXT NOT NULL,
          "highlights" TEXT DEFAULT '[]',
          "rawSoftMemory" TEXT DEFAULT '{}',
          "rawShades" TEXT DEFAULT '{}',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "MemorySnapshot_userId_idx" ON "MemorySnapshot"("userId")`,
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "MemorySnapshot_secondMeId_idx" ON "MemorySnapshot"("secondMeId")`,
      );
    })();
  }

  return memorySnapshotReady;
}

export async function upsertMemorySnapshot(input: UpsertMemorySnapshotInput) {
  await ensureMemorySnapshotTable();

  const id = randomUUID();
  const highlights = JSON.stringify(input.highlights);
  const rawSoftMemory = JSON.stringify(input.rawSoftMemory ?? {});
  const rawShades = JSON.stringify(input.rawShades ?? {});

  await prisma.$executeRaw`
    INSERT INTO "MemorySnapshot" (
      "id",
      "userId",
      "secondMeId",
      "summary",
      "highlights",
      "rawSoftMemory",
      "rawShades"
    ) VALUES (
      ${id},
      ${input.userId},
      ${input.secondMeId},
      ${input.summary},
      ${highlights},
      ${rawSoftMemory},
      ${rawShades}
    )
    ON CONFLICT("userId") DO UPDATE SET
      "secondMeId" = excluded."secondMeId",
      "summary" = excluded."summary",
      "highlights" = excluded."highlights",
      "rawSoftMemory" = excluded."rawSoftMemory",
      "rawShades" = excluded."rawShades",
      "updatedAt" = CURRENT_TIMESTAMP
  `;
}

export async function getMemorySnapshotByUserId(userId: string) {
  await ensureMemorySnapshotTable();

  const rows = await prisma.$queryRaw<MemorySnapshotRecord[]>`
    SELECT
      "id",
      "userId",
      "secondMeId",
      "summary",
      "highlights",
      "rawSoftMemory",
      "rawShades",
      "createdAt",
      "updatedAt"
    FROM "MemorySnapshot"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;

  return rows[0] ?? null;
}
