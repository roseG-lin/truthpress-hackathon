"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, Sparkles } from "lucide-react";

export type AgentType = 'A' | 'B' | 'C' | 'D';
export type PhaseType = 'A_BUILD' | 'B_CHECK' | 'C_MERGE' | 'DONE';

interface LadderBlock {
  id: string;
  agent: AgentType;
  text: string;
  status: 'pending' | 'verified' | 'debunked' | 'merged';
}

interface AgentState {
  position: number;
  waiting: boolean;
  active: boolean;
}

interface RightPanelProps {
  blocks: LadderBlock[];
  agents: {
    A: AgentState;
    B: AgentState;
    C: AgentState;
    D?: AgentState;
  };
  currentPhase: PhaseType;
  dStairs?: LadderBlock[]; // D 的独立方块
  cMode?: 'idle' | 'merged'; // C 的状态
  isAbsorbing?: boolean; // C 是否正在吸收
  absorbedBlocks?: LadderBlock[]; // 正在被吸收的方块
  initialConclusion?: string; // C 的第一版结论（基于 A+B）
  finalConclusion?: string; // C 的最终结论（吸收 D 后）
}

// 方块颜色配置
const BLOCK_COLORS = {
  A: { bg: 'bg-blue-500/90', border: 'border-blue-400', glow: 'shadow-blue-500/40' },
  B: { bg: 'bg-red-500/90', border: 'border-red-400', glow: 'shadow-red-500/40' },
  C: { bg: 'bg-violet-500/90', border: 'border-violet-400', glow: 'shadow-violet-500/40' },
  D: { bg: 'bg-purple-500/90', border: 'border-purple-400', glow: 'shadow-purple-500/40' },
  verified: { bg: 'bg-green-500/90', border: 'border-green-400', glow: 'shadow-green-500/40' },
};

// 单个方块组件
function LadderStep({ block, index, isMerging }: { block: LadderBlock; index: number; isMerging?: boolean }) {
  const isVerified = block.status === 'verified';
  const isDebunked = block.status === 'debunked';
  const isMerged = block.status === 'merged';

  const colorConfig = isVerified
    ? BLOCK_COLORS.verified
    : isMerged
    ? BLOCK_COLORS.C
    : BLOCK_COLORS[block.agent];

  return (
    <motion.div
      layout
      initial={{
        y: isMerging ? 0 : -120,
        opacity: isMerging ? 1 : 0,
        scale: isMerging ? 1 : 0.85,
        rotateX: isMerging ? 0 : -15
      }}
      animate={{
        y: isMerging ? -30 : 0,
        opacity: isDebunked ? 0 : 1,
        scale: isDebunked ? 0 : 1,
        rotateX: 0,
      }}
      exit={{
        y: 50,
        opacity: 0,
        scale: 0.5,
        rotate: 15,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={`
        relative w-full h-12 rounded-lg border-2
        ${colorConfig.bg} ${colorConfig.border}
        shadow-lg ${colorConfig.glow}
        flex items-center justify-center px-3
        backdrop-blur-sm
      `}
    >
      {/* 方块内容 */}
      <span className="text-xs text-white font-medium truncate text-center drop-shadow">
        {block.text}
      </span>

      {/* 验证通过的金光效果 */}
      {isVerified && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 1, 0.5] }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent"
        />
      )}

      {/* 被推毁时的震动效果 */}
      {isDebunked && (
        <motion.div
          animate={{
            x: [0, -5, 5, -5, 5, 0],
            rotate: [0, -5, 5, -5, 5, 0],
          }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0"
        />
      )}
    </motion.div>
  );
}

// Avatar 组件
function AgentAvatar({
  agent,
  position,
  showHammer,
  isVortexing,
}: {
  agent: AgentType;
  position?: { left: string; top: string };
  showHammer?: boolean;
  isVortexing?: boolean;
}) {
  const colors = {
    A: 'bg-blue-500',
    B: 'bg-red-500',
    C: 'bg-violet-500',
    C_merged: 'bg-purple-500', // C 吸收 D 后变紫色
    D: 'bg-purple-500',
  };

  const bgColor = agent === 'C' && isVortexing ? colors.C_merged : colors[agent];

  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={position}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
    >
      {/* 漩涡效果（C 在融合阶段） */}
      {isVortexing && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-violet-300"
            animate={{ rotate: 360, scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-purple-400/50"
            animate={{ rotate: -360, scale: [1, 2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          {/* 漩涡粒子 */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-purple-400 rounded-full"
              style={{
                left: `${50 + 40 * Math.cos((i / 6) * Math.PI * 2)}%`,
                top: `${50 + 40 * Math.sin((i / 6) * Math.PI * 2)}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0.8, 0, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </>
      )}

      {/* Avatar 圆形 */}
      <motion.div
        className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center text-white font-bold text-sm border-2 border-white/30 shadow-lg relative z-10`}
        animate={isVortexing ? { scale: [1, 1.2, 1] } : {}}
        transition={isVortexing ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : {}}
      >
        {agent}
      </motion.div>

      {/* 锤子图标（B 审判时） */}
      {showHammer && (
        <motion.div
          className="absolute -right-8 top-1/2 -translate-y-1/2"
          animate={{ rotate: [0, -45, 45, 0], x: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: 1 }}
        >
          <Hammer className="w-6 h-6 text-yellow-400 drop-shadow-lg" />
        </motion.div>
      )}
    </motion.div>
  );
}

// 地面等待区域
function GroundArea({ currentPhase }: { currentPhase: PhaseType }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 flex items-end justify-center gap-12 pb-2">
      <AnimatePresence mode="sync">
        {/* B 在地面等待 */}
        {currentPhase === 'A_BUILD' && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold border-2 border-white/30 shadow-lg">
                B
              </div>
              {/* 等待气泡 */}
              <motion.div
                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/10 rounded-full text-xs whitespace-nowrap backdrop-blur-sm"
              >
                😰
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* C 在地面等待 */}
        {currentPhase === 'A_BUILD' && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="relative"
            >
              <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold border-2 border-white/30 shadow-lg">
                C
              </div>
              {/* 等待气泡 */}
              <motion.div
                animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.6, repeat: Infinity }}
                className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white/10 rounded-full text-xs whitespace-nowrap backdrop-blur-sm"
              >
                😰
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 主组件
export default function RightPanel({
  blocks,
  agents,
  currentPhase,
  dStairs = [],
  cMode = 'idle',
  isAbsorbing = false,
  absorbedBlocks = [],
  initialConclusion,
  finalConclusion
}: RightPanelProps) {
  // 分离主方块和 D 方块
  const mainBlocks = blocks.filter(b => b.agent !== 'D' || b.status === 'merged');

  // 确定当前显示的 D 方块：
  // - 如果正在吸收，显示正在被吸收的方块
  // - 如果是 C_MERGE 阶段或 B_CHECK 阶段（D 方块可能已经生成），显示 dStairs
  // - 修复：只要 dStairs 有数据就显示，不限制阶段
  const getDisplayDStairs = () => {
    // 调试日志
    if (isAbsorbing && absorbedBlocks.length > 0) {
      return absorbedBlocks;
    }
    // 修复：移除阶段限制，只要 dStairs 有数据就显示
    if (dStairs.length > 0) {
      return dStairs;
    }
    return [];
  };

  const displayDStairs = getDisplayDStairs();

  // 计算每个 Agent 应该在梯子上的位置
  const agentPositions = useMemo(() => {
    const validBlocks = mainBlocks.filter(b => b.status !== 'debunked');
    const aBlocks = validBlocks.filter(b => b.agent === 'A');
    const bBlocks = validBlocks.filter(b => b.agent === 'B');

    return {
      A: aBlocks.length > 0 ? aBlocks.length - 1 : -1,
      B: bBlocks.length > 0 ? bBlocks.length - 1 : -1,
    };
  }, [mainBlocks]);

  const isCVortexing = (currentPhase === 'C_MERGE' && displayDStairs.length > 0) || isAbsorbing;

  // 计算 C 应该显示的位置
  const cPosition = useMemo(() => {
    const validBlocks = mainBlocks.filter(b => b.status !== 'debunked');
    // 如果有 merged 方块，C 在最上面
    const mergedBlocks = validBlocks.filter(b => b.status === 'merged');
    if (mergedBlocks.length > 0) {
      return validBlocks.length - 1;
    }
    // 否则 C 在主梯子的顶部
    if (validBlocks.length > 0) {
      return validBlocks.length - 1;
    }
    // 如果没有方块但正在吸收（Scene 3），C 显示在虚拟位置（用于绝对定位）
    return -2; // 特殊值：表示 C 应该在画面中央
  }, [mainBlocks, currentPhase, displayDStairs.length]);

  // C 在 C_MERGE 阶段应该始终显示（即使没有方块）
  const shouldShowCAvatar = (cPosition >= 0 || (currentPhase === 'C_MERGE' && (displayDStairs.length > 0 || isAbsorbing))) && (currentPhase === 'C_MERGE' || currentPhase === 'DONE');

  // B 在 B_CHECK 阶段应该显示在审计位置
  const shouldShowBAvatar = currentPhase === 'B_CHECK' && agentPositions.A >= 0;

  // C 是否需要独立定位（不在方块上）
  const cStandalonePosition = cPosition === -2;

  return (
    <div className="h-full bg-gradient-to-br from-gray-900 via-gray-950 to-black rounded-2xl border border-gray-700 p-6 overflow-hidden relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />

        {/* C 吸收 D 时的漩涡背景 */}
        {isCVortexing && (
          <>
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
              }}
              animate={{ scale: [1, 2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />
            {/* 粒子漩涡 */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-purple-400 rounded-full"
                style={{
                  left: `${50 + 80 * Math.cos((i / 12) * Math.PI * 2)}%`,
                  top: `${50 + 80 * Math.sin((i / 12) * Math.PI * 2)}%`,
                }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* 标题 */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          爬梯赛场
        </h2>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          currentPhase === 'A_BUILD' ? 'bg-blue-500/20 text-blue-400' :
          currentPhase === 'B_CHECK' ? 'bg-red-500/20 text-red-400' :
          currentPhase === 'C_MERGE' ? 'bg-violet-500/20 text-violet-400' :
          'bg-green-500/20 text-green-400'
        }`}>
          {currentPhase === 'A_BUILD' && 'Scene 1: A 的狂想'}
          {currentPhase === 'B_CHECK' && 'Scene 2: B 的审判'}
          {currentPhase === 'C_MERGE' && 'Scene 3: C 吸收 D'}
          {currentPhase === 'DONE' && '辩论完成'}
        </div>
      </div>

      {/* C 的结论展示区 */}
      <AnimatePresence>
        {(initialConclusion || finalConclusion) && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 mb-4"
          >
            <div className={`rounded-xl border-2 p-4 backdrop-blur-sm ${
              finalConclusion
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-violet-500/10 border-violet-500/30'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  finalConclusion ? 'bg-green-500' : 'bg-violet-500'
                }`}>
                  C
                </div>
                <span className={`text-xs font-medium ${
                  finalConclusion ? 'text-green-400' : 'text-violet-400'
                }`}>
                  {finalConclusion ? '最终结论' : '初步结论'}
                </span>
                {finalConclusion && initialConclusion && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[10px] text-purple-400"
                  >
                    （已融合 D 的观点）
                  </motion.span>
                )}
              </div>
              <p className="text-sm text-gray-200 leading-relaxed">
                {finalConclusion || initialConclusion}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主舞台区域 */}
      <div className="relative z-10 flex h-[calc(100%-100px)] gap-8">

        {/* 主梯子（A 的方块 + 验证后的方块） */}
        <div className="flex-1 flex flex-col-reverse items-center gap-1.5 py-4 relative">
          <AnimatePresence mode="popLayout">
            {mainBlocks
              .filter(b => b.status !== 'debunked')
              .map((block, index) => (
                <motion.div
                  key={block.id}
                  className="w-full max-w-[220px]"
                  style={{ position: 'relative' }}
                >
                  <LadderStep block={block} index={index} />

                  {/* Scene 1: A 在方块上 */}
                  {block.agent === 'A' && index === agentPositions.A && currentPhase === 'A_BUILD' && (
                    <AgentAvatar agent="A" position={{ left: '50%', top: '50%' }} />
                  )}

                  {/* Scene 2: B 审判 A 的方块 - 修复 B 的显示逻辑 */}
                  {currentPhase === 'B_CHECK' && index === agentPositions.A && (
                    <>
                      <AgentAvatar agent="B" position={{ left: '30%', top: '50%' }} showHammer />
                      <AgentAvatar agent="A" position={{ left: '65%', top: '50%' }} />
                    </>
                  )}

                  {/* Scene 3: C 在顶部 */}
                  {!cStandalonePosition && shouldShowCAvatar && index === cPosition && (
                    <AgentAvatar agent="C" position={{ left: '50%', top: '40%' }} isVortexing={isCVortexing || isAbsorbing} />
                  )}
                </motion.div>
              ))}
          </AnimatePresence>

          {/* 空状态 */}
          {mainBlocks.filter(b => b.status !== 'debunked').length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              className="text-center text-gray-500 py-20"
            >
              <div className="text-4xl mb-2">🏔️</div>
              <p className="text-xs">等待观点入场...</p>
            </motion.div>
          )}
        </div>

        {/* D 的独立梯子（Scene 3） */}
        <AnimatePresence>
          {displayDStairs.length > 0 && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{
                x: isAbsorbing ? -150 : 0, // 吸收时向左移动
                opacity: 1,
              }}
              exit={{
                x: -200,
                opacity: 0,
                transition: { duration: 1.5 }
              }}
              transition={{
                x: { duration: isAbsorbing ? 2 : 0.5, ease: 'easeInOut' },
                opacity: { duration: 0.3 }
              }}
              className="w-32 flex flex-col-reverse items-center gap-1.5 py-4"
            >
              <div className={`text-xs mb-2 text-center transition-colors ${isAbsorbing ? 'text-violet-400' : 'text-purple-400'}`}>
                {isAbsorbing ? '正在被吸收...' : 'D 的观点'}
              </div>
              {displayDStairs.map((block, index) => (
                <motion.div
                  key={block.id}
                  layout
                  initial={{ y: -80, opacity: 0, scale: 0.8 }}
                  animate={{
                    y: isAbsorbing ? -100 - index * 20 : 0, // 吸收时向上移动
                    opacity: isAbsorbing ? 0 : 1,
                    scale: isAbsorbing ? 0.5 : 1,
                    x: isAbsorbing ? -80 : 0, // 吸收时向左平移
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                    delay: index * 0.1,
                    y: { duration: isAbsorbing ? 2 : 0.5 },
                    x: { duration: isAbsorbing ? 2 : 0 },
                    opacity: { duration: isAbsorbing ? 2 : 0.5 },
                  }}
                  className={`
                    w-full h-10 rounded-lg border-2
                    ${isAbsorbing ? BLOCK_COLORS.C.bg : BLOCK_COLORS.D.bg}
                    ${isAbsorbing ? BLOCK_COLORS.C.border : BLOCK_COLORS.D.border}
                    shadow-lg
                    flex items-center justify-center px-2
                    backdrop-blur-sm relative
                  `}
                >
                  {/* 吸收时的漩涡效果 */}
                  {isAbsorbing && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, transparent 70%)',
                      }}
                      animate={{ scale: [0.8, 1.5, 0.8], rotate: [0, 180, 360] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                  <span className={`text-[10px] truncate text-center ${isAbsorbing ? 'text-white' : 'text-white'}`}>
                    {block.text}
                  </span>
                </motion.div>
              ))}

              {/* D 的 Avatar 在顶部 */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{
                  scale: isAbsorbing ? [1, 0, 0] : 1,
                  opacity: isAbsorbing ? [1, 0, 0] : 1,
                  x: isAbsorbing ? [-50, -100] : 0,
                  y: isAbsorbing ? [0, -50] : 0,
                }}
                transition={{ duration: 2 }}
                className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs border-2 border-white/30 shadow-lg"
              >
                D
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* C 独立显示（当主梯子为空但有 D 方块时） */}
        {cStandalonePosition && shouldShowCAvatar && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 z-20"
          >
            <AgentAvatar agent="C" position={{ left: '50%', top: '50%' }} isVortexing={isCVortexing || isAbsorbing} />
          </motion.div>
        )}
      </div>

      {/* 地面等待区 */}
      <GroundArea currentPhase={currentPhase} />

      {/* 完成时的旗帜 */}
      {currentPhase === 'DONE' && (
        <motion.div
          initial={{ y: -50, opacity: 0, rotate: -15 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          className="absolute top-16 right-8 z-20"
        >
          <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-black px-4 py-2 rounded-lg shadow-xl text-sm font-bold border-2 border-yellow-200">
            🚩 辩论完成
          </div>
        </motion.div>
      )}
    </div>
  );
}
