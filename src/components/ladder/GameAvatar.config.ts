// ============================================
// GameAvatar 配置
// Agent 图标、颜色、标签定义（符合项目详情）
// ============================================

import type { AgentType } from './game-types';

export interface AgentConfig {
  iconName: string;
  label: string;
  colorClass: string;
  lightColor: string;
  gradient: string;
}

const AGENT_CONFIG: Record<AgentType, AgentConfig> = {
  A: {
    iconName: 'Lightbulb',
    label: 'Dream Builder',
    colorClass: 'bg-blue-500',
    lightColor: 'bg-blue-400',
    gradient: 'from-blue-500 to-blue-400',
  },
  B: {
    iconName: 'Search',
    label: 'Reality Auditor',
    colorClass: 'bg-red-500',
    lightColor: 'bg-red-400',
    gradient: 'from-red-500 to-red-400',
  },
  C: {
    iconName: 'Scale',
    label: 'Truth Synthesizer',
    colorClass: 'bg-violet-500',
    lightColor: 'bg-violet-400',
    gradient: 'from-violet-500 to-violet-400',
  },
  D: {
    iconName: 'Zap',
    label: 'Empathy Bridge',
    colorClass: 'bg-amber-400',
    lightColor: 'bg-amber-300',
    gradient: 'from-amber-400 to-amber-300',
  },
};

export function getAgentConfig(agent: AgentType): AgentConfig {
  return AGENT_CONFIG[agent];
}

export { AGENT_CONFIG };
