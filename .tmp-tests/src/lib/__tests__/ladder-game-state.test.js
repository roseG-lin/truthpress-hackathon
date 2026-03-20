"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ladderGameStateCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const ladder_state_1 = require("../../components/ladder/ladder-state");
exports.ladderGameStateCases = [
    {
        name: "createEmptyStacks returns empty lanes for A/B/C/D",
        run: () => {
            const stacks = (0, ladder_state_1.createEmptyStacks)();
            strict_1.default.deepEqual(stacks.A, []);
            strict_1.default.deepEqual(stacks.B, []);
            strict_1.default.deepEqual(stacks.C, []);
            strict_1.default.deepEqual(stacks.D, []);
        },
    },
    {
        name: "applyAuditOutcome verifies A block without adding B block",
        run: () => {
            const stacks = {
                A: [{ id: "a1", text: "A1", owner: "A", status: "pending", color: "bg-blue-500" }],
                B: [],
                C: [],
                D: [],
            };
            const result = (0, ladder_state_1.applyAuditOutcome)(stacks, 0, true);
            strict_1.default.equal(result.stacks.A[0].status, "verified");
            strict_1.default.equal(result.stacks.B.length, 0);
        },
    },
    {
        name: "applyAuditOutcome rejects A block and adds red block to B",
        run: () => {
            const stacks = {
                A: [{ id: "a1", text: "A1", owner: "A", status: "pending", color: "bg-blue-500" }],
                B: [],
                C: [],
                D: [],
            };
            const result = (0, ladder_state_1.applyAuditOutcome)(stacks, 0, false);
            strict_1.default.equal(result.stacks.A.length, 0);
            strict_1.default.equal(result.stacks.B.length, 1);
            strict_1.default.equal(result.stacks.B[0].status, "rejected");
        },
    },
    {
        name: "finalizeEmpathyMerge clears D and leaves a single golden C block",
        run: () => {
            const stacks = {
                A: [],
                B: [],
                C: [
                    { id: "c1", text: "C1", owner: "C", status: "pending", color: "bg-violet-500" },
                    { id: "c2", text: "C2", owner: "C", status: "pending", color: "bg-violet-500" },
                ],
                D: [{ id: "d1", text: "D1", owner: "D", status: "pending", color: "bg-amber-400" }],
            };
            const result = (0, ladder_state_1.finalizeEmpathyMerge)(stacks, "final empathy");
            strict_1.default.equal(result.C.length, 1);
            strict_1.default.equal(result.C[0].status, "merged");
            strict_1.default.equal(result.C[0].text, "final empathy");
            strict_1.default.equal(result.D.length, 0);
        },
    },
    {
        name: "appendCConclusion adds a C summary block",
        run: () => {
            const stacks = (0, ladder_state_1.createEmptyStacks)();
            const result = (0, ladder_state_1.appendCConclusion)(stacks, "summary");
            strict_1.default.equal(result.C.length, 1);
            strict_1.default.equal(result.C[0].owner, "C");
            strict_1.default.equal(result.C[0].text, "summary");
        },
    },
    {
        name: "appendABuild adds an A block",
        run: () => {
            const stacks = (0, ladder_state_1.createEmptyStacks)();
            const result = (0, ladder_state_1.appendABuild)(stacks, "idea");
            strict_1.default.equal(result.A.length, 1);
            strict_1.default.equal(result.A[0].owner, "A");
            strict_1.default.equal(result.A[0].text, "idea");
        },
    },
    {
        name: "appendDChallenge adds a D challenge block",
        run: () => {
            const stacks = (0, ladder_state_1.createEmptyStacks)();
            const result = (0, ladder_state_1.appendDChallenge)(stacks, "challenge");
            strict_1.default.equal(result.D.length, 1);
            strict_1.default.equal(result.D[0].owner, "D");
            strict_1.default.equal(result.D[0].text, "challenge");
        },
    },
    {
        name: "appendEmpathyStep appends a new C block",
        run: () => {
            const stacks = (0, ladder_state_1.createEmptyStacks)();
            const result = (0, ladder_state_1.appendEmpathyStep)(stacks, "empathy step");
            strict_1.default.equal(result.C.length, 1);
            strict_1.default.equal(result.C[0].owner, "C");
            strict_1.default.equal(result.C[0].text, "empathy step");
        },
    },
    {
        name: "absorbNextD moves one D block into C and removes it from D",
        run: () => {
            const stacks = {
                A: [],
                B: [],
                C: [],
                D: [
                    { id: "d1", text: "D1", owner: "D", status: "pending", color: "bg-amber-400" },
                    { id: "d2", text: "D2", owner: "D", status: "pending", color: "bg-amber-400" },
                ],
            };
            const result = (0, ladder_state_1.absorbNextD)(stacks, "merged step");
            strict_1.default.equal(result.stacks.D.length, 1);
            strict_1.default.equal(result.stacks.C.length, 1);
            strict_1.default.equal(result.stacks.C[0].text, "merged step");
            strict_1.default.equal(result.absorbedId, "d1");
        },
    },
    {
        name: "createPulseKey returns a unique non-empty value",
        run: () => {
            const first = (0, ladder_state_1.createPulseKey)("audit");
            const startTime = Date.now();
            while (Date.now() - startTime < 2) {
                // busy wait to ensure timestamp changes
            }
            const second = (0, ladder_state_1.createPulseKey)("audit");
            strict_1.default.ok(first.length > 0);
            strict_1.default.ok(second.length > 0);
            strict_1.default.notEqual(first, second);
        },
    },
];
