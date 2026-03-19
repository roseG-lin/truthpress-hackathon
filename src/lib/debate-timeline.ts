import { clampArenaStage } from "./cafe-stage";

export type DebateTimelineStatus = "complete" | "current" | "upcoming";

export type DebateTimelineEntry = {
  label: string;
  description: string;
  status: DebateTimelineStatus;
};

const TIMELINE_STEPS = [
  {
    label: "匹配器",
    description: "共识池正在搜索真实的相反立场，必要时生成合成对手。",
  },
  {
    label: "Agent A",
    description: "用户一方的辩手正在把原始观点打磨成开场陈词。",
  },
  {
    label: "Agent B",
    description: "匹配到的对手已经入场，开始给出反方立场与反驳。",
  },
  {
    label: "Judge C",
    description: "求真控制台正在发布裁决与证据堆栈。",
  },
] as const;

export function getDebateTimeline(stage: number): DebateTimelineEntry[] {
  const currentStage = clampArenaStage(stage);

  return TIMELINE_STEPS.map((step, index) => ({
    ...step,
    status:
      index < currentStage ? "complete" : index === currentStage ? "current" : "upcoming",
  }));
}
