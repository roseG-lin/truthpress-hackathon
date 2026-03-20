"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.debateTimelineCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const debate_timeline_1 = require("../debate-timeline");
exports.debateTimelineCases = [
    {
        name: "debate timeline marks earlier stages as complete and current stage as live",
        run: () => {
            const timeline = (0, debate_timeline_1.getDebateTimeline)(2);
            strict_1.default.equal(timeline.length, 4);
            strict_1.default.equal(timeline[0]?.status, "complete");
            strict_1.default.equal(timeline[1]?.status, "complete");
            strict_1.default.equal(timeline[2]?.status, "current");
            strict_1.default.equal(timeline[3]?.status, "upcoming");
        },
    },
    {
        name: "debate timeline preserves the intended speaking order",
        run: () => {
            const timeline = (0, debate_timeline_1.getDebateTimeline)(3);
            strict_1.default.deepEqual(timeline.map((entry) => entry.label), ["匹配器", "Agent A", "Agent B", "Judge C"]);
            strict_1.default.equal(timeline[3]?.description, "求真控制台正在发布裁决与证据堆栈。");
        },
    },
];
