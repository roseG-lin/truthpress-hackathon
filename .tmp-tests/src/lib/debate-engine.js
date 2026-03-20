"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSyntheticOpponent = createSyntheticOpponent;
exports.generateDebateRound = generateDebateRound;
const llm_1 = require("./llm");
const search_1 = require("./search");
function stripCodeFence(value) {
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
function extractJsonBlock(value) {
    const trimmed = stripCodeFence(value);
    const match = trimmed.match(/\{[\s\S]*\}/);
    return match ? match[0] : trimmed;
}
function parseJson(value, fallback) {
    try {
        return JSON.parse(extractJsonBlock(value));
    }
    catch {
        return fallback;
    }
}
function normalizeClaims(payload) {
    return (payload.claims || [])
        .map((claim) => ({
        speaker: (claim.speaker === "opponent" ? "opponent" : "user"),
        claim: claim.claim || "",
        query: claim.query || claim.claim || "",
    }))
        .filter((claim) => claim.claim && claim.query);
}
function normalizeCheckVerdict(value) {
    if (value === "supported" || value === "mixed" || value === "unsupported" || value === "uncertain") {
        return value;
    }
    return "uncertain";
}
function normalizeWinningSide(value) {
    if (value === "user" || value === "opponent" || value === "draw") {
        return value;
    }
    return "draw";
}
async function createSyntheticOpponent(topic, userStance) {
    const response = await (0, llm_1.generateText)({
        systemPrompt: "You create believable internet debate personas. Always return JSON with name, avatarUrl, bio, and argument.",
        userPrompt: `User believes "${topic}" and currently argues: "${userStance}". Generate a persona (name, avatarUrl, bio, argument) that strongly disagrees. Make it sound like a real internet user, not a robot.`,
        temperature: 0.8,
        jsonMode: true,
    });
    const parsed = parseJson(response, {});
    return {
        name: parsed.name || "CounterPoint404",
        avatarUrl: parsed.avatarUrl || "",
        bio: parsed.bio || "A synthetic opponent generated to keep the debate moving.",
        argument: parsed.argument ||
            `I strongly disagree with the idea that ${topic}. The costs and blind spots are too serious to ignore.`,
        sourceType: "synthetic",
    };
}
async function generateDebateRound(input, deps = {}) {
    const generateText = deps.generateText || llm_1.generateText;
    const searchWeb = deps.searchWeb || search_1.searchWeb;
    const userArgument = await generateText({
        systemPrompt: "You are Agent A. Defend the user's controversial opinion with confidence, specificity, and internet-native rhetoric. Keep it concise but forceful.",
        userPrompt: `Topic: ${input.topic}\nUser stance: ${input.userStance}\nWrite the user's opening argument.`,
        temperature: 0.8,
    });
    const opponentArgument = await generateText({
        systemPrompt: "You are Agent B. Fully adopt the opponent persona and defend their disagreement in a vivid but grounded way.",
        userPrompt: `Topic: ${input.topic}\nOpponent bio: ${input.opponent.bio}\nOpponent argument seed: ${input.opponent.argument}\nWrite the opponent's opening argument in their voice.`,
        temperature: 0.8,
    });
    const extractedClaims = normalizeClaims(parseJson(await generateText({
        systemPrompt: "You are Judge C's claim extraction helper. Read both opening arguments and return JSON only in the form {\"claims\":[{\"speaker\":\"user|opponent\",\"claim\":\"...\",\"query\":\"...\"}]}. Extract the strongest factual claims worth checking.",
        userPrompt: `Topic: ${input.topic}\nUser argument: ${userArgument}\nOpponent argument: ${opponentArgument}`,
        temperature: 0.1,
        jsonMode: true,
    }), { claims: [] }));
    const checks = [];
    for (const claim of extractedClaims) {
        const evidence = await searchWeb(claim.query);
        const verdictPayload = parseJson(await generateText({
            systemPrompt: "You are a neutral truth checker. Read the claim and evidence, then return JSON only with verdict and reason. Allowed verdicts: supported, mixed, unsupported, uncertain.",
            userPrompt: `Speaker: ${claim.speaker}\nClaim: ${claim.claim}\nEvidence: ${JSON.stringify(evidence, null, 2)}`,
            temperature: 0.1,
            jsonMode: true,
        }), {});
        checks.push({
            speaker: claim.speaker,
            claim: claim.claim,
            verdict: normalizeCheckVerdict(verdictPayload.verdict),
            reason: verdictPayload.reason || "No explicit reasoning returned.",
            evidence,
        });
    }
    const finalVerdict = parseJson(await generateText({
        systemPrompt: "You are Judge C. Summarize the fact-check results and return JSON only with verdict, summary, and winningSide. Allowed verdicts: supported, mixed, unsupported, uncertain. Allowed winningSide: user, opponent, draw.",
        userPrompt: `Topic: ${input.topic}\nChecks: ${JSON.stringify(checks, null, 2)}`,
        temperature: 0.1,
        jsonMode: true,
    }), {});
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
