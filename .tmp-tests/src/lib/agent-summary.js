"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAgentSummary = buildAgentSummary;
function extractStrings(value, bucket) {
    if (value === null || value === undefined) {
        return;
    }
    if (typeof value === "string") {
        bucket.push(value);
        return;
    }
    if (Array.isArray(value)) {
        value.forEach((entry) => extractStrings(entry, bucket));
        return;
    }
    if (typeof value === "object") {
        Object.values(value).forEach((entry) => extractStrings(entry, bucket));
    }
}
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}
function buildAgentSummary(shades, softMemory) {
    if (!shades && !softMemory) {
        return "";
    }
    const bucket = [];
    if (shades) {
        extractStrings(shades, bucket);
    }
    if (softMemory) {
        extractStrings(softMemory, bucket);
    }
    const tokens = bucket
        .map((entry) => normalizeText(entry))
        .filter(Boolean)
        .flatMap((entry) => entry.split(" "))
        .filter((token) => token.length >= 3);
    const unique = Array.from(new Set(tokens));
    return unique.slice(0, 24).join(" ");
}
