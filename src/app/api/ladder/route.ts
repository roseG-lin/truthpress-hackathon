// ============================================
// /api/ladder/route.ts
// SSE Stream for Ladder Game Events
// ============================================

import { NextResponse } from 'next/server';

const encoder = new TextEncoder();

// Simulation data for demo
const SIMULATION_EVENTS = [
  { delay: 500, event: 'A_NEW_STEP', data: { text: 'AI can personalize learning for every student' } },
  { delay: 1200, event: 'A_NEW_STEP', data: { text: 'AI reduces teacher workload significantly' } },
  { delay: 1900, event: 'A_NEW_STEP', data: { text: 'AI provides 24/7 tutoring access' } },
  { delay: 3000, event: 'B_VERIFY', data: { index: 0, verified: true } },
  { delay: 4000, event: 'B_DESTROY', data: { index: 1 } },
  { delay: 5000, event: 'B_VERIFY', data: { index: 1, verified: true } },
  { delay: 6500, event: 'D_NEW_STEP', data: { text: 'Human empathy builds trust' } },
  { delay: 7500, event: 'D_NEW_STEP', data: { text: 'Over-automation risks equity gaps' } },
  { delay: 9000, event: 'C_MERGE_START', data: {} },
  { delay: 11000, event: 'C_MERGE_COMPLETE', data: { conclusion: 'Balanced approach: AI augments human teachers, not replaces them' } },
  { delay: 12000, event: 'DONE', data: {} },
];

export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const item of SIMULATION_EVENTS) {
          await new Promise((resolve) => setTimeout(resolve, item.delay - (SIMULATION_EVENTS[SIMULATION_EVENTS.indexOf(item) - 1]?.delay || 0)));
          
          const sseEvent = {
            event: item.event,
            data: item.data,
            timestamp: Date.now(),
          };
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(sseEvent)}\n\n`)
          );
        }
      } catch (error) {
        console.error('Stream error:', error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
