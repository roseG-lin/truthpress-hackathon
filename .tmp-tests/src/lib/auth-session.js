"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionId = getSessionId;
exports.setSessionCookie = setSessionCookie;
exports.clearSessionCookie = clearSessionCookie;
exports.getSessionUser = getSessionUser;
exports.requireSessionUser = requireSessionUser;
exports.getSessionPayload = getSessionPayload;
const headers_1 = require("next/headers");
const navigation_1 = require("next/navigation");
const prisma_1 = require("./prisma");
const session_store_1 = require("./session-store");
const token_crypto_1 = require("./token-crypto");
const SESSION_COOKIE_CANDIDATES = ["session_id", "auth_session"];
async function getRawSessionToken() {
    const cookieStore = await (0, headers_1.cookies)();
    for (const name of SESSION_COOKIE_CANDIDATES) {
        const value = cookieStore.get(name)?.value?.trim();
        if (value) {
            return value;
        }
    }
    return null;
}
async function getSessionId() {
    const token = await getRawSessionToken();
    return (0, session_store_1.resolveAppSessionUserId)(token);
}
async function setSessionCookie(userId) {
    const cookieStore = await (0, headers_1.cookies)();
    const session = await (0, session_store_1.createAppSession)(userId);
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
async function clearSessionCookie() {
    const cookieStore = await (0, headers_1.cookies)();
    const token = await getRawSessionToken();
    await (0, session_store_1.revokeAppSession)(token);
    for (const name of SESSION_COOKIE_CANDIDATES) {
        cookieStore.delete(name);
    }
}
async function getSessionUser() {
    const sessionId = await getSessionId();
    if (!sessionId) {
        return null;
    }
    const user = await prisma_1.prisma.user.findUnique({
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
        accessToken: (0, token_crypto_1.decryptStoredToken)(user.accessToken),
        refreshToken: user.refreshToken ? (0, token_crypto_1.decryptStoredToken)(user.refreshToken) : user.refreshToken,
    };
}
async function requireSessionUser() {
    const user = await getSessionUser();
    if (!user) {
        (0, navigation_1.redirect)("/");
    }
    return user;
}
async function getSessionPayload() {
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
