import OpenAI from "openai";

type ChatOptions = {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  jsonMode?: boolean;
};

export function getLlmSettings() {
  return {
    apiKey:
      process.env.LLM_API_KEY ||
      process.env.DEEPSEEK_API_KEY ||
      process.env.OPENAI_API_KEY ||
      "",
    baseURL:
      process.env.LLM_BASE_URL ||
      process.env.DEEPSEEK_BASE_URL ||
      process.env.OPENAI_BASE_URL ||
      "https://api.deepseek.com",
    model:
      process.env.LLM_MODEL_NAME ||
      process.env.LLM_MODEL ||
      process.env.DEEPSEEK_MODEL ||
      "deepseek-chat",
  };
}

let sharedClient: OpenAI | null = null;

function getClient(): OpenAI {
  const settings = getLlmSettings();
  if (!settings.apiKey) {
    throw new Error("Missing LLM_API_KEY or DEEPSEEK_API_KEY in the environment.");
  }

  if (!sharedClient) {
    sharedClient = new OpenAI({
      apiKey: settings.apiKey,
      baseURL: settings.baseURL,
    });
  }

  return sharedClient;
}

export async function generateText(options: ChatOptions): Promise<string> {
  const settings = getLlmSettings();
  const completion = await getClient().chat.completions.create({
    model: settings.model,
    temperature: options.temperature ?? 0.4,
    messages: [
      { role: "system", content: options.systemPrompt },
      { role: "user", content: options.userPrompt },
    ],
    ...(options.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
  });

  return completion.choices[0]?.message?.content || "";
}
