"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_CHAT_MESSAGE_LENGTH = void 0;
exports.normalizeChatMessage = normalizeChatMessage;
exports.MAX_CHAT_MESSAGE_LENGTH = 1000;
function normalizeChatMessage(input) {
    if (typeof input?.message !== "string") {
        return {
            ok: false,
            error: "INVALID_MESSAGE",
            status: 400,
        };
    }
    const value = input.message.trim();
    if (!value) {
        return {
            ok: false,
            error: "EMPTY_MESSAGE",
            status: 400,
        };
    }
    if (value.length > exports.MAX_CHAT_MESSAGE_LENGTH) {
        return {
            ok: false,
            error: "MESSAGE_TOO_LONG",
            status: 400,
        };
    }
    return {
        ok: true,
        value,
    };
}
