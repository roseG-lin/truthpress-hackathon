type SessionUserLike = {
  id: string;
  secondMeId: string;
};

type NormalizeGenerateRequestInput = {
  topic?: string | null;
  requestedUserId?: string | null;
  enableEmpathy?: boolean;
  sessionUser?: SessionUserLike | null;
};

type NormalizeGenerateRequestResult =
  | {
      ok: true;
      value: {
        topic: string;
        userId: string;
        enableEmpathy: boolean;
        sessionUserId: string | null;
      };
    }
  | {
      ok: false;
      error: "MISSING_FIELDS" | "AUTH_REQUIRED_FOR_EMPATHY";
      status: 400 | 401;
    };

export function normalizeGenerateRequest(
  input: NormalizeGenerateRequestInput,
): NormalizeGenerateRequestResult {
  const topic = input.topic?.trim() || "";

  if (!topic) {
    return {
      ok: false,
      error: "MISSING_FIELDS",
      status: 400,
    };
  }

  if (input.sessionUser) {
    return {
      ok: true,
      value: {
        topic,
        userId: input.sessionUser.secondMeId,
        enableEmpathy: Boolean(input.enableEmpathy),
        sessionUserId: input.sessionUser.id,
      },
    };
  }

  if (input.enableEmpathy) {
    return {
      ok: false,
      error: "AUTH_REQUIRED_FOR_EMPATHY",
      status: 401,
    };
  }

  return {
    ok: true,
    value: {
      topic,
      userId: "anonymous",
      enableEmpathy: false,
      sessionUserId: null,
    },
  };
}
