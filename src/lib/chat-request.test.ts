import assert from "node:assert/strict";

import { MAX_CHAT_MESSAGE_LENGTH, normalizeChatMessage } from "./chat-request";

const validMessage = normalizeChatMessage({ message: "  hello world  " });

assert.equal(validMessage.ok, true);
if (!validMessage.ok) {
  throw new Error("expected valid message");
}

assert.equal(validMessage.value, "hello world");

const emptyMessage = normalizeChatMessage({ message: "   " });

assert.equal(emptyMessage.ok, false);
if (emptyMessage.ok) {
  throw new Error("expected empty message to be rejected");
}

assert.equal(emptyMessage.error, "EMPTY_MESSAGE");
assert.equal(emptyMessage.status, 400);

const oversizedMessage = normalizeChatMessage({ message: "x".repeat(MAX_CHAT_MESSAGE_LENGTH + 1) });

assert.equal(oversizedMessage.ok, false);
if (oversizedMessage.ok) {
  throw new Error("expected oversized message to be rejected");
}

assert.equal(oversizedMessage.error, "MESSAGE_TOO_LONG");
assert.equal(oversizedMessage.status, 400);
