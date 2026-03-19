// ============================================
// GameBlock 动画配置
// 方块震动、扫描、破碎效果参数
// ============================================

/**
 * 震动动画配置
 */
export interface ShakeAnimation {
  x: number[];
  opacity?: number[];
  scale?: number[];
  rotate?: number[];
  duration: number;
}

/**
 * 扫描效果配置（Agent B 审计时使用）
 */
export interface ScanAnimation {
  sweepX: number[];
  duration: number;
  color: string;
}

/**
 * 获取被推翻方块的震动动画
 * 游戏脚本要求：x: [-8, 8, -6, 6, -4, 4, 0]
 */
export function getRejectedBlockAnimation(): ShakeAnimation {
  return {
    // X 轴震动：逐渐减弱的左右摇晃
    x: [-8, 8, -6, 6, -4, 4, 0],
    // 透明度：从完全不透明到半透明
    opacity: [1, 1, 0.8, 0.6, 0.4, 0.2, 0],
    // 缩放：逐渐变小
    scale: [1, 0.95, 0.9, 0.8, 0.6, 0.4, 0],
    // 旋转：逐渐增大角度，增强破碎感
    rotate: [0, 5, -5, 10, -10, 15, -15],
    // 持续时间：0.8 秒（给足够时间看到破碎）
    duration: 0.8,
  };
}

/**
 * 获取扫描效果动画（Agent B 审计时使用）
 */
export function getShakeAnimation(): ScanAnimation {
  return {
    // 扫描光线从左到右的位置（百分比）
    sweepX: [0, 25, 50, 75, 100],
    // 扫描持续时间
    duration: 1.2,
    // 扫描光线颜色（红色激光效果）
    color: 'rgba(239, 68, 68, 0.8)',
  };
}

/**
 * 获取扫描关键帧动画配置
 */
export function getScanKeyframes() {
  return {
    // 扫描线位置从左到右
    left: ['0%', '25%', '50%', '75%', '100%'],
    // 透明度变化
    opacity: [0, 1, 1, 1, 0],
    // 扫描线宽度变化
    width: ['2px', '4px', '4px', '4px', '2px'],
  };
}
