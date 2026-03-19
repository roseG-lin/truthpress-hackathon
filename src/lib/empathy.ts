type EmpathyInput = {
  originalContent: string;
  userFeedback: string;
  memorySummary?: string;
  userBackground?: string;
};

type EmpathyDeps = {
  generateText?: (options: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
  }) => Promise<string>;
};

type EmpathyContextInput = {
  isAnonymous: boolean;
  memorySummary?: string;
  userBackground?: string;
};

type EmpathyContext =
  | {
      ok: true;
      memorySummary?: string;
      userBackground?: string;
    }
  | {
      ok: false;
      error: "BACKGROUND_REQUIRED";
    };

export function resolveEmpathyContext(input: EmpathyContextInput): EmpathyContext {
  const memorySummary = input.memorySummary?.trim() || "";
  const userBackground = input.userBackground?.trim() || "";

  if (input.isAnonymous && !userBackground) {
    return { ok: false, error: "BACKGROUND_REQUIRED" };
  }

  return {
    ok: true,
    memorySummary: memorySummary || undefined,
    userBackground: userBackground || undefined,
  };
}

export function buildEmpathyPrompt(input: EmpathyInput) {
  const memoryLine = input.memorySummary ? `User memory: ${input.memorySummary}` : "";
  const backgroundLine = input.userBackground ? `User background: ${input.userBackground}` : "";

  return {
    systemPrompt:
      "你是 Agent D，共情桥梁。请勿引入新事实，仅用温暖的中文重新表述已核实的内容，让用户感受到被理解。",
    userPrompt: [
      `Verified content: ${input.originalContent}`,
      `User feedback: ${input.userFeedback}`,
      memoryLine,
      backgroundLine,
      "Write a warm, concise supplement (80-150 Chinese characters).",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export async function generateEmpathySupplement(input: EmpathyInput, deps: EmpathyDeps = {}) {
  if (!input.originalContent?.trim()) {
    throw new Error("originalContent is required");
  }
  if (!input.userFeedback?.trim()) {
    throw new Error("userFeedback is required");
  }

  const prompt = buildEmpathyPrompt(input);
  if (!deps.generateText) {
    const { generateText: defaultGenerateText } = await import("./llm");
    const result = await defaultGenerateText({
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      temperature: 0.5,
    });
    return result.trim();
  }

  const result = await deps.generateText({
    systemPrompt: prompt.systemPrompt,
    userPrompt: prompt.userPrompt,
    temperature: 0.5,
  });
  return result.trim();
}
