"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const oauth_state_1 = require("./oauth-state");
const freshCookieValue = (0, oauth_state_1.createOAuthStateCookieValue)("state-123", 999000);
const freshState = (0, oauth_state_1.validateOAuthStateCookieValue)({
    expectedState: "state-123",
    cookieValue: freshCookieValue,
    nowMs: 1000000,
});
strict_1.default.equal(freshState.ok, true);
const expiredCookieValue = (0, oauth_state_1.createOAuthStateCookieValue)("state-123", 2000000 - (oauth_state_1.OAUTH_STATE_MAX_AGE_SECONDS * 1000 + 1));
const expiredState = (0, oauth_state_1.validateOAuthStateCookieValue)({
    expectedState: "state-123",
    cookieValue: expiredCookieValue,
    nowMs: 2000000,
});
strict_1.default.equal(expiredState.ok, false);
if (expiredState.ok) {
    throw new Error("expected expired state to be rejected");
}
strict_1.default.equal(expiredState.error, "STATE_EXPIRED");
strict_1.default.equal(expiredState.status, 400);
