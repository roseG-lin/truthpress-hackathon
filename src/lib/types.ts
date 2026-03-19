export type {
  AgentAStage,
  AgentBStage,
  AgentCStage,
  AgentDStage,
  GenerateRequest,
  GenerateResponse,
  GenerateStageStatus,
  VerificationItem,
  VerificationResult,
} from "./generate-types";

export type OpinionSourceType = "secondme" | "anonymous" | "synthetic";

export type DebateCheckVerdict = "supported" | "mixed" | "unsupported" | "uncertain";

export type WinningSide = "user" | "opponent" | "draw";

export type ClaimSpeaker = "user" | "opponent";

export interface DebateUserProfile {
  userId: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  agentSummary?: string;
  sourceType: OpinionSourceType;
  secondMeId?: string;
}

export interface OpinionRecord {
  id: string;
  userId: string;
  topic: string;
  stanceText: string;
  agentSummary?: string;
  displayName: string;
  avatarUrl: string;
  sourceType: Exclude<OpinionSourceType, "synthetic">;
  createdAt: string;
}

export interface OpponentProfile {
  name: string;
  avatarUrl: string;
  bio: string;
  argument: string;
  sourceType: OpinionSourceType;
  matchedOpinionId?: string;
}

export interface SearchEvidence {
  title: string;
  snippet: string;
  url: string;
}

export interface DebateClaim {
  speaker: ClaimSpeaker;
  claim: string;
  query: string;
}

export interface DebateJudgeCheck {
  speaker: ClaimSpeaker;
  claim: string;
  verdict: DebateCheckVerdict;
  reason: string;
  evidence: SearchEvidence[];
}

export interface JudgeDecision {
  verdict: DebateCheckVerdict;
  summary: string;
  winningSide: WinningSide;
}

export interface DebateRoundResult {
  topic: string;
  user: {
    name: string;
    avatarUrl: string;
    stance: string;
  };
  opponent: OpponentProfile;
  transcript: {
    userArgument: string;
    opponentArgument: string;
  };
  truthConsole: {
    verdict: DebateCheckVerdict;
    summary: string;
    checks: DebateJudgeCheck[];
  };
  judge: JudgeDecision;
}
