export type GenerateStageStatus = "pending" | "processing" | "completed";

export type VerificationResult = "verified" | "debunked" | "uncertain";

export interface GenerateRequest {
  topic: string;
  userId: string;
  enableEmpathy: boolean;
}

export interface AgentAStage {
  status: GenerateStageStatus;
  output: string;
}

export interface VerificationItem {
  claim: string;
  result: VerificationResult;
  evidence?: string;
}

export interface AgentBStage {
  status: GenerateStageStatus;
  verification: VerificationItem[];
}

export interface AgentCStage {
  status: GenerateStageStatus;
  output: string;
}

export interface AgentDStage {
  status: "idle" | "processing" | "completed";
  output?: string;
}

export interface GenerateResponse {
  stages: {
    agentA: AgentAStage;
    agentB: AgentBStage;
    agentC: AgentCStage;
    agentD: AgentDStage;
  };
  finalContent: string;
  empatheticSupplement?: string;
}
