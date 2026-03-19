// ============================================
// GameArena - 求真社-TRUTHPRESS 主竞技场
// "The Ladder of Truth" Platformer Visualization
// ============================================

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Swords, Sparkles, Zap, FlagTriangleRight } from 'lucide-react';
import { useLadderGame } from './useLadderGame';
import { GameBlock } from './GameBlock';
import { GameAvatar } from './GameAvatar';
import type { AgentType } from './game-types';
import { buildEmpathyDemoPayload } from '@/lib/empathy-demo';

// ============================================
// Confetti Component
// ============================================

function Confetti() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ['#007aff', '#5e5ce6', '#bf5af2', '#22c55e', '#ffcc00'][Math.floor(Math.random() * 5)],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}%`, opacity: 1, rotate: 0 }}
          animate={{
            y: 600,
            x: `${p.x + (Math.random() * 20 - 10)}%`,
            opacity: 0,
            rotate: 360,
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: p.delay,
            ease: 'easeOut',
          }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function GameArena() {
  const {
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
  } = useLadderGame();

  const [simulationStarted, setSimulationStarted] = useState(false);

  // Auto-run simulation for demo
  useEffect(() => {
    if (simulationStarted) return;
    setSimulationStarted(true);

    const runSimulation = async () => {
      // Phase 1: A builds
      await buildBlock('AI can personalize learning for every student');
      await new Promise(r => setTimeout(r, 800));
      await buildBlock('AI reduces teacher workload significantly');
      await new Promise(r => setTimeout(r, 800));
      await buildBlock('AI provides 24/7 tutoring access');

      // Phase 2: B audits
      await new Promise(r => setTimeout(r, 1000));
      await auditBlock('AI can personalize learning for every student', 'verified'); // Verify first
      await new Promise(r => setTimeout(r, 800));
      await auditBlock('AI reduces teacher workload significantly', 'debunked'); // Destroy second
      await new Promise(r => setTimeout(r, 1000));
      await auditBlock('AI provides 24/7 tutoring access', 'verified'); // Verify third (now at index 1)

      // Phase 3: D challenges
      await new Promise(r => setTimeout(r, 1500));
      const initialSummary =
        'Summary: AI boosts efficiency and personalization, but needs firm guardrails.';
      setInitialConclusion(initialSummary);
      await new Promise(r => setTimeout(r, 1200));
      await challengeBlock('Human empathy builds trust');
      await new Promise(r => setTimeout(r, 800));
      await challengeBlock('Over-automation risks equity gaps');

      // Phase 4: C merges
      await new Promise(r => setTimeout(r, 1500));
      let finalConclusion =
        'Balanced approach: AI augments human teachers, not replaces them';
      try {
        const payload = buildEmpathyDemoPayload(initialSummary);
        const response = await fetch('/api/empathy-v2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const data = await response.json();
          if (data?.empatheticSupplement) {
            finalConclusion = data.empatheticSupplement;
          }
        }
      } catch (error) {
        console.error('Empathy demo request failed', error);
      }
      await mergeStacks(finalConclusion);
    };

    runSimulation();
  }, [simulationStarted, buildBlock, auditBlock, challengeBlock, mergeStacks, setInitialConclusion]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0a0a0f] via-[#1a1a2e] to-[#16213e] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-400">Truth Log</p>
                <h1 className="text-xl font-semibold">求真社-TRUTHPRESS · 真理之梯</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-xs uppercase tracking-[0.2em] text-emerald-400">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Arena */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          
          {/* Left: Game Arena */}
          <section className="relative min-h-[700px] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-2xl">
            {/* Phase indicator */}
            <div className="absolute top-6 left-6 flex items-center gap-2">
              <Swords className="w-5 h-5 text-violet-400" />
              <span className="text-sm font-medium text-white/80">
                Phase: {gameState.phase}
              </span>
            </div>

            {/* Confetti */}
            {showConfetti && <Confetti />}

            {/* Game Container */}
            <div className="mt-12 h-[600px]">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
                {(['A', 'B', 'C', 'D'] as AgentType[]).map((agent) => {
                  const laneBlocks = gameState.stacks[agent];
                  const laneLabel =
                    agent === 'A'
                      ? 'Dream Builder'
                      : agent === 'B'
                      ? 'Reality Auditor'
                      : agent === 'C'
                      ? 'Truth Synthesizer'
                      : 'Empathy Bridge';

                  return (
                    <div key={agent} className="relative flex flex-col h-full">
                      <div className="mb-3 flex items-center justify-between text-xs font-semibold text-white/80 uppercase tracking-wider">
                        <span>Agent {agent}</span>
                        <span className="text-[10px] font-medium text-white/60">{laneLabel}</span>
                      </div>
                      <div className="relative flex-1 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
                        <div className="absolute bottom-3 left-3 right-3 h-1 bg-white/20 rounded-full" />

                        {agent === 'B' && auditPulseKey && (
                          <motion.div
                            key={auditPulseKey}
                            initial={{ scale: 0.4, opacity: 0.6 }}
                            animate={{ scale: 1.4, opacity: 0 }}
                            transition={{ duration: 1.1, ease: 'easeOut' }}
                            className="absolute inset-8 rounded-full border-2 border-red-300/70 shadow-[0_0_40px_rgba(239,68,68,0.35)] pointer-events-none"
                          />
                        )}

                        <div className="absolute bottom-6 left-0 right-0 flex flex-col-reverse gap-3 px-3 z-10">
                          <AnimatePresence mode="popLayout">
                            {laneBlocks.map((block, index) => (
                              <div key={block.id} className="relative">
                                <GameBlock
                                  block={block}
                                  index={index}
                                  isActive={activeBlock === block.id}
                                  isMerging={mergingBlocks.includes(block.id)}
                                />

                                {gameState.agentPositions[agent].stackIndex === index && (
                                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-20">
                                    <GameAvatar
                                      agent={agent}
                                      position={gameState.agentPositions[agent]}
                                      isActive={false}
                                      isWaiting={false}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </AnimatePresence>
                        </div>

                        {gameState.agentPositions[agent].stackIndex === -1 && (
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                            <GameAvatar
                              agent={agent}
                              position={gameState.agentPositions[agent]}
                              isActive={false}
                              isWaiting={true}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reset Button */}
            <div className="absolute bottom-6 right-6">
              <button
                onClick={resetGame}
                className="px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/20 transition"
              >
                Reset Simulation
              </button>
            </div>
          </section>

          {/* Right: Info Panel */}
          <aside className="space-y-4">
            {/* Agent Status Cards */}
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Agents
              </h3>
              <div className="space-y-3">
                {[
                  { id: 'A', name: 'Builder', role: 'Builds arguments', color: 'text-blue-400' },
                  { id: 'B', name: 'Auditor', role: 'Verifies claims', color: 'text-red-400' },
                  { id: 'C', name: 'Synthesizer', role: 'Merges perspectives', color: 'text-violet-400' },
                  { id: 'D', name: 'Challenger', role: 'Questions assumptions', color: 'text-purple-400' },
                ].map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center ${agent.color}`}>
                      <span className="text-xs font-bold">{agent.id}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-white/50">{agent.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conclusion Card */}
            {gameState.conclusion?.final && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-amber-400/30 bg-amber-400/10 backdrop-blur-sm p-6"
              >
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-300">
                  <FlagTriangleRight className="w-4 h-4" />
                  Final Conclusion
                </h3>
                <p className="text-sm text-white/90 leading-relaxed">
                  {gameState.conclusion.final}
                </p>
              </motion.div>
            )}

            {/* Legend */}
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
              <h3 className="text-sm font-semibold mb-4">Block Legend</h3>
              <div className="space-y-2">
                {[
                  { status: 'Pending', color: 'bg-gray-400', desc: 'Awaiting review' },
                  { status: 'Verified', color: 'bg-green-500', desc: 'Evidence supports' },
                  { status: 'Rejected', color: 'bg-red-600', desc: 'Evidence contradicts' },
                  { status: 'Merged', color: 'bg-amber-400', desc: 'Synthesized view' },
                ].map((item) => (
                  <div key={item.status} className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${item.color}`} />
                    <div>
                      <span className="text-xs font-medium">{item.status}</span>
                      <span className="block text-[10px] text-white/50">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
