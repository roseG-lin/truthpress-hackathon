import { type DebateJudgeCheck, type DebateRoundResult } from "./types";

export type VerdictAccent = "emerald" | "amber" | "rose" | "slate";
export type EvidenceStrength = "strong" | "medium" | "weak";

export function summarizeWinningSide(winningSide: DebateRoundResult["judge"]["winningSide"]): string {
  if (winningSide === "user") {
    return "当前用户一方更占上风";
  }
  if (winningSide === "opponent") {
    return "当前对手一方更占上风";
  }
  return "当前双方势均力敌";
}

export function getVerdictAccent(verdict: DebateJudgeCheck["verdict"]): VerdictAccent {
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

export function getEvidenceStrength(evidence: DebateJudgeCheck["evidence"]): EvidenceStrength {
  const best = evidence[0];

  if (!best || !best.url || best.title === "No search results" || best.title === "Search unavailable") {
    return "weak";
  }

  if ((best.snippet || "").length >= 30 && (best.title || "").length >= 10) {
    return "strong";
  }

  return "medium";
}
