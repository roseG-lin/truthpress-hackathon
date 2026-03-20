"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const chat_request_1 = require("./chat-request");
const validMessage = (0, chat_request_1.normalizeChatMessage)({ message: "  hello world  " });
strict_1.default.equal(validMessage.ok, true);
if (!validMessage.ok) {
    throw new Error("expected valid message");
}
strict_1.default.equal(validMessage.value, "hello world");
const emptyMessage = (0, chat_request_1.normalizeChatMessage)({ message: "   " });
strict_1.default.equal(emptyMessage.ok, false);
if (emptyMessage.ok) {
    throw new Error("expected empty message to be rejected");
}
strict_1.default.equal(emptyMessage.error, "EMPTY_MESSAGE");
strict_1.default.equal(emptyMessage.status, 400);
const oversizedMessage = (0, chat_request_1.normalizeChatMessage)({ message: "x".repeat(chat_request_1.MAX_CHAT_MESSAGE_LENGTH + 1) });
strict_1.default.equal(oversizedMessage.ok, false);
if (oversizedMessage.ok) {
    throw new Error("expected oversized message to be rejected");
}
strict_1.default.equal(oversizedMessage.error, "MESSAGE_TOO_LONG");
strict_1.default.equal(oversizedMessage.status, 400);
