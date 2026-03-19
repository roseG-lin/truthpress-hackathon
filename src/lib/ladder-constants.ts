// ============================================
// 求真社-TRUTHPRESS - 真理之梯动画常量配置
// Ladder Animation Constants - TruthPress
// 集中管理动画时长、缓动参数等魔法数字
// 参考：Apple HIG Motion + Material 3 Easing
// ============================================

/**
 * 动画时长配置（单位：秒）
 */
export const ANIMATION_DURATION = {
  /** 方块掉落动画 */
  DROP: 0.45,
  /** 验证通过动画 */
  VERIFY: 0.5,
  /** 推翻/摧毁动画 */
  DESTROY: 0.6,
  /** 退出动画 */
  EXIT: 0.35,
  /** 悬停效果 */
  HOVER: 0.2,
  /** 延迟间隔 */
  STAGGER: 0.1,
  /** 吸收动画 */
  ABSORB: 1.5,
  /** 漩涡动画 */
  VORTEX: 1,
  /** 等待脉冲动画 */
  WAIT_PULSE: 1.5,
  /** 活跃脉冲动画 */
  ACTIVE_PULSE: 1,
  /** 光晕脉冲动画 */
  HALO_PULSE: 2,
} as const;

/**
 * 弹簧物理参数
 * 参考：Apple HIG Spring Animation
 */
export const SPRING_CONFIG = {
  /** 标准弹簧 */
  STANDARD: {
    stiffness: 300,
    damping: 20,
    mass: 1,
  },
  /** 快速弹簧 */
  FAST: {
    stiffness: 400,
    damping: 25,
    mass: 1,
  },
  /** 慢速弹簧 */
  SLOW: {
    stiffness: 200,
    damping: 25,
    mass: 1.2,
  },
} as const;

/**
 * 缓动函数配置
 * Framer Motion 兼容的缓动函数
 */
export const EASING = {
  /** 标准缓入缓出 */
  easeInOut: "easeInOut",
  /** 缓出 */
  easeOut: "easeOut",
  /** 缓入 */
  easeIn: "easeIn",
  /** 线性 */
  linear: "linear",
} as const;

export type EasingType = keyof typeof EASING;

/**
 * 尺寸配置（像素）
 */
export const SIZE = {
  /** 方块最小高度 */
  BLOCK_MIN_HEIGHT: 48,
  /** 方块最大宽度 */
  BLOCK_MAX_WIDTH: 140,
  /** 方块内边距（水平） */
  BLOCK_PADDING_X: 16, // px-4
  /** 方块内边距（垂直） */
  BLOCK_PADDING_Y: 12, // py-3
  /** Avatar 容器尺寸 */
  AVATAR_SM: 40,
  AVATAR_MD: 48,
  AVATAR_LG: 64,
} as const;

/**
 * 颜色配置（Tailwind 色值）
 */
export const COLOR = {
  /** Agent A - 蓝色系 */
  A: {
    base: "#3b82f6", // blue-500
    light: "#60a5fa", // blue-400
    bg: "bg-[#3b82f6]",
    bgLight: "bg-[#60a5fa]",
    text: "text-blue-400",
  },
  /** Agent B - 红色系 */
  B: {
    base: "#ef4444", // red-500
    light: "#f87171", // red-400
    bg: "bg-[#ef4444]",
    bgLight: "bg-[#f87171]",
    text: "text-red-400",
  },
  /** Agent C - 紫色系 */
  C: {
    base: "#8b5cf6", // violet-500
    light: "#a78bfa", // violet-400
    baseIdle: "#94a3b8", // slate-400
    bg: "bg-[#8b5cf6]",
    bgLight: "bg-[#a78bfa]",
    bgIdle: "bg-[#94a3b8]",
    text: "text-purple-400",
  },
  /** Agent D - 紫红色系 */
  D: {
    base: "#a855f7", // purple-500
    light: "#c084fc", // purple-400
    bg: "bg-[#a855f7]",
    bgLight: "bg-[#c084fc]",
    text: "text-fuchsia-400",
  },
  /** 状态颜色 */
  STATUS: {
    verified: "#22c55e", // green-500
    debunked: "#dc2626", // red-600
    pending: "", // 使用 agent 颜色
    merged: "#8b5cf6", // violet-500
  },
} as const;

/**
 * SSE 降级超时配置（毫秒）
 */
export const SSE_TIMEOUT = {
  /** 无事件时切换到模拟模式的超时 */
  FALLBACK: 1500,
  /** AI 请求之间的延迟 */
  AI_DELAY: {
    A: 800,
    B: 600,
    D: 700,
    MERGE: 1000,
    SUMMARY: 2000,
  },
} as const;

/**
 * 限制配置
 */
export const LIMITS = {
  /** 最大方块数量（性能优化） */
  MAX_BLOCKS: 20,
  /** 最大日志条目数 */
  MAX_LOGS: 100,
  /** 最大文本长度 */
  MAX_TEXT_LENGTH: 50,
} as const;

/**
 * Z-index 层级配置
 */
export const Z_INDEX = {
  /** 背景层 */
  BACKGROUND: 0,
  /** 内容层 */
  CONTENT: 10,
  /** Avatar 层 */
  AVATAR: 20,
  /** 弹出层 */
  OVERLAY: 50,
} as const;

/**
 * 关键帧时间点（用于复杂动画）
 */
export const KEYFRAME_TIMES = {
  /** 标准三阶段动画时间点 */
  STANDARD: [0, 0.5, 1],
  /** 四阶段动画时间点 */
  EXTENDED: [0, 0.33, 0.66, 1],
} as const;

/**
 * 位移距离（像素）
 */
export const DISPLACEMENT = {
  /** 悬浮动画 Y 轴位移 */
  FLOAT_Y: 8,
  /** 掉落动画 Y 轴初始位移 */
  DROP_Y: -120,
  /** 震动动画 X 轴位移 */
  SHAKE_X: 8,
  /** 进入动画 X 轴位移 */
  ENTER_X: -20,
  /** 退出动画 X 轴位移序列 */
  EXIT_X: [0, -10, 10, 0],
  /** 震动动画 X 轴位移序列 */
  SHAKE_X_SEQUENCE: [0, -8, 8, -8, 8, 0],
};

/**
 * 缩放比例
 */
export const SCALE = {
  /** 初始缩放 */
  INITIAL: 0.85,
  /** 悬停缩放 */
  HOVER: 1.02,
  /** 活跃脉冲最大缩放 */
  ACTIVE_PULSE_MAX: 1.1,
  /** 光晕脉冲最大缩放 */
  HALO_PULSE_MAX: 1.3,
  /** 漩涡脉冲最大缩放 */
  VORTEX_MAX: 1.2,
  /** 退出缩放 */
  EXIT: 0.7,
} as const;

/**
 * 透明度值
 */
export const OPACITY = {
  /** 初始透明度 */
  INITIAL: 0,
  /** 完全不透明 */
  FULL: 1,
  /** 半透明 */
  HALF: 0.5,
  /** 光晕最小透明度 */
  HALO_MIN: 0.5,
  /** 状态图标初始旋转角度 */
  STATUS_ICON_ROTATION: -45,
} as const;

/**
 * 动画变体生成器
 * 帮助创建一致的 Framer Motion variants
 */
export function createSpringVariants(
  config: keyof typeof SPRING_CONFIG = "STANDARD"
) {
  const spring = SPRING_CONFIG[config];
  return {
    type: "spring" as const,
    stiffness: spring.stiffness,
    damping: spring.damping,
    mass: spring.mass,
  };
}

export function createDropVariants(
  duration = ANIMATION_DURATION.DROP
) {
  return {
    initial: {
      y: DISPLACEMENT.DROP_Y,
      opacity: OPACITY.INITIAL,
      scale: SCALE.INITIAL,
    },
    animate: {
      y: 0,
      opacity: OPACITY.FULL,
      scale: 1,
      transition: {
        ...createSpringVariants(),
        duration,
      },
    },
    exit: {
      opacity: OPACITY.INITIAL,
      scale: SCALE.EXIT,
      x: DISPLACEMENT.EXIT_X,
      transition: {
        duration: ANIMATION_DURATION.EXIT,
        ease: EASING.easeInOut,
      },
    },
  };
}

export function createPulseVariants(
  duration = ANIMATION_DURATION.ACTIVE_PULSE
) {
  return {
    scale: [1, SCALE.ACTIVE_PULSE_MAX, 1],
    transition: {
      repeat: Infinity,
      duration,
      ease: EASING.easeInOut,
    },
  };
}
