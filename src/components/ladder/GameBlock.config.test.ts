// ============================================
// GameBlock 震动效果测试
// 验证被推翻方块的震动参数符合游戏脚本
// ============================================

import { describe, it, expect } from 'vitest';
import { getShakeAnimation, getRejectedBlockAnimation } from './GameBlock.config';

describe('GameBlock 震动效果（符合游戏脚本）', () => {
  describe('方块被推翻时的震动效果', () => {
    it('X 轴震动序列应该是 [-8, 8, -6, 6, -4, 4, 0]', () => {
      const animation = getRejectedBlockAnimation();
      expect(animation.x).toEqual([-8, 8, -6, 6, -4, 4, 0]);
    });

    it('应该包含透明度渐变效果', () => {
      const animation = getRejectedBlockAnimation();
      expect(animation.opacity).toBeDefined();
      expect(animation.opacity?.[0]).toBe(1);
      expect(animation.opacity?.[animation.opacity.length - 1]).toBeLessThan(0.5);
    });

    it('应该包含缩放效果', () => {
      const animation = getRejectedBlockAnimation();
      expect(animation.scale).toBeDefined();
      expect(animation.scale?.[0]).toBe(1);
      expect(animation.scale?.[animation.scale.length - 1]).toBeLessThan(1);
    });

    it('应该包含旋转效果增强破碎感', () => {
      const animation = getRejectedBlockAnimation();
      expect(animation.rotate).toBeDefined();
      // 旋转角度应该逐渐增大
      const rotations = animation.rotate || [];
      const maxRotation = Math.max(...rotations);
      expect(maxRotation).toBeGreaterThan(10);
    });

    it('震动持续时间应该是 0.8 秒（给足够时间看到破碎）', () => {
      const animation = getRejectedBlockAnimation();
      expect(animation.duration).toBe(0.8);
    });
  });

  describe('扫描效果（Agent B 审计时）', () => {
    it('应该有扫描光线配置', () => {
      const scan = getShakeAnimation();
      expect(scan).toBeDefined();
    });

    it('扫描效果应该包含光线位置', () => {
      const scan = getShakeAnimation();
      expect(scan.sweepX).toBeDefined();
      expect(scan.sweepX).toHaveLength(5);
    });

    it('扫描效果应该从左到右移动', () => {
      const scan = getShakeAnimation();
      expect(scan.sweepX?.[0]).toBeLessThan(scan.sweepX?.[scan.sweepX.length - 1] ?? 0);
    });
  });
});
