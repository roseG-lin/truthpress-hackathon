"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { Check, X } from "lucide-react";

// ============================================
// 类型定义 - Type Definitions
// ============================================

export type BlockStatus = "pending" | "verified" | "debunked" | "merged";
export type BlockAgent = "A" | "B" | "C" | "D";

interface BlockProps {
  id: string;
  agent: BlockAgent;
  text: string;
  status: BlockStatus;
  index: number;
  onStatusChange?: (id: string, status: BlockStatus) => void;
}

// ============================================
// 常量配置 - 使用集中管理的常量
// ============================================

import {
  COLOR,
  SIZE,
  ANIMATION_DURATION,
  SPRING_CONFIG,
  DISPLACEMENT,
  SCALE,
  OPACITY,
  EASING,
  createSpringVariants,
} from "@/lib/ladder-constants";

// 设计令牌
const AGENT_COLORS = {
  A: {
    base: "bg-[#3b82f6]",
    light: "bg-[#60a5fa]",
    border: "border-[#3b82f6]/30",
    glow: "shadow-[#3b82f6]/20",
  },
  B: {
    base: "bg-[#ef4444]",
    light: "bg-[#f87171]",
    border: "border-[#ef4444]/30",
    glow: "shadow-[#ef4444]/20",
  },
  C: {
    base: "bg-[#8b5cf6]",
    light: "bg-[#a78bfa]",
    border: "border-[#8b5cf6]/30",
    glow: "shadow-[#8b5cf6]/20",
  },
  D: {
    base: "bg-[#a855f7]",
    light: "bg-[#c084fc]",
    border: "border-[#a855f7]/30",
    glow: "shadow-[#a855f7]/20",
  },
};

const STATUS_COLORS = {
  verified: {
    base: `bg-[${COLOR.STATUS.verified}]`,
    light: "bg-[#4ade80]",
    border: "border-[#22c55e]/30",
    glow: "shadow-[#22c55e]/20",
  },
  debunked: {
    base: `bg-[${COLOR.STATUS.debunked}]`,
    light: "bg-[#f87171]",
    border: "border-[#dc2626]/30",
    glow: "shadow-[#dc2626]/20",
  },
  merged: {
    base: `bg-[${COLOR.STATUS.merged}]`,
    light: "bg-[#a78bfa]",
    border: "border-[#8b5cf6]/30",
    glow: "shadow-[#8b5cf6]/20",
  },
  pending: {
    base: "bg-opacity-70",
    light: "bg-opacity-50",
    border: "border-white/10",
    glow: "shadow-white/5",
  },
};

// ============================================
// 动画变体 - Animation Variants
// 使用集中管理的常量配置
// ============================================

/**
 * 方块掉落动画 - Scene 1: A 的狂想
 */
const blockVariants: Variants = {
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
      ...createSpringVariants("STANDARD"),
      duration: ANIMATION_DURATION.DROP,
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

/**
 * 验证通过动画 - Scene 2: B 的审判 (成功)
 */
const verifiedVariants: Variants = {
  pending: {
    backgroundColor: COLOR.A.base,
  },
  verified: {
    backgroundColor: [COLOR.A.base, COLOR.STATUS.verified],
    scale: [1, SCALE.ACTIVE_PULSE_MAX, 1],
    transition: {
      duration: ANIMATION_DURATION.VERIFY,
      ease: EASING.easeOut,
    },
  },
};

/**
 * 被推翻动画 - Scene 2: B 的审判 (失败)
 */
const debunkedVariants: Variants = {
  animate: {
    x: DISPLACEMENT.SHAKE_X_SEQUENCE,
    opacity: [OPACITY.FULL, OPACITY.FULL, OPACITY.FULL, OPACITY.INITIAL],
    scale: [1, 1, 0.8, OPACITY.INITIAL],
    rotate: [0, 5, -5, 15],
    transition: {
      duration: ANIMATION_DURATION.DESTROY,
      ease: EASING.easeInOut,
    },
  },
};

// ============================================
// 子组件 - Sub-components
// ============================================

/**
 * 状态图标组件
 */
const StatusIcon = ({ status }: { status: BlockStatus }) => {
  if (status === "verified") {
    return (
      <motion.span
        initial={{ scale: 0, rotate: OPACITY.STATUS_ICON_ROTATION }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...createSpringVariants("FAST"), delay: 0.3 }}
        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-lg"
        style={{ backgroundColor: COLOR.STATUS.verified }}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </motion.span>
    );
  }

  if (status === "debunked") {
    return (
      <motion.span
        initial={{ scale: 0, rotate: OPACITY.STATUS_ICON_ROTATION }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ ...createSpringVariants("FAST") }}
        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-white shadow-lg"
        style={{ backgroundColor: COLOR.STATUS.debunked }}
      >
        <X className="h-3 w-3" strokeWidth={3} />
      </motion.span>
    );
  }

  return null;
};

// ============================================
// 主组件 - Main Component
// ============================================

export default function Block({ id, agent, text, status, index }: BlockProps) {
  // 获取 Agent 颜色配置
  const agentColor = AGENT_COLORS[agent];
  const statusColor = STATUS_COLORS[status];

  // 确定最终背景色
  const getBackgroundClass = () => {
    if (status === "verified") return STATUS_COLORS.verified.base;
    if (status === "debunked") return STATUS_COLORS.debunked.base;
    if (status === "merged") return STATUS_COLORS.merged.base;
    return `${agentColor.base} ${STATUS_COLORS.pending.base}`;
  };

  // 获取动画变体
  const getVariants = () => {
    if (status === "debunked") return debunkedVariants;
    return blockVariants;
  };

  const variants = getVariants();

  return (
    <AnimatePresence mode="popLayout">
      {status !== "debunked" ? (
        <motion.div
          key={id}
          layoutId={`block-${id}`}
          data-agent={agent}
          data-status={status}
          data-index={index}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          whileHover={{
            scale: SCALE.HOVER,
            y: -2,
            transition: { duration: ANIMATION_DURATION.HOVER, ease: EASING.easeOut },
          }}
          className={`
            relative w-full max-w-[140px] min-h-[48px] rounded-2xl
            px-4 py-3 text-xs font-medium
            flex items-center justify-center
            text-white shadow-lg
            border border-white/10
            ${getBackgroundClass()}
          `}
          // 术语：无障碍数据属性
          role="article"
          aria-label={`Agent ${agent} statement: ${text}`}
          aria-live="polite"
        >
          {/* 状态图标 - 术语：绝对定位 + 弹簧动画 */}
          <StatusIcon status={status} />

          {/* Agent 标识徽章 */}
          <div className="absolute top-2 left-2 flex items-center gap-1 opacity-60">
            <span className="text-[9px] uppercase tracking-[0.15em]">
              {agent}
            </span>
          </div>

          {/* 文字内容 - 术语：文本截断 */}
          <span className="truncate max-w-[110px] text-center leading-relaxed">
            {text}
          </span>

          {/* 验证通过光晕效果 */}
          {status === "verified" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="absolute inset-0 rounded-2xl border-2 border-[#22c55e]/50"
            />
          )}
        </motion.div>
      ) : (
        // 被推翻方块的退出动画容器
        <motion.div
          key={`exit-${id}`}
          variants={debunkedVariants}
          initial="animate"
          animate="animate"
          className="relative w-full max-w-[140px] min-h-[48px] rounded-2xl bg-[#dc2626]/80 px-4 py-3 text-xs font-medium text-white"
        >
          <span className="truncate max-w-[110px] text-center">{text}</span>
          <X className="absolute -top-2 -right-2 h-5 w-5 text-[#dc2626]" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// 性能优化提示 - Performance Notes
// ============================================

/**
 * 1. layoutId 共享元素过渡
 *    - 使用 layoutId 实现平滑的共享元素动画
 *    - 避免不必要的 DOM 重排
 * 
 * 2. will-change 优化
 *    - Framer Motion 自动处理 transform 和 opacity
 *    - 避免过度使用 will-change 导致内存问题
 * 
 * 3. AnimatePresence mode="popLayout"
 *    - 确保退出动画完成后再移除 DOM
 *    - 防止布局跳动
 * 
 * 4. 限制方块数量
 *    - 建议 MAX_BLOCKS = 20
 *    - 防止过多 DOM 元素影响性能
 */
