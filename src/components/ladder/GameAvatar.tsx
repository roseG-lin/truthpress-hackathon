// ============================================
// GameAvatar - Animated Agent Avatar Component
// Platformer game character with smooth transitions
// ============================================

'use client';

import { motion } from 'framer-motion';
import {
  Lightbulb,
  Search,
  Scale,
  Zap,
  Sparkles,
  type LucideIcon
} from 'lucide-react';
import { getAgentConfig, type AgentConfig } from './GameAvatar.config';
import type { AgentType } from './game-types';

interface AgentPosition {
  stackIndex: number;
  isFalling: boolean;
  isDizzy: boolean;
}

interface GameAvatarProps {
  agent: AgentType;
  position: AgentPosition;
  isActive: boolean;
  isWaiting: boolean;
}

// 图标映射
const ICON_MAP: Record<string, LucideIcon> = {
  Lightbulb,
  Search,
  Scale,
  Zap,
};

export function GameAvatar({ agent, position, isActive, isWaiting }: GameAvatarProps) {
  const config = getAgentConfig(agent);
  const Icon = ICON_MAP[config.iconName] as LucideIcon;

  return (
    <motion.div
      layoutId={`agent-${agent}-avatar`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="relative flex flex-col items-center"
      style={{
        gridRow: position.stackIndex === -1 ? 'auto' : `${position.stackIndex + 1} / span 1`,
      }}
    >
      {/* Avatar circle */}
      <motion.div
        className={`
          relative w-12 h-12 rounded-full
          bg-gradient-to-br ${config.gradient}
          shadow-xl ${config.colorClass}/50
          flex items-center justify-center
          border-2 border-white/30
        `}
        animate={
          position.isFalling
            ? {
                y: [0, 20, 40, 60, 80],
                opacity: [1, 1, 0.8, 0.6, 0.4],
                rotate: [0, -10, 10, -10, 10],
                scale: [1, 0.9, 0.8, 0.7, 0.6],
              }
            : isActive
            ? {
                scale: [1, 1.15, 1],
                boxShadow: [
                  '0 0 20px rgba(255,255,255,0.3)',
                  '0 0 40px rgba(255,255,255,0.6)',
                  '0 0 20px rgba(255,255,255,0.3)',
                ],
              }
            : isWaiting
            ? {
                y: [0, -8, 0],
              }
            : {}
        }
        transition={
          position.isFalling
            ? { duration: 0.6, ease: 'easeIn' }
            : isActive
            ? { duration: 1, repeat: Infinity }
            : isWaiting
            ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
      >
        {/* Icon */}
        <Icon className="w-6 h-6 text-white drop-shadow-lg" strokeWidth={2.5} />

        {/* Halo effect for active state */}
        {isActive && !position.isFalling && (
          <motion.div
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.6, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className={`absolute inset-0 rounded-full ${config.colorClass}`}
          />
        )}

        {/* Dizzy emoji */}
        {position.isDizzy && (
          <motion.div
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: -20 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="absolute -top-8 text-2xl"
          >
            😵
          </motion.div>
        )}

        {/* Sparkles for active */}
        {isActive && !position.isFalling && (
          <>
            <motion.div
              initial={{ scale: 0, x: -20, y: -20 }}
              animate={{ scale: 1, x: -25, y: -25 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="absolute -top-2 -left-2"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </motion.div>
            <motion.div
              initial={{ scale: 0, x: 20, y: -20 }}
              animate={{ scale: 1, x: 25, y: -25 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </motion.div>
          </>
        )}
      </motion.div>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: position.isFalling ? 0 : 1 }}
        className="mt-2 text-center"
      >
        <span className="text-xs font-semibold text-white/90 uppercase tracking-wider">
          {config.label}
        </span>
        {position.stackIndex >= 0 && (
          <span className="block text-[10px] text-white/60">
            Level {position.stackIndex + 1}
          </span>
        )}
      </motion.div>

      {/* Ground indicator when on ground */}
      {position.stackIndex === -1 && !position.isFalling && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="absolute -bottom-4 w-16 h-1 bg-white/20 rounded-full"
        />
      )}
    </motion.div>
  );
}
