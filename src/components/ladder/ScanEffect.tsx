// ============================================
// ScanEffect - 扫描光线动画组件
// Agent B 审计时显示的扫描效果
// ============================================

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { getShakeAnimation, getScanKeyframes } from './GameBlock.config';

interface ScanEffectProps {
  active: boolean;
  duration?: number;
}

export function ScanEffect({ active, duration = 1200 }: ScanEffectProps) {
  const scanConfig = getShakeAnimation();

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="scan-line absolute inset-y-0 w-1 bg-gradient-to-b from-transparent via-red-400 to-transparent z-10"
          initial={{ left: '0%', opacity: 0 }}
          animate={{
            left: ['0%', '25%', '50%', '75%', '100%'],
            opacity: [0, 1, 1, 1, 0],
            width: ['2px', '4px', '4px', '4px', '2px'],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: duration / 1000,
            ease: 'linear',
          }}
          style={{
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.5)',
          }}
        >
          {/* 扫描光晕效果 */}
          <div className="absolute inset-0 blur-sm bg-red-400/50" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
