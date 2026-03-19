import { randomUUID } from "node:crypto";

import { getSessionUser } from "./auth-session";
import { type DebateUserProfile } from "./types";

type PersistedUserProfile = {
  id: string;
  secondMeId?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
};

export function createAnonymousDebateUser(): DebateUserProfile {
  const suffix = randomUUID().slice(0, 8);
  return {
    userId: `anon-${suffix}`,
    displayName: `Anonymous ${suffix.toUpperCase()}`,
    avatarUrl: "",
    bio: "A walk-in challenger from the lobby.",
    sourceType: "anonymous",
  };
}

export function mergeUserProfile(
  fallbackUser: DebateUserProfile,
  persistedUser?: PersistedUserProfile | null,
): DebateUserProfile {
  if (!persistedUser) {
    return fallbackUser;
  }

  return {
    userId: persistedUser.id,
    displayName: persistedUser.displayName || fallbackUser.displayName,
    avatarUrl: persistedUser.avatarUrl || fallbackUser.avatarUrl,
    bio: persistedUser.bio || fallbackUser.bio,
    sourceType: "secondme",
    secondMeId: persistedUser.secondMeId || undefined,
  };
}

export async function getCurrentDebateUser(): Promise<DebateUserProfile> {
  const fallback = createAnonymousDebateUser();
  const user = await getSessionUser();

  if (!user) {
    return fallback;
  }

  const latestProfile = user.profiles[0];
  return mergeUserProfile(fallback, {
    id: user.id,
    secondMeId: user.secondMeId,
    displayName: latestProfile?.displayName || undefined,
    avatarUrl: latestProfile?.avatar || undefined,
    bio: latestProfile?.bio || undefined,
  });
}
