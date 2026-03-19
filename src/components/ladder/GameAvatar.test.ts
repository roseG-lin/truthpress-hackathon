// ============================================
// GameAvatar 配置测试
// 验证 Agent 配置导出符合项目详情
// ============================================

import { describe, it, expect } from 'vitest';
import { getAgentConfig, type AgentType } from './GameAvatar.config';

describe('GameAvatar Agent 配置（符合项目详情）', () => {
  describe('Agent A - Dream Builder', () => {
    it('图标应该是 Lightbulb（💡 发散思考）', () => {
      const config = getAgentConfig('A');
      expect(config.iconName).toBe('Lightbulb');
    });

    it('标签应该是 "Dream Builder"', () => {
      const config = getAgentConfig('A');
      expect(config.label).toBe('Dream Builder');
    });

    it('颜色应该是蓝色 blue', () => {
      const config = getAgentConfig('A');
      expect(config.colorClass).toContain('blue');
      expect(config.gradient).toContain('blue');
    });
  });

  describe('Agent B - Reality Auditor', () => {
    it('图标应该是 Search（🔍 审计核查）', () => {
      const config = getAgentConfig('B');
      expect(config.iconName).toBe('Search');
    });

    it('标签应该是 "Reality Auditor"', () => {
      const config = getAgentConfig('B');
      expect(config.label).toBe('Reality Auditor');
    });

    it('颜色应该是红色 red', () => {
      const config = getAgentConfig('B');
      expect(config.colorClass).toContain('red');
      expect(config.gradient).toContain('red');
    });
  });

  describe('Agent C - Truth Synthesizer', () => {
    it('图标应该是 Scale（⚖️ 综合平衡）', () => {
      const config = getAgentConfig('C');
      expect(config.iconName).toBe('Scale');
    });

    it('标签应该是 "Truth Synthesizer"', () => {
      const config = getAgentConfig('C');
      expect(config.label).toBe('Truth Synthesizer');
    });

    it('颜色应该是紫色 violet', () => {
      const config = getAgentConfig('C');
      expect(config.colorClass).toContain('violet');
      expect(config.gradient).toContain('violet');
    });
  });

  describe('Agent D - Empathy Bridge', () => {
    it('图标应该是 Zap（⚡ 共情桥梁）', () => {
      const config = getAgentConfig('D');
      expect(config.iconName).toBe('Zap');
    });

    it('标签应该是 "Empathy Bridge"', () => {
      const config = getAgentConfig('D');
      expect(config.label).toBe('Empathy Bridge');
    });

    it('颜色应该是金色 amber（不是 purple！）', () => {
      const config = getAgentConfig('D');
      expect(config.colorClass).toContain('amber');
      expect(config.gradient).toContain('amber');
      expect(config.colorClass).not.toContain('purple');
      expect(config.gradient).not.toContain('purple');
    });
  });
});
