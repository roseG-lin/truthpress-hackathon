// ============================================
// game-types 测试
// 验证 Agent 颜色和图标定义符合项目详情
// ============================================

import { describe, it, expect } from 'vitest';
import {
  AGENT_COLORS,
  AGENT_LABELS,
  AGENT_HEX_COLORS,
  AGENT_ICONS,
  type AgentType
} from './game-types';

describe('Agent 颜色定义（符合项目详情）', () => {
  it('Agent A 应该是蓝色 #3b82f6', () => {
    expect(AGENT_HEX_COLORS.A).toBe('#3b82f6');
  });

  it('Agent B 应该是红色 #ef4444', () => {
    expect(AGENT_HEX_COLORS.B).toBe('#ef4444');
  });

  it('Agent C 应该是紫色 #8b5cf6（Truth Synthesizer）', () => {
    expect(AGENT_HEX_COLORS.C).toBe('#8b5cf6');
  });

  it('Agent D 应该是金色 #fbbf24（Empathy Bridge，不是紫色！）', () => {
    expect(AGENT_HEX_COLORS.D).toBe('#fbbf24');
  });
});

describe('Agent 图标定义', () => {
  it('每个 Agent 都应该有对应的图标名称', () => {
    const icons: AgentType[] = ['A', 'B', 'C', 'D'];
    icons.forEach(agent => {
      expect(AGENT_ICONS[agent]).toBeDefined();
    });
  });

  it('Agent A 的图标应该是 Lightbulb（发散思考）', () => {
    expect(AGENT_ICONS.A).toBe('Lightbulb');
  });

  it('Agent B 的图标应该是 Search（审计核查）', () => {
    expect(AGENT_ICONS.B).toBe('Search');
  });

  it('Agent C 的图标应该是 Scale（综合平衡）', () => {
    expect(AGENT_ICONS.C).toBe('Scale');
  });

  it('Agent D 的图标应该是 Zap（共情桥梁）', () => {
    expect(AGENT_ICONS.D).toBe('Zap');
  });
});

describe('Agent 标签定义', () => {
  it('Agent A 应该是 Dream Builder', () => {
    expect(AGENT_LABELS.A).toBe('Dream Builder');
  });

  it('Agent B 应该是 Reality Auditor', () => {
    expect(AGENT_LABELS.B).toBe('Reality Auditor');
  });

  it('Agent C 应该是 Truth Synthesizer', () => {
    expect(AGENT_LABELS.C).toBe('Truth Synthesizer');
  });

  it('Agent D 应该是 Empathy Bridge', () => {
    expect(AGENT_LABELS.D).toBe('Empathy Bridge');
  });
});
