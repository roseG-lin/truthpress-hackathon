// ============================================
// useLadderGame - Game State Management Hook
// Handles the game logic and paced animations
// ============================================

import { useState, useCallback, useRef } from 'react';
import type { Block, GameState } from './game-types';
import {
  createEmptyStacks,
  applyAuditOutcome,
  appendCConclusion,
  appendDChallenge,
  absorbNextD,
  createPulseKey,
  finalizeEmpathyMerge,
} from './ladder-state';

const ANIMATION_DELAYS = {
  blockSpawn: 600,
  blockLand: 400,
  agentJump: 500,
  verifyCheck: 1000,
  blockDestroy: 800,
  blockFall: 600,
  mergeLift: 1200,
  mergeFlight: 1800,
  mergeAttach: 600,
  confetti: 2000,
};

const EMPATHY_STEP_PREFIX = '共情融合：';

export function useLadderGame() {
  const [gameState, setGameState] = useState<GameState>({
    stacks: createEmptyStacks(),
    agentPositions: {
      A: { agent: 'A', stackIndex: -1, isFalling: false, isDizzy: false },
      B: { agent: 'B', stackIndex: -1, isFalling: false, isDizzy: false },
      C: { agent: 'C', stackIndex: -1, isFalling: false, isDizzy: false },
      D: { agent: 'D', stackIndex: -1, isFalling: false, isDizzy: false },
    },
    phase: 'BUILDING',
    conclusion: {},
  });

  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [mergingBlocks, setMergingBlocks] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [auditPulseKey, setAuditPulseKey] = useState<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // Phase 1: Agent A builds a block
  const buildBlock = useCallback((text: string, delay: number = ANIMATION_DELAYS.blockSpawn) => {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        const newBlock: Block = {
          id: `block-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          text,
          owner: 'A',
          status: 'pending',
          color: 'bg-blue-500',
        };

        setGameState(prev => {
          const nextA = [...prev.stacks.A, newBlock];
          return {
            ...prev,
            stacks: {
              ...prev.stacks,
              A: nextA,
            },
            agentPositions: {
              ...prev.agentPositions,
              A: { ...prev.agentPositions.A, stackIndex: nextA.length - 1 },
            },
          };
        });

        setActiveBlock(newBlock.id);
        setTimeout(() => setActiveBlock(null), ANIMATION_DELAYS.blockLand);
        resolve();
      }, delay);
      timersRef.current.push(timer);
    });
  }, []);

  // Phase 2: Agent B audits a block
  // 传入要核查的块的 text，而不是索引，避免索引问题
  const auditBlock = useCallback(async (claimText: string, result: "verified" | "debunked" | "uncertain") => {
    let targetBlockId: string | null = null;
    let targetIndex: number = -1;

    // 找到匹配的块
    setGameState(prev => {
      const index = prev.stacks.A.findIndex(b => b.text === claimText);
      if (index >= 0) {
        targetBlockId = prev.stacks.A[index]?.id || null;
        targetIndex = index;
      }
      return prev;
    });

    if (targetIndex < 0 || !targetBlockId) {
      console.warn("[auditBlock] Block not found:", claimText);
      return;
    }

    setAuditPulseKey(createPulseKey('audit'));
    setActiveBlock(targetBlockId);
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.verifyCheck));

    if (result === "verified") {
      setGameState(prev => {
        const idx = prev.stacks.A.findIndex(b => b.text === claimText);
        if (idx < 0) return prev;
        const auditResult = applyAuditOutcome(prev.stacks, idx, "verified");
        console.log("[auditBlock] Verified - stacks:", auditResult.stacks);
        return {
          ...prev,
          stacks: auditResult.stacks,
        };
      });
      setActiveBlock(null);
      return;
    }

    // debunked 或 uncertain：移除 A 的块，添加到 B
    setGameState(prev => {
      const idx = prev.stacks.A.findIndex(b => b.text === claimText);
      if (idx < 0) return prev;

      return {
        ...prev,
        agentPositions: {
          ...prev.agentPositions,
          A: prev.agentPositions.A.stackIndex >= idx
            ? { ...prev.agentPositions.A, isDizzy: true, isFalling: true }
            : prev.agentPositions.A,
        },
      };
    });

    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.blockDestroy));

    setGameState(prev => {
      const idx = prev.stacks.A.findIndex(b => b.text === claimText);
      if (idx < 0) return prev;

      const auditResult = applyAuditOutcome(prev.stacks, idx, result);
      const nextAIndex = auditResult.stacks.A.length - 1;
      const nextBIndex = auditResult.stacks.B.length - 1;

      console.log("[auditBlock] Result:", result, "claim:", claimText, "stacks:", auditResult.stacks);

      return {
        ...prev,
        stacks: auditResult.stacks,
        agentPositions: {
          ...prev.agentPositions,
          A: {
            ...prev.agentPositions.A,
            stackIndex: nextAIndex >= 0 ? nextAIndex : -1,
            isFalling: nextAIndex >= 0,
          },
          B: {
            ...prev.agentPositions.B,
            stackIndex: nextBIndex,
          },
        },
      };
    });

    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.blockFall));

    setGameState(prev => ({
      ...prev,
      agentPositions: {
        ...prev.agentPositions,
        A: {
          ...prev.agentPositions.A,
          isFalling: false,
          isDizzy: false,
        },
      },
    }));

    setActiveBlock(null);
  }, []);

  // Phase 3: Agent D challenges
  const challengeBlock = useCallback((text: string) => {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        setGameState(prev => {
          const nextStacks = appendDChallenge(prev.stacks, text);
          return {
            ...prev,
            stacks: nextStacks,
            phase: 'CHALLENGE',
            agentPositions: {
              ...prev.agentPositions,
              D: { ...prev.agentPositions.D, stackIndex: nextStacks.D.length - 1 },
            },
          };
        });
        resolve();
      }, ANIMATION_DELAYS.blockSpawn);
      timersRef.current.push(timer);
    });
  }, []);

  // Phase 4: C merges (empathy)
  const mergeStacks = useCallback((finalConclusion: string) => {
    return new Promise<void>(async (resolve) => {
      setGameState(prev => ({ ...prev, phase: 'MERGING' }));

      const pendingD = [...gameState.stacks.D];

      for (let i = 0; i < pendingD.length; i += 1) {
        const block = pendingD[i];
        const stepText = `${EMPATHY_STEP_PREFIX}${block.text}`;

        setMergingBlocks([block.id]);
        await new Promise(r => setTimeout(r, ANIMATION_DELAYS.mergeLift));

        setGameState(prev => {
          const result = absorbNextD(prev.stacks, stepText);
          return {
            ...prev,
            stacks: result.stacks,
            agentPositions: {
              ...prev.agentPositions,
              D: { ...prev.agentPositions.D, stackIndex: result.stacks.D.length - 1 },
              C: { ...prev.agentPositions.C, stackIndex: result.stacks.C.length - 1 },
            },
          };
        });

        await new Promise(r => setTimeout(r, ANIMATION_DELAYS.mergeFlight));
      }

      setMergingBlocks([]);

      setGameState(prev => {
        const finalStacks = finalizeEmpathyMerge(prev.stacks, finalConclusion);
        return {
          ...prev,
          stacks: finalStacks,
          phase: 'COMPLETE',
          conclusion: { ...prev.conclusion, final: finalConclusion },
          agentPositions: {
            ...prev.agentPositions,
            C: { ...prev.agentPositions.C, stackIndex: finalStacks.C.length - 1 },
            D: { ...prev.agentPositions.D, stackIndex: -1 },
          },
        };
      });

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), ANIMATION_DELAYS.confetti);

      resolve();
    });
  }, [gameState.stacks.D]);

  // Set initial conclusion
  const setInitialConclusion = useCallback((text: string) => {
    setGameState(prev => {
      const nextStacks = appendCConclusion(prev.stacks, text);
      return {
        ...prev,
        stacks: nextStacks,
        phase: 'CHALLENGE',
        conclusion: { ...prev.conclusion, initial: text },
        agentPositions: {
          ...prev.agentPositions,
          C: { ...prev.agentPositions.C, stackIndex: nextStacks.C.length - 1 },
        },
      };
    });
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    clearTimers();
    setGameState({
      stacks: createEmptyStacks(),
      agentPositions: {
        A: { agent: 'A', stackIndex: -1, isFalling: false, isDizzy: false },
        B: { agent: 'B', stackIndex: -1, isFalling: false, isDizzy: false },
        C: { agent: 'C', stackIndex: -1, isFalling: false, isDizzy: false },
        D: { agent: 'D', stackIndex: -1, isFalling: false, isDizzy: false },
      },
      phase: 'BUILDING',
      conclusion: {},
    });
    setActiveBlock(null);
    setMergingBlocks([]);
    setShowConfetti(false);
    setAuditPulseKey(null);
  }, []);

  return {
    gameState,
    activeBlock,
    mergingBlocks,
    showConfetti,
    auditPulseKey,
    buildBlock,
    auditBlock,
    challengeBlock,
    mergeStacks,
    setInitialConclusion,
    resetGame,
    clearTimers,
  };
}

