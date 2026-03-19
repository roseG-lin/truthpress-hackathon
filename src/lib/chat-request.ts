export const MAX_CHAT_MESSAGE_LENGTH = 1000;

type ChatMessageResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      error: "INVALID_MESSAGE" | "EMPTY_MESSAGE" | "MESSAGE_TOO_LONG";
      status: 400;
    };

export function normalizeChatMessage(input: { message?: unknown } | null | undefined): ChatMessageResult {
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

  if (value.length > MAX_CHAT_MESSAGE_LENGTH) {
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
