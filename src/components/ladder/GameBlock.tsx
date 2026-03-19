// ============================================
// GameBlock - Animated Block Component
// Platformer game visualization
// ============================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Block } from './game-types';
import { BLOCK_COLORS } from './game-types';
import { getRejectedBlockAnimation, getScanKeyframes } from './GameBlock.config';
import { ScanEffect } from './ScanEffect';

interface GameBlockProps {
  block: Block;
  index: number;
  isActive: boolean;
  isMerging: boolean;
  isScanning?: boolean;
}

export function GameBlock({ block, index, isActive, isMerging, isScanning = false }: GameBlockProps) {
  const isRejected = block.status === 'rejected' || block.status === 'debunked' || block.status === 'uncertain';
  const colorScheme = BLOCK_COLORS[block.status] || BLOCK_COLORS[block.owner];

  return (
    <AnimatePresence mode="wait">
      {!isRejected && (
        <motion.div
          key={block.id}
          layoutId={block.id}
          initial={{
            y: -100,
            opacity: 0,
            scale: 0.7,
            rotate: -5,
          }}
          animate={{
            y: isMerging ? -150 - index * 30 : 0,
            opacity: 1,
            scale: isActive ? 1.08 : 1,
            rotate: 0,
          }}
          exit={{
            x: [0, -10, 10, -10, 10, 0],
            opacity: [1, 1, 0.8, 0.5, 0.2, 0],
            scale: [1, 0.9, 0.7, 0.5, 0.3, 0],
            rotate: [0, 5, -5, 10, -10, 15],
            transition: { duration: 0.6 },
          }}
          transition={{
            type: 'spring',
            stiffness: 280,
            damping: 18,
            mass: 0.8,
            layout: { duration: 0.5 },
          }}
          className={`
            relative w-full min-h-[64px] max-h-[96px]
            rounded-xl border-2 px-4 py-3
            ${colorScheme.bg} ${colorScheme.border}
            shadow-xl ${colorScheme.glow}
            flex items-center justify-center
            backdrop-blur-sm overflow-hidden
            cursor-pointer
          `}
          style={{
            transformOrigin: 'bottom center',
          }}
          whileHover={{
            scale: 1.05,
            zIndex: 10,
            transition: { duration: 0.2 },
          }}
        >
          {/* Block shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/25 to-transparent rounded-xl" />

          {/* Scan effect when Agent B is auditing */}
          {isScanning && <ScanEffect active={true} />}

          {/* Verified indicator */}
          {block.status === 'verified' && (
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
              className="absolute -top-2 -right-2 w-7 h-7 bg-green-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}

          {/* Owner badge */}
          <div className="absolute top-2 left-2 flex items-center gap-1 opacity-70">
            <span className="text-[9px] font-bold text-white/90 uppercase tracking-wider">
              Agent {block.owner}
            </span>
          </div>

          {/* Text content with truncation */}
          <div className="relative z-10 w-full">
            <p className="text-white text-sm font-medium text-center drop-shadow-lg line-clamp-2">
              {block.text}
            </p>
            
            {/* Active highlight */}
            {isActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0, 0.5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute inset-0 rounded-xl bg-yellow-300/40"
              />
            )}
          </div>

          {/* Bottom glow bar */}
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${colorScheme.bg} opacity-60`} />
        </motion.div>
      )}

      {/* Rejected block - show briefly before disappearing */}
      {isRejected && (
        <motion.div
          key={`rejected-${block.id}`}
          initial={{ opacity: 1 }}
          animate={{
            x: getRejectedBlockAnimation().x,
            opacity: getRejectedBlockAnimation().opacity,
            scale: getRejectedBlockAnimation().scale,
            rotate: getRejectedBlockAnimation().rotate,
          }}
          transition={{ duration: getRejectedBlockAnimation().duration }}
          className={`
            relative w-full min-h-[64px]
            rounded-xl border-2 px-4 py-3
            bg-red-600 border-red-500
            shadow-xl shadow-red-500/50
            flex items-center justify-center
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl" />
          <p className="text-white text-sm font-medium text-center opacity-70 line-through">
            {block.text}
          </p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-3 -right-3 w-8 h-8 bg-red-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
