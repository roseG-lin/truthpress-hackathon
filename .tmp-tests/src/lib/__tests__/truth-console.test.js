"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.truthConsoleCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const truth_console_1 = require("../truth-console");
exports.truthConsoleCases = [
    {
        name: "winning side summary returns readable arena copy",
        run: () => {
            strict_1.default.equal((0, truth_console_1.summarizeWinningSide)("user"), "当前用户一方更占上风");
            strict_1.default.equal((0, truth_console_1.summarizeWinningSide)("opponent"), "当前对手一方更占上风");
            strict_1.default.equal((0, truth_console_1.summarizeWinningSide)("draw"), "当前双方势均力敌");
        },
    },
    {
        name: "verdict accent maps each verdict to stable UI tokens",
        run: () => {
            strict_1.default.equal((0, truth_console_1.getVerdictAccent)("supported"), "emerald");
            strict_1.default.equal((0, truth_console_1.getVerdictAccent)("mixed"), "amber");
            strict_1.default.equal((0, truth_console_1.getVerdictAccent)("unsupported"), "rose");
            strict_1.default.equal((0, truth_console_1.getVerdictAccent)("uncertain"), "slate");
        },
    },
    {
        name: "evidence strength escalates with richer sources",
        run: () => {
            strict_1.default.equal((0, truth_console_1.getEvidenceStrength)([
                {
                    title: "Evidence title",
                    snippet: "A long summary that gives enough detail to feel trustworthy.",
                    url: "https://example.com/research",
                },
            ]), "strong");
            strict_1.default.equal((0, truth_console_1.getEvidenceStrength)([
                {
                    title: "Short",
                    snippet: "tiny",
                    url: "https://example.com",
                },
            ]), "medium");
            strict_1.default.equal((0, truth_console_1.getEvidenceStrength)([
                {
                    title: "No search results",
                    snippet: "No public search results were returned.",
                    url: "",
                },
            ]), "weak");
        },
    },
];
