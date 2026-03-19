// ============================================
// 分步融合动画配置
// ACT 3 三步融合动画：LIFT → FLIGHT → DROP
// ============================================

export type MergePhaseType = 'LIFT' | 'FLIGHT' | 'DROP';

export interface MergePhase {
  phase: MergePhaseType;
  duration: number;
  x?: number[];
  y?: number[];
  scale?: number[];
  opacity?: number[];
  colorTransition?: {
    from: string;
    to: string;
  };
}

/**
 * 获取分步融合动画配置
 * 根据游戏脚本，融合动画分为三个阶段
 */
export function getMergeAnimationPhases(): MergePhase[] {
  return [
    // 阶段 1: 升空 (LIFT) - D 的 stack 向上移动
    {
      phase: 'LIFT',
      duration: 1200,
      y: [0, -30, -60, -100, -150],
      scale: [1, 1.02, 1.05, 1.08, 1.1],
      opacity: [1, 1, 1, 1, 0.9],
    },
    // 阶段 2: 横移 (FLIGHT) - D 的 stack 从右移到左，悬停在主栈上方
    {
      phase: 'FLIGHT',
      duration: 1800,
      x: [100, 75, 50, 25, 0],  // 从右（正值）向左移动到 0
      y: [-150, -150, -150, -150, -150],
      scale: [1.1, 1.08, 1.05, 1.02, 1],
      opacity: [0.9, 0.95, 1, 1, 1],
      colorTransition: {
        from: 'amber',
        to: 'violet',
      },
    },
    // 阶段 3: 下落合并 (DROP) - D 的 stack 下落合并到主栈
    {
      phase: 'DROP',
      duration: 600,
      x: [-100, -100, -50, -25, 0],
      y: [-150, -100, -50, -20, 0],
      scale: [1, 1.02, 1.05, 1.02, 1],
      opacity: [1, 1, 1, 1, 1],
    },
  ];
}

/**
 * 获取特定阶段的动画配置
 */
export function getMergePhase(phaseType: MergePhaseType): MergePhase {
  const phases = getMergeAnimationPhases();
  return phases.find(p => p.phase === phaseType)!;
}

/**
 * 获取融合动画的总持续时间
 */
export function getTotalMergeDuration(): number {
  return getMergeAnimationPhases().reduce((sum, p) => sum + p.duration, 0);
}

/**
 * 获取颜色渐变类名（用于 Tailwind）
 */
export function getMergeColorClass(step: number, totalSteps: number): string {
  const ratio = step / totalSteps;
  // 从 amber (金色) 渐变到 violet (紫色)
  if (ratio < 0.33) return 'bg-amber-400';
  if (ratio < 0.66) return 'bg-amber-300';
  return 'bg-violet-400';
}
