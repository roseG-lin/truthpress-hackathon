import { createHash, randomBytes, randomUUID } from "crypto";

import { prisma } from "./prisma";

type AppSessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date | string;
  createdAt: Date;
  updatedAt: Date;
};

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

let appSessionReady: Promise<void> | null = null;

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function ensureAppSessionTable() {
  if (!appSessionReady) {
    appSessionReady = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "AppSession" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "tokenHash" TEXT NOT NULL UNIQUE,
          "expiresAt" TIMESTAMP NOT NULL,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "AppSession_userId_idx" ON "AppSession"("userId")`,
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "AppSession_expiresAt_idx" ON "AppSession"("expiresAt")`,
      );
    })();
  }

  return appSessionReady;
}

export async function createAppSession(userId: string, ttlSeconds = SESSION_TTL_SECONDS) {
  await ensureAppSessionTable();

  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await prisma.$executeRaw`
    INSERT INTO "AppSession" (
      "id",
      "userId",
      "tokenHash",
      "expiresAt"
    ) VALUES (
      ${randomUUID()},
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

export async function resolveAppSessionUserId(token?: string | null) {
  const trimmed = token?.trim();
  if (!trimmed) {
    return null;
  }

  await ensureAppSessionTable();

  const tokenHash = hashSessionToken(trimmed);
  const rows = await prisma.$queryRaw<AppSessionRecord[]>`
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

export async function revokeAppSession(token?: string | null) {
  const trimmed = token?.trim();
  if (!trimmed) {
    return;
  }

  await ensureAppSessionTable();

  const tokenHash = hashSessionToken(trimmed);
  await prisma.$executeRaw`
    DELETE FROM "AppSession"
    WHERE "tokenHash" = ${tokenHash}
  `;
}
