"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OAUTH_STATE_MAX_AGE_SECONDS = void 0;
exports.createOAuthStateCookieValue = createOAuthStateCookieValue;
exports.validateOAuthStateCookieValue = validateOAuthStateCookieValue;
exports.OAUTH_STATE_MAX_AGE_SECONDS = 600;
function createOAuthStateCookieValue(state, issuedAtMs = Date.now()) {
    return `${state}.${issuedAtMs}`;
}
function parseOAuthStateCookieValue(cookieValue) {
    if (!cookieValue) {
        return null;
    }
    const separatorIndex = cookieValue.lastIndexOf(".");
    if (separatorIndex <= 0) {
        return null;
    }
    const state = cookieValue.slice(0, separatorIndex);
    const issuedAtRaw = cookieValue.slice(separatorIndex + 1);
    const issuedAtMs = Number(issuedAtRaw);
    if (!state || !Number.isFinite(issuedAtMs)) {
        return null;
    }
    return { state, issuedAtMs };
}
function validateOAuthStateCookieValue(input) {
    const parsed = parseOAuthStateCookieValue(input.cookieValue);
    const expectedState = input.expectedState?.trim();
    if (!expectedState || !parsed) {
        return { ok: false, error: "MISSING_STATE", status: 400 };
    }
    if (expectedState !== parsed.state) {
        return { ok: false, error: "INVALID_STATE", status: 400 };
    }
    const nowMs = input.nowMs ?? Date.now();
    const maxAgeMs = (input.maxAgeSeconds ?? exports.OAUTH_STATE_MAX_AGE_SECONDS) * 1000;
    if (nowMs - parsed.issuedAtMs > maxAgeMs) {
        return { ok: false, error: "STATE_EXPIRED", status: 400 };
    }
    return { ok: true };
}
