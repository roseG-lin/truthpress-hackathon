"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRequestCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const test_helpers_1 = require("./__tests__/test-helpers");
const generate_request_1 = require("./generate-request");
exports.generateRequestCases = [
    {
        name: "normalizeGenerateRequest allows anonymous generate requests without empathy",
        run: () => {
            const result = (0, generate_request_1.normalizeGenerateRequest)({
                topic: "AI should replace teachers",
                requestedUserId: "someone-else",
                enableEmpathy: false,
                sessionUser: null,
            });
            strict_1.default.equal(result.ok, true);
            if (!result.ok) {
                throw new Error("expected anonymous request to be accepted");
            }
            strict_1.default.equal(result.value.userId, "anonymous");
            strict_1.default.equal(result.value.enableEmpathy, false);
        },
    },
    {
        name: "normalizeGenerateRequest rejects anonymous empathy requests",
        run: () => {
            const result = (0, generate_request_1.normalizeGenerateRequest)({
                topic: "AI should replace teachers",
                requestedUserId: "secondme-user",
                enableEmpathy: true,
                sessionUser: null,
            });
            strict_1.default.equal(result.ok, false);
            if (result.ok) {
                throw new Error("expected anonymous empathy request to be rejected");
            }
            strict_1.default.equal(result.error, "AUTH_REQUIRED_FOR_EMPATHY");
        },
    },
    {
        name: "normalizeGenerateRequest ignores mismatched client userId for authenticated users",
        run: () => {
            const result = (0, generate_request_1.normalizeGenerateRequest)({
                topic: "AI should replace teachers",
                requestedUserId: "attacker-controlled-id",
                enableEmpathy: true,
                sessionUser: {
                    id: "db-user-1",
                    secondMeId: "secondme-user-1",
                },
            });
            strict_1.default.equal(result.ok, true);
            if (!result.ok) {
                throw new Error("expected authenticated request to be accepted");
            }
            strict_1.default.equal(result.value.userId, "secondme-user-1");
            strict_1.default.equal(result.value.sessionUserId, "db-user-1");
            strict_1.default.equal(result.value.enableEmpathy, true);
        },
    },
];
if (require.main === module) {
    (0, test_helpers_1.runCases)("Generate Request", exports.generateRequestCases).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
