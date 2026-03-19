"use server";

import { createSyntheticOpponent, generateDebateRound as runDebateRound } from "@/lib/debate-engine";
import { createOpinionStore, resolveOpponent } from "@/lib/matchmaker";
import { getCurrentDebateUser } from "@/lib/runtime";

export type DebateActionInput = {
  topic: string;
  stanceText: string;
};

export async function generateDebateRound(input: DebateActionInput) {
  const topic = input.topic.trim();
  const stanceText = input.stanceText.trim();

  if (!topic || !stanceText) {
    throw new Error("Both topic and opinion are required before matchmaking can begin.");
  }

  const user = await getCurrentDebateUser();
  const store = createOpinionStore();
  const opponent = await resolveOpponent(
    {
      currentOpinion: {
        userId: user.userId,
        topic,
        stanceText,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        sourceType: user.sourceType === "secondme" ? "secondme" : "anonymous",
      },
      store,
    },
    async (currentOpinion) => createSyntheticOpponent(currentOpinion.topic, currentOpinion.stanceText),
  );

  const round = await runDebateRound({
    topic,
    userStance: stanceText,
    user,
    opponent,
  });

  return {
    matched: true,
    matchSource: opponent.sourceType,
    round,
  };
}
