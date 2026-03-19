// ============================================
// 分步融合动画测试
// 验证 ACT 3 三步融合动画流程
// ============================================

import { describe, it, expect } from 'vitest';
import { getMergeAnimationPhases, MergePhase } from './mergeAnimation.config';

describe('分步融合动画（符合游戏脚本）', () => {
  describe('三步动画流程', () => {
    it('应该包含三个阶段：LIFT, FLIGHT, DROP', () => {
      const phases = getMergeAnimationPhases();
      expect(phases).toHaveLength(3);
      expect(phases[0].phase).toBe('LIFT');
      expect(phases[1].phase).toBe('FLIGHT');
      expect(phases[2].phase).toBe('DROP');
    });

    it('LIFT 阶段应该向上移动 1200ms', () => {
      const phases = getMergeAnimationPhases();
      const lift = phases[0];
      expect(lift.duration).toBe(1200);
      expect(lift.y?.[0]).toBe(0);
      expect(lift.y?.[lift.y.length - 1]).toBeLessThan(0);
    });

    it('FLIGHT 阶段应该从右向左横移 1800ms', () => {
      const phases = getMergeAnimationPhases();
      const flight = phases[1];
      expect(flight.duration).toBe(1800);
      expect(flight.x?.[0]).toBeGreaterThan(0);
      expect(flight.x?.[flight.x.length - 1]).toBeLessThanOrEqual(0);
    });

    it('DROP 阶段应该下落合并 600ms', () => {
      const phases = getMergeAnimationPhases();
      const drop = phases[2];
      expect(drop.duration).toBe(600);
      expect(drop.y?.[0]).toBeLessThan(0);
      expect(drop.y?.[drop.y.length - 1]).toBe(0);
    });

    it('总持续时间应该是 3600ms', () => {
      const phases = getMergeAnimationPhases();
      const totalDuration = phases.reduce((sum, p) => sum + p.duration, 0);
      expect(totalDuration).toBe(3600);
    });
  });

  describe('颜色渐变效果', () => {
    it('D 的方块应该从金色渐变到融合色（violet）', () => {
      const phases = getMergeAnimationPhases();
      const flight = phases[1];
      expect(flight.colorTransition).toBeDefined();
      expect(flight.colorTransition?.from).toContain('amber');
      expect(flight.colorTransition?.to).toContain('violet');
    });
  });
});
