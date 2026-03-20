"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cafeStageCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const cafe_stage_1 = require("../cafe-stage");
exports.cafeStageCases = [
    {
        name: "arena stage helpers reveal panels in the expected order",
        run: () => {
            strict_1.default.equal(cafe_stage_1.ARENA_STAGE_COUNT, 4);
            strict_1.default.deepEqual((0, cafe_stage_1.getArenaVisibility)(0), {
                matchBanner: true,
                userPanel: false,
                opponentPanel: false,
                judgePanel: false,
            });
            strict_1.default.deepEqual((0, cafe_stage_1.getArenaVisibility)(1), {
                matchBanner: true,
                userPanel: true,
                opponentPanel: false,
                judgePanel: false,
            });
            strict_1.default.deepEqual((0, cafe_stage_1.getArenaVisibility)(2), {
                matchBanner: true,
                userPanel: true,
                opponentPanel: true,
                judgePanel: false,
            });
            strict_1.default.deepEqual((0, cafe_stage_1.getArenaVisibility)(3), {
                matchBanner: true,
                userPanel: true,
                opponentPanel: true,
                judgePanel: true,
            });
        },
    },
    {
        name: "arena stage labels match the reveal order",
        run: () => {
            strict_1.default.equal((0, cafe_stage_1.getArenaStageLabel)(0), "匹配成功");
            strict_1.default.equal((0, cafe_stage_1.getArenaStageLabel)(1), "Agent A 正在登场");
            strict_1.default.equal((0, cafe_stage_1.getArenaStageLabel)(2), "对手回应即将出现");
            strict_1.default.equal((0, cafe_stage_1.getArenaStageLabel)(3), "Judge C 正在更新求真控制台");
            strict_1.default.equal((0, cafe_stage_1.getArenaStageLabel)(99), "Judge C 正在更新求真控制台");
        },
    },
    {
        name: "arena progress helpers return stable percentages and descriptions",
        run: () => {
            strict_1.default.equal((0, cafe_stage_1.getArenaProgress)(0), 25);
            strict_1.default.equal((0, cafe_stage_1.getArenaProgress)(1), 50);
            strict_1.default.equal((0, cafe_stage_1.getArenaProgress)(2), 75);
            strict_1.default.equal((0, cafe_stage_1.getArenaProgress)(3), 100);
            strict_1.default.equal((0, cafe_stage_1.getArenaStageDescription)(2), "Agent B 正带着对手人格设定进入现场并发起反击。");
        },
    },
];
