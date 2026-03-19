"use client";

import { motion, Variants } from "framer-motion";
import { Shield, Gavel, Scale, Lightbulb, Sparkles } from "lucide-react";

// ============================================
// 类型定义 - Type Definitions
// ============================================

export type AgentType = "A" | "B" | "C" | "D";

interface AvatarProps {
  agent: AgentType;
  position: number; // 当前在第几层方块
  waiting?: boolean;
  active?: boolean;
  color?: string; // 用于 C 吸收后的颜色变化
  size?: "sm" | "md" | "lg";
}

// ============================================
// 设计令牌 - Design Tokens
// ============================================

const AGENT_CONFIG = {
  A: {
    baseColor: "#3b82f6",
    activeColor: "#60a5fa",
    waitingColor: "rgba(59, 130, 246, 0.5)",
    icon: Shield,
    label: "辩护方",
    gradient: "from-[#3b82f6] to-[#60a5fa]",
  },
  B: {
    baseColor: "#ef4444",
    activeColor: "#f87171",
    waitingColor: "rgba(239, 68, 68, 0.5)",
    icon: Gavel,
    label: "反对方",
    gradient: "from-[#ef4444] to-[#f87171]",
  },
  C: {
    baseColor: "#94a3b8",
    activeColor: "#a78bfa",
    waitingColor: "rgba(148, 163, 184, 0.5)",
    icon: Scale,
    label: "法官",
    gradient: "from-[#94a3b8] to-[#8b5cf6]",
  },
  D: {
    baseColor: "#a855f7",
    activeColor: "#c084fc",
    waitingColor: "rgba(168, 85, 247, 0.5)",
    icon: Lightbulb,
    label: "用户",
    gradient: "from-[#a855f7] to-[#c084fc]",
  },
} as const;

const SIZE_CONFIG = {
  sm: {
    container: "h-10 w-10",
    icon: "h-5 w-5",
    fontSize: "text-[10px]",
  },
  md: {
    container: "h-12 w-12",
    icon: "h-6 w-6",
    fontSize: "text-xs",
  },
  lg: {
    container: "h-16 w-16",
    icon: "h-8 w-8",
    fontSize: "text-sm",
  },
} as const;

// ============================================
// 动画变体 - Animation Variants
// 术语标注：关键帧动画、弹簧物理、交互动效
// ============================================

/**
 * 等待状态悬浮动画
 * 术语：关键帧动画 (Keyframe Animation)
 * 参考：Apple HIG - Ambient Motion
 */
const waitingVariants: Variants = {
  waiting: {
    y: [0, -8, 0],
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "easeInOut",
      times: [0, 0.5, 1],
    },
  },
};

/**
 * 活跃状态脉冲动画
 * 术语：属性动画 (Property Animation) + 光晕效果
 * 参考：Material 3 - Active State Feedback
 */
const activeVariants: Variants = {
  active: {
    scale: [1, 1.1, 1],
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: "easeInOut",
    },
  },
};

/**
 * 光晕脉冲效果
 * 术语：透明度动画 + 缩放
 */
const haloVariants: Variants = {
  pulse: {
    scale: [1, 1.3, 1],
    opacity: [0.5, 0, 0.5],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "easeInOut",
    },
  },
};

/**
 * 漩涡吸收效果 (Agent C)
 * 术语：旋转动画 + 缩放脉冲
 * 参考：Scene 3 - C 吸收 D
 */
const vortexVariants: Variants = {
  vortex: {
    scale: [1, 1.2, 1],
    rotate: [0, 360],
    transition: {
      duration: 1,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

/**
 * 入场动画
 * 术语：淡入 + 缩放
 */
const enterVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      duration: 0.3,
    },
  },
};

// ============================================
// 子组件 - Sub-components
// ============================================

/**
 * 光晕效果组件
 */
const HaloEffect = ({ color, variants }: { color: string; variants: Variants }) => (
  <motion.div
    variants={variants}
    animate="pulse"
    className="absolute inset-0 rounded-full"
    style={{
      backgroundColor: color,
    }}
  />
);

/**
 * 状态指示点
 */
const StatusDot = ({ active }: { active: boolean }) => (
  <motion.div
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className={`h-2 w-2 rounded-full ${active ? "bg-green-400" : "bg-gray-500"}`}
  />
);

// ============================================
// 主组件 - Main Component
// ============================================

export default function Avatar({
  agent,
  position,
  waiting = false,
  active = false,
  color,
  size = "md",
}: AvatarProps) {
  const config = AGENT_CONFIG[agent];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  // 确定当前状态颜色
  const getCurrentColor = () => {
    if (color) return color;
    if (waiting) return config.waitingColor;
    if (active) return config.activeColor;
    return config.baseColor;
  };

  const currentColor = getCurrentColor();

  // 确定动画变体
  const getAnimationVariants = () => {
    if (waiting) return waitingVariants;
    if (active) return activeVariants;
    return {};
  };

  const animationVariants = getAnimationVariants();

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      variants={enterVariants}
      initial="initial"
      animate="animate"
      // 术语：无障碍支持
      role="img"
      aria-label={`Agent ${agent} - ${config.label}`}
      aria-live="polite"
    >
      {/* Avatar 容器 - 术语：相对定位 + 玻璃拟态 */}
      <motion.div
        variants={animationVariants}
        animate={waiting ? "waiting" : active ? "active" : undefined}
        className={`
          relative flex ${sizeConfig.container} items-center justify-center
          rounded-full text-white shadow-lg
          bg-gradient-to-br ${config.gradient}
          border border-white/20
          backdrop-blur-sm
        `}
        style={{
          backgroundColor: color || undefined,
        }}
        whileHover={{
          scale: 1.05,
          transition: { duration: 0.2 },
        }}
      >
        {/* 图标 */}
        <Icon className={`${sizeConfig.icon} drop-shadow-md`} strokeWidth={2.5} />

        {/* 活跃状态光晕 - 术语：绝对定位 + 动画 */}
        {active && (
          <HaloEffect color={config.activeColor} variants={haloVariants} />
        )}

        {/* 漩涡效果 (Agent C 吸收时) */}
        {agent === "C" && active && (
          <motion.div
            variants={vortexVariants}
            animate="vortex"
            className="absolute inset-0 rounded-full border-2 border-white/30"
          />
        )}

        {/* 状态指示点 - 术语：绝对定位 */}
        <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#0b1220] border border-white/20">
          <StatusDot active={active || waiting} />
        </div>
      </motion.div>

      {/* 标签文字 */}
      <span className={`${sizeConfig.fontSize} font-medium text-white/80 uppercase tracking-[0.15em]`}>
        {config.label}
      </span>

      {/* 位置指示 */}
      {position > 0 && (
        <motion.span
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-white/50"
        >
          L{position}
        </motion.span>
      )}

      {/* 等待提示 - 术语：透明度渐变动画 */}
      {waiting && (
        <motion.span
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-[10px] text-white/50"
        >
          等待中...
        </motion.span>
      )}

      {/* 活跃提示 */}
      {active && !waiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3 text-yellow-300" />
          <span className="text-[10px] text-yellow-300/80">发言中</span>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// 使用示例 - Usage Examples
// ============================================

/**
 * 基础用法:
 * 
 * <Avatar agent="A" position={3} />
 * 
 * 等待状态:
 * 
 * <Avatar agent="B" position={0} waiting />
 * 
 * 活跃状态:
 * 
 * <Avatar agent="C" position={2} active />
 * 
 * 自定义颜色 (C 吸收后):
 * 
 * <Avatar agent="C" position={5} color="#8b5cf6" />
 * 
 * 大尺寸:
 * 
 * <Avatar agent="A" position={1} size="lg" active />
 */

// ============================================
// 性能优化提示 - Performance Notes
// ============================================

/**
 * 1. 使用 will-change 优化
 *    - Framer Motion 自动处理 transform
 *    - 避免过度使用导致内存问题
 * 
 * 2. 图标懒加载
 *    - Lucide React 支持 tree-shaking
 *    - 仅导入需要的图标
 * 
 * 3. 动画降级
 *    - 尊重 prefers-reduced-motion
 *    - 在 globals.css 中已配置
 */
