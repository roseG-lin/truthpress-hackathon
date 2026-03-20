"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureMemorySnapshotTable = ensureMemorySnapshotTable;
exports.upsertMemorySnapshot = upsertMemorySnapshot;
exports.getMemorySnapshotByUserId = getMemorySnapshotByUserId;
const crypto_1 = require("crypto");
const prisma_1 = require("./prisma");
let memorySnapshotReady = null;
async function ensureMemorySnapshotTable() {
    if (!memorySnapshotReady) {
        memorySnapshotReady = (async () => {
            await prisma_1.prisma.$executeRawUnsafe(`
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
            await prisma_1.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MemorySnapshot_userId_idx" ON "MemorySnapshot"("userId")`);
            await prisma_1.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MemorySnapshot_secondMeId_idx" ON "MemorySnapshot"("secondMeId")`);
        })();
    }
    return memorySnapshotReady;
}
async function upsertMemorySnapshot(input) {
    await ensureMemorySnapshotTable();
    const id = (0, crypto_1.randomUUID)();
    const highlights = JSON.stringify(input.highlights);
    const rawSoftMemory = JSON.stringify(input.rawSoftMemory ?? {});
    const rawShades = JSON.stringify(input.rawShades ?? {});
    await prisma_1.prisma.$executeRaw `
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
async function getMemorySnapshotByUserId(userId) {
    await ensureMemorySnapshotTable();
    const rows = await prisma_1.prisma.$queryRaw `
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
