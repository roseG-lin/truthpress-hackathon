"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnonymousDebateUser = createAnonymousDebateUser;
exports.mergeUserProfile = mergeUserProfile;
exports.getCurrentDebateUser = getCurrentDebateUser;
const node_crypto_1 = require("node:crypto");
const auth_session_1 = require("./auth-session");
function createAnonymousDebateUser() {
    const suffix = (0, node_crypto_1.randomUUID)().slice(0, 8);
    return {
        userId: `anon-${suffix}`,
        displayName: `Anonymous ${suffix.toUpperCase()}`,
        avatarUrl: "",
        bio: "A walk-in challenger from the lobby.",
        sourceType: "anonymous",
    };
}
function mergeUserProfile(fallbackUser, persistedUser) {
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
async function getCurrentDebateUser() {
    const fallback = createAnonymousDebateUser();
    const user = await (0, auth_session_1.getSessionUser)();
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
