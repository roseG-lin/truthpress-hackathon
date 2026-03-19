import {
  type GenerateRequest,
  type GenerateResponse,
  type GenerateStageStatus,
  type VerificationResult,
} from "./generate-types";
import { type AsyncTestCase } from "./__tests__/test-helpers";

const sampleRequest: GenerateRequest = {
  topic: "AI should replace teachers",
  userId: "user-123",
  enableEmpathy: true,
};

const sampleResponse: GenerateResponse = {
  stages: {
    agentA: {
      status: "completed",
      output: "Expanded claims",
    },
    agentB: {
      status: "completed",
      verification: [
        {
          claim: "AI can personalize learning",
          result: "verified",
          evidence: "Sample evidence",
        },
      ],
    },
    agentC: {
      status: "completed",
      output: "Structured conclusion",
    },
    agentD: {
      status: "completed",
      output: "Empathy supplement",
    },
  },
  finalContent: "Final answer",
};

export const generateTypesCases: AsyncTestCase[] = [
  {
    name: "GenerateRequest matches the project detail contract",
    run: () => {
      if (sampleRequest.topic !== "AI should replace teachers") {
        throw new Error("GenerateRequest.topic should be present");
      }
      if (sampleRequest.userId !== "user-123") {
        throw new Error("GenerateRequest.userId should be present");
      }
      if (sampleRequest.enableEmpathy !== true) {
        throw new Error("GenerateRequest.enableEmpathy should be present");
      }
    },
  },
  {
    name: "GenerateResponse contains all four agent stages and final content",
    run: () => {
      const stageKeys = Object.keys(sampleResponse.stages).sort().join(",");
      if (stageKeys !== "agentA,agentB,agentC,agentD") {
        throw new Error(`Unexpected stage keys: ${stageKeys}`);
      }
      if (sampleResponse.finalContent !== "Final answer") {
        throw new Error("GenerateResponse.finalContent should be present");
      }
    },
  },
  {
    name: "Generate status and verification unions include doc-defined values",
    run: () => {
      const processingStatus: GenerateStageStatus = "processing";
      const uncertainResult: VerificationResult = "uncertain";

      if (processingStatus !== "processing") {
        throw new Error("GenerateStageStatus should include processing");
      }
      if (uncertainResult !== "uncertain") {
        throw new Error("VerificationResult should include uncertain");
      }
    },
  },
];
