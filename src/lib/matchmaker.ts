import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { type OpinionRecord, type OpponentProfile } from "./types";

export type { OpinionRecord } from "./types";

type OpinionInput = Omit<OpinionRecord, "id" | "createdAt">;

type OpinionStore = {
  load: () => Promise<OpinionRecord[]>;
  append: (input: OpinionInput) => Promise<OpinionRecord>;
  save: (opinions: OpinionRecord[]) => Promise<void>;
};

const POSITIVE_MARKERS = [
  "support",
  "good",
  "benefit",
  "should",
  "yes",
  "belong",
  "replace",
  "支持",
  "赞成",
  "应该",
  "好",
  "属于",
  "可以",
];

const NEGATIVE_MARKERS = [
  "oppose",
  "bad",
  "harm",
  "should not",
  "shouldn't",
  "no",
  "not",
  "against",
  "反对",
  "不该",
  "不好",
  "不能",
  "不属于",
  "不会",
];

function getDefaultStorePath(): string {
  return path.join(process.cwd(), "data", "opinions.json");
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text).split(" ").filter(Boolean);
}

function scoreTopicSimilarity(left: string, right: string): number {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));
  let overlap = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap;
}

function inferPolarity(text: string): 1 | -1 | 0 {
  const normalized = normalizeText(text);
  const positive = POSITIVE_MARKERS.reduce(
    (sum, marker) => sum + (normalized.includes(marker) ? 1 : 0),
    0,
  );
  const negative = NEGATIVE_MARKERS.reduce(
    (sum, marker) => sum + (normalized.includes(marker) ? 1 : 0),
    0,
  );

  if (positive === negative) {
    return 0;
  }

  return positive > negative ? 1 : -1;
}

async function ensureStoreFile(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });

  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, "[]", "utf8");
  }
}

export function createOpinionStore(filePath = getDefaultStorePath()): OpinionStore {
  return {
    async load() {
      await ensureStoreFile(filePath);
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as OpinionRecord[];
      return Array.isArray(parsed) ? parsed : [];
    },
    async append(input) {
      const opinions = await this.load();
      const nextOpinion: OpinionRecord = {
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        ...input,
      };
      opinions.push(nextOpinion);
      await this.save(opinions);
      return nextOpinion;
    },
    async save(opinions) {
      await ensureStoreFile(filePath);
      await writeFile(filePath, JSON.stringify(opinions, null, 2), "utf8");
    },
  };
}

export function findOpposingOpinion(
  currentOpinion: Pick<OpinionRecord, "userId" | "topic" | "stanceText">,
  opinions: OpinionRecord[],
): OpinionRecord | null {
  const currentPolarity = inferPolarity(`${currentOpinion.topic} ${currentOpinion.stanceText}`);
  const scored = opinions
    .filter((opinion) => opinion.userId !== currentOpinion.userId)
    .map((opinion) => {
      const candidatePolarity = inferPolarity(`${opinion.topic} ${opinion.stanceText}`);
      const topicScore = scoreTopicSimilarity(currentOpinion.topic, opinion.topic);
      const stanceScore = scoreTopicSimilarity(currentOpinion.stanceText, opinion.stanceText);
      const isOpposite =
        currentPolarity !== 0 &&
        candidatePolarity !== 0 &&
        currentPolarity !== candidatePolarity;

      return {
        opinion,
        score: topicScore * 3 + stanceScore + (isOpposite ? 6 : 0),
        isOpposite,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const opposite = scored.find((entry) => entry.isOpposite);
  return opposite?.opinion || null;
}

export async function resolveOpponent(
  input: {
    currentOpinion: OpinionInput;
    store: OpinionStore;
  },
  syntheticGenerator: (currentOpinion: OpinionInput) => Promise<OpponentProfile>,
): Promise<OpponentProfile> {
  const existingOpinions = await input.store.load();
  const matchedOpinion = findOpposingOpinion(input.currentOpinion, existingOpinions);
  await input.store.append(input.currentOpinion);

  if (matchedOpinion) {
    return {
      name: matchedOpinion.displayName,
      avatarUrl: matchedOpinion.avatarUrl,
      bio: `A previously matched ${matchedOpinion.sourceType} participant with a different take on "${matchedOpinion.topic}".`,
      argument: matchedOpinion.stanceText,
      sourceType: matchedOpinion.sourceType,
      matchedOpinionId: matchedOpinion.id,
    };
  }

  return syntheticGenerator(input.currentOpinion);
}
