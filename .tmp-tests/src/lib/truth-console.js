"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeWinningSide = summarizeWinningSide;
exports.getVerdictAccent = getVerdictAccent;
exports.getEvidenceStrength = getEvidenceStrength;
function summarizeWinningSide(winningSide) {
    if (winningSide === "user") {
        return "当前用户一方更占上风";
    }
    if (winningSide === "opponent") {
        return "当前对手一方更占上风";
    }
    return "当前双方势均力敌";
}
function getVerdictAccent(verdict) {
    if (verdict === "supported") {
        return "emerald";
    }
    if (verdict === "mixed") {
        return "amber";
    }
    if (verdict === "unsupported") {
        return "rose";
    }
    return "slate";
}
function getEvidenceStrength(evidence) {
    const best = evidence[0];
    if (!best || !best.url || best.title === "No search results" || best.title === "Search unavailable") {
        return "weak";
    }
    if ((best.snippet || "").length >= 30 && (best.title || "").length >= 10) {
        return "strong";
    }
    return "medium";
}
