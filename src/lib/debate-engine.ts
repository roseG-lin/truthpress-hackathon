import {
  type DebateClaim,
  type DebateJudgeCheck,
  type DebateRoundResult,
  type DebateUserProfile,
  type OpponentProfile,
  type SearchEvidence,
} from "./types";
import { generateText as defaultGenerateText } from "./llm";
import { searchWeb as defaultSearchWeb } from "./search";

type DebateInput = {
  topic: string;
  userStance: string;
  user: DebateUserProfile;
  opponent: OpponentProfile;
};

type EngineDeps = {
  generateText?: (options: {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    jsonMode?: boolean;
  }) => Promise<string>;
  searchWeb?: (query: string) => Promise<SearchEvidence[]>;
};

type JudgeVerdict = {
  verdict?: string;
  summary?: string;
  winningSide?: string;
};

function stripCodeFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  const lines = trimmed.split("\n");
  if (lines[0].startsWith("```")) {
    lines.shift();
  }
  if (lines.at(-1)?.startsWith("```")) {
    lines.pop();
  }
  return lines.join("\n").trim();
}

function extractJsonBlock(value: string): string {
  const trimmed = stripCodeFence(value);
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : trimmed;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(extractJsonBlock(value)) as T;
  } catch {
    return fallback;
  }
}

function normalizeClaims(payload: { claims?: DebateClaim[] | Array<Record<string, string>> }): DebateClaim[] {
  return (payload.claims || [])
    .map((claim) => ({
      speaker: (claim.speaker === "opponent" ? "opponent" : "user") as DebateClaim["speaker"],
      claim: claim.claim || "",
      query: claim.query || claim.claim || "",
    }))
    .filter((claim) => claim.claim && claim.query);
}

function normalizeCheckVerdict(value?: string): DebateJudgeCheck["verdict"] {
  if (value === "supported" || value === "mixed" || value === "unsupported" || value === "uncertain") {
    return value;
  }
  return "uncertain";
}

function normalizeWinningSide(value?: string): DebateRoundResult["judge"]["winningSide"] {
  if (value === "user" || value === "opponent" || value === "draw") {
    return value;
  }
  return "draw";
}

export async function createSyntheticOpponent(topic: string, userStance: string): Promise<OpponentProfile> {
  const response = await defaultGenerateText({
    systemPrompt:
      "You create believable internet debate personas. Always return JSON with name, avatarUrl, bio, and argument.",
    userPrompt: `User believes "${topic}" and currently argues: "${userStance}". Generate a persona (name, avatarUrl, bio, argument) that strongly disagrees. Make it sound like a real internet user, not a robot.`,
    temperature: 0.8,
    jsonMode: true,
  });

  const parsed = parseJson<{
    name?: string;
    avatarUrl?: string;
    bio?: string;
    argument?: string;
  }>(response, {});

  return {
    name: parsed.name || "CounterPoint404",
    avatarUrl: parsed.avatarUrl || "",
    bio: parsed.bio || "A synthetic opponent generated to keep the debate moving.",
    argument:
      parsed.argument ||
      `I strongly disagree with the idea that ${topic}. The costs and blind spots are too serious to ignore.`,
    sourceType: "synthetic",
  };
}

export async function generateDebateRound(
  input: DebateInput,
  deps: EngineDeps = {},
): Promise<DebateRoundResult> {
  const generateText = deps.generateText || defaultGenerateText;
  const searchWeb = deps.searchWeb || defaultSearchWeb;

  const userArgument = await generateText({
    systemPrompt:
      "You are Agent A. Defend the user's controversial opinion with confidence, specificity, and internet-native rhetoric. Keep it concise but forceful.",
    userPrompt: `Topic: ${input.topic}\nUser stance: ${input.userStance}\nWrite the user's opening argument.`,
    temperature: 0.8,
  });

  const opponentArgument = await generateText({
    systemPrompt:
      "You are Agent B. Fully adopt the opponent persona and defend their disagreement in a vivid but grounded way.",
    userPrompt: `Topic: ${input.topic}\nOpponent bio: ${input.opponent.bio}\nOpponent argument seed: ${input.opponent.argument}\nWrite the opponent's opening argument in their voice.`,
    temperature: 0.8,
  });

  const extractedClaims = normalizeClaims(
    parseJson<{ claims?: DebateClaim[] }>(
      await generateText({
        systemPrompt:
          "You are Judge C's claim extraction helper. Read both opening arguments and return JSON only in the form {\"claims\":[{\"speaker\":\"user|opponent\",\"claim\":\"...\",\"query\":\"...\"}]}. Extract the strongest factual claims worth checking.",
        userPrompt: `Topic: ${input.topic}\nUser argument: ${userArgument}\nOpponent argument: ${opponentArgument}`,
        temperature: 0.1,
        jsonMode: true,
      }),
      { claims: [] },
    ),
  );

  const checks: DebateJudgeCheck[] = [];
  for (const claim of extractedClaims) {
    const evidence = await searchWeb(claim.query);
    const verdictPayload = parseJson<{ verdict?: string; reason?: string }>(
      await generateText({
        systemPrompt:
          "You are a neutral truth checker. Read the claim and evidence, then return JSON only with verdict and reason. Allowed verdicts: supported, mixed, unsupported, uncertain.",
        userPrompt: `Speaker: ${claim.speaker}\nClaim: ${claim.claim}\nEvidence: ${JSON.stringify(evidence, null, 2)}`,
        temperature: 0.1,
        jsonMode: true,
      }),
      {},
    );

    checks.push({
      speaker: claim.speaker,
      claim: claim.claim,
      verdict: normalizeCheckVerdict(verdictPayload.verdict),
      reason: verdictPayload.reason || "No explicit reasoning returned.",
      evidence,
    });
  }

  const finalVerdict = parseJson<JudgeVerdict>(
    await generateText({
      systemPrompt:
        "You are Judge C. Summarize the fact-check results and return JSON only with verdict, summary, and winningSide. Allowed verdicts: supported, mixed, unsupported, uncertain. Allowed winningSide: user, opponent, draw.",
      userPrompt: `Topic: ${input.topic}\nChecks: ${JSON.stringify(checks, null, 2)}`,
      temperature: 0.1,
      jsonMode: true,
    }),
    {},
  );

  const verdict = normalizeCheckVerdict(finalVerdict.verdict);
  const summary = finalVerdict.summary || "The debate produced a mixed factual record.";
  const winningSide = normalizeWinningSide(finalVerdict.winningSide);

  return {
    topic: input.topic,
    user: {
      name: input.user.displayName,
      avatarUrl: input.user.avatarUrl,
      stance: input.userStance,
    },
    opponent: {
      ...input.opponent,
      argument: opponentArgument,
    },
    transcript: {
      userArgument,
      opponentArgument,
    },
    truthConsole: {
      verdict,
      summary,
      checks,
    },
    judge: {
      verdict,
      summary,
      winningSide,
    },
  };
}
