"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOpinionStore = createOpinionStore;
exports.findOpposingOpinion = findOpposingOpinion;
exports.resolveOpponent = resolveOpponent;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = require("node:crypto");
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
function getDefaultStorePath() {
    return node_path_1.default.join(process.cwd(), "data", "opinions.json");
}
function normalizeText(text) {
    return text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}
function tokenize(text) {
    return normalizeText(text).split(" ").filter(Boolean);
}
function scoreTopicSimilarity(left, right) {
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
function inferPolarity(text) {
    const normalized = normalizeText(text);
    const positive = POSITIVE_MARKERS.reduce((sum, marker) => sum + (normalized.includes(marker) ? 1 : 0), 0);
    const negative = NEGATIVE_MARKERS.reduce((sum, marker) => sum + (normalized.includes(marker) ? 1 : 0), 0);
    if (positive === negative) {
        return 0;
    }
    return positive > negative ? 1 : -1;
}
async function ensureStoreFile(filePath) {
    await (0, promises_1.mkdir)(node_path_1.default.dirname(filePath), { recursive: true });
    try {
        await (0, promises_1.readFile)(filePath, "utf8");
    }
    catch {
        await (0, promises_1.writeFile)(filePath, "[]", "utf8");
    }
}
function createOpinionStore(filePath = getDefaultStorePath()) {
    return {
        async load() {
            await ensureStoreFile(filePath);
            const raw = await (0, promises_1.readFile)(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        },
        async append(input) {
            const opinions = await this.load();
            const nextOpinion = {
                id: (0, node_crypto_1.randomUUID)(),
                createdAt: new Date().toISOString(),
                ...input,
            };
            opinions.push(nextOpinion);
            await this.save(opinions);
            return nextOpinion;
        },
        async save(opinions) {
            await ensureStoreFile(filePath);
            await (0, promises_1.writeFile)(filePath, JSON.stringify(opinions, null, 2), "utf8");
        },
    };
}
function findOpposingOpinion(currentOpinion, opinions) {
    const currentPolarity = inferPolarity(`${currentOpinion.topic} ${currentOpinion.stanceText}`);
    const scored = opinions
        .filter((opinion) => opinion.userId !== currentOpinion.userId)
        .map((opinion) => {
        const candidatePolarity = inferPolarity(`${opinion.topic} ${opinion.stanceText}`);
        const topicScore = scoreTopicSimilarity(currentOpinion.topic, opinion.topic);
        const stanceScore = scoreTopicSimilarity(currentOpinion.stanceText, opinion.stanceText);
        const isOpposite = currentPolarity !== 0 &&
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
async function resolveOpponent(input, syntheticGenerator) {
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
