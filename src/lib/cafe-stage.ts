export const ARENA_STAGE_COUNT = 4;

export type ArenaRevealStage = 0 | 1 | 2 | 3;

export function clampArenaStage(stage: number): ArenaRevealStage {
  if (stage <= 0) {
    return 0;
  }
  if (stage === 1) {
    return 1;
  }
  if (stage === 2) {
    return 2;
  }
  return 3;
}

export function getArenaVisibility(stage: number) {
  const normalized = clampArenaStage(stage);

  return {
    matchBanner: normalized >= 0,
    userPanel: normalized >= 1,
    opponentPanel: normalized >= 2,
    judgePanel: normalized >= 3,
  };
}

export function getArenaStageLabel(stage: number): string {
  const normalized = clampArenaStage(stage);
  const labels = [
    "匹配成功",
    "Agent A 正在登场",
    "对手回应即将出现",
    "Judge C 正在更新求真控制台",
  ] as const;

  return labels[normalized];
}

export function getArenaStageDescription(stage: number): string {
  const normalized = clampArenaStage(stage);
  const descriptions = [
    "匹配器已经锁定对手，辩论擂台正式开启。",
    "Agent A 正在把用户立场整理成锋利的开场陈词。",
    "Agent B 正带着对手人格设定进入现场并发起反击。",
    "Judge C 正把证据核查后的裁决发布到中央求真控制台。",
  ] as const;

  return descriptions[normalized];
}

export function getArenaProgress(stage: number): number {
  const normalized = clampArenaStage(stage);
  return (normalized + 1) * 25;
}
