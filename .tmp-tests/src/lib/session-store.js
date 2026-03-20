"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSessionToken = createSessionToken;
exports.hashSessionToken = hashSessionToken;
exports.ensureAppSessionTable = ensureAppSessionTable;
exports.createAppSession = createAppSession;
exports.resolveAppSessionUserId = resolveAppSessionUserId;
exports.revokeAppSession = revokeAppSession;
const crypto_1 = require("crypto");
const prisma_1 = require("./prisma");
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
let appSessionReady = null;
function createSessionToken() {
    return (0, crypto_1.randomBytes)(32).toString("base64url");
}
function hashSessionToken(token) {
    return (0, crypto_1.createHash)("sha256").update(token).digest("hex");
}
async function ensureAppSessionTable() {
    if (!appSessionReady) {
        appSessionReady = (async () => {
            await prisma_1.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AppSession" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "tokenHash" TEXT NOT NULL UNIQUE,
          "expiresAt" TIMESTAMP NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
            await prisma_1.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AppSession_userId_idx" ON "AppSession"("userId")`);
            await prisma_1.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "AppSession_expiresAt_idx" ON "AppSession"("expiresAt")`);
        })();
    }
    return appSessionReady;
}
async function createAppSession(userId, ttlSeconds = SESSION_TTL_SECONDS) {
    await ensureAppSessionTable();
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await prisma_1.prisma.$executeRaw `
    INSERT INTO "AppSession" (
      "id",
      "userId",
      "tokenHash",
      "expiresAt"
    ) VALUES (
      ${(0, crypto_1.randomUUID)()},
      ${userId},
      ${tokenHash},
      ${expiresAt}
    )
  `;
    return {
        token,
        expiresAt,
        maxAge: ttlSeconds,
    };
}
async function resolveAppSessionUserId(token) {
    const trimmed = token?.trim();
    if (!trimmed) {
        return null;
    }
    await ensureAppSessionTable();
    const tokenHash = hashSessionToken(trimmed);
    const rows = await prisma_1.prisma.$queryRaw `
    SELECT
      "id",
      "userId",
      "tokenHash",
      "expiresAt",
      "createdAt",
      "updatedAt"
    FROM "AppSession"
    WHERE "tokenHash" = ${tokenHash}
    LIMIT 1
  `;
    const session = rows[0];
    if (!session) {
        return null;
    }
    const expiresAt = session.expiresAt instanceof Date ? session.expiresAt : new Date(session.expiresAt);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
        await revokeAppSession(trimmed);
        return null;
    }
    return session.userId;
}
async function revokeAppSession(token) {
    const trimmed = token?.trim();
    if (!trimmed) {
        return;
    }
    await ensureAppSessionTable();
    const tokenHash = hashSessionToken(trimmed);
    await prisma_1.prisma.$executeRaw `
    DELETE FROM "AppSession"
    WHERE "tokenHash" = ${tokenHash}
  `;
}
