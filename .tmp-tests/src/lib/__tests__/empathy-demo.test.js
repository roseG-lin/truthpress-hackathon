"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.empathyDemoCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const empathy_demo_1 = require("../empathy-demo");
exports.empathyDemoCases = [
    {
        name: "buildEmpathyDemoPayload returns stable demo fields",
        run: () => {
            const payload = (0, empathy_demo_1.buildEmpathyDemoPayload)("original text");
            strict_1.default.equal(payload.originalContent, "original text");
            strict_1.default.equal(payload.feedback, empathy_demo_1.DEMO_EMPATHY_FEEDBACK);
            strict_1.default.equal(payload.background, empathy_demo_1.DEMO_EMPATHY_BACKGROUND);
        },
    },
];
