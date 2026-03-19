import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "./prisma";
import { createAppSession, resolveAppSessionUserId, revokeAppSession } from "./session-store";
import { decryptStoredToken } from "./token-crypto";

const SESSION_COOKIE_CANDIDATES = ["session_id", "auth_session"] as const;

export type AuthenticatedUser = Awaited<ReturnType<typeof getSessionUser>>;

async function getRawSessionToken() {
  const cookieStore = await cookies();

  for (const name of SESSION_COOKIE_CANDIDATES) {
    const value = cookieStore.get(name)?.value?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

export async function getSessionId() {
  const token = await getRawSessionToken();

  return resolveAppSessionUserId(token);
}

export async function setSessionCookie(userId: string) {
  const cookieStore = await cookies();
  const session = await createAppSession(userId);

  for (const name of SESSION_COOKIE_CANDIDATES) {
    cookieStore.set(name, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: session.maxAge,
      path: "/",
    });
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const token = await getRawSessionToken();

  await revokeAppSession(token);

  for (const name of SESSION_COOKIE_CANDIDATES) {
    cookieStore.delete(name);
  }
}

export async function getSessionUser() {
  const sessionId = await getSessionId();

  if (!sessionId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionId },
    include: {
      profiles: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    accessToken: decryptStoredToken(user.accessToken),
    refreshToken: user.refreshToken ? decryptStoredToken(user.refreshToken) : user.refreshToken,
  };
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function getSessionPayload() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  const profile = user.profiles[0];

  return {
    userId: user.id,
    secondMeId: user.secondMeId,
    displayName: profile?.displayName || null,
    avatar: profile?.avatar || null,
    authenticated: true,
  };
}
