"use strict";
// ============================================
// Game Types for Ladder Arena
// Platformer game simulation of AI debate
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_LABELS = exports.AGENT_ICONS = exports.AGENT_HEX_COLORS = exports.AGENT_COLORS = exports.BLOCK_COLORS = void 0;
// Block colors by agent and status
exports.BLOCK_COLORS = {
    A: { bg: 'bg-blue-500', border: 'border-blue-400', glow: 'shadow-blue-500/50' },
    B: { bg: 'bg-red-500', border: 'border-red-400', glow: 'shadow-red-500/50' },
    C: { bg: 'bg-violet-500', border: 'border-violet-400', glow: 'shadow-violet-500/50' },
    D: { bg: 'bg-amber-400', border: 'border-amber-300', glow: 'shadow-amber-400/50' },
    pending: { bg: 'bg-gray-400', border: 'border-gray-300', glow: 'shadow-gray-400/50' },
    verified: { bg: 'bg-green-500', border: 'border-green-400', glow: 'shadow-green-500/50' },
    rejected: { bg: 'bg-red-600', border: 'border-red-500', glow: 'shadow-red-600/50' },
    debunked: { bg: 'bg-red-600', border: 'border-red-500', glow: 'shadow-red-600/50' },
    uncertain: { bg: 'bg-amber-500', border: 'border-amber-400', glow: 'shadow-amber-500/50' },
    merged: { bg: 'bg-amber-400', border: 'border-amber-300', glow: 'shadow-amber-400/50' },
};
exports.AGENT_COLORS = {
    A: 'bg-blue-500',
    B: 'bg-red-500',
    C: 'bg-violet-500',
    D: 'bg-amber-400', // 修正：D 是金色（Empathy Bridge），不是紫色
};
exports.AGENT_HEX_COLORS = {
    A: '#3b82f6', // 蓝色 - Dream Builder
    B: '#ef4444', // 红色 - Reality Auditor
    C: '#8b5cf6', // 紫色 - Truth Synthesizer
    D: '#fbbf24', // 金色 - Empathy Bridge
};
exports.AGENT_ICONS = {
    A: 'Lightbulb', // 💡 发散思考
    B: 'Search', // 🔍 审计核查
    C: 'Scale', // ⚖️ 综合平衡
    D: 'Zap', // ⚡ 共情桥梁
};
exports.AGENT_LABELS = {
    A: 'Dream Builder',
    B: 'Reality Auditor',
    C: 'Truth Synthesizer',
    D: 'Empathy Bridge',
};
