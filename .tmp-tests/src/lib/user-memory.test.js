"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMemoryCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const user_memory_1 = require("./user-memory");
const test_helpers_1 = require("./__tests__/test-helpers");
exports.userMemoryCases = [
    {
        name: "parseStoredJson returns null for invalid input",
        run: () => {
            strict_1.default.equal((0, user_memory_1.parseStoredJson)("{broken"), null);
            strict_1.default.equal((0, user_memory_1.parseStoredJson)(null), null);
        },
    },
    {
        name: "extractMemoryHighlights returns unique text leaves",
        run: () => {
            const result = (0, user_memory_1.extractMemoryHighlights)({
                education: ["Rural school", "Rural school"],
                family: {
                    note: "Needed extra support",
                },
            });
            strict_1.default.deepEqual(result, ["Rural school", "Needed extra support"]);
        },
    },
    {
        name: "buildProfilePayload exposes memory summary and compatibility fields",
        run: () => {
            const payload = (0, user_memory_1.buildProfilePayload)({
                secondMeId: "secondme-user",
                displayName: "Remi",
                bio: "Builder",
                avatar: "avatar.png",
                shades: { style: "reflective" },
                softMemory: { note: "Grew up with limited education resources" },
            });
            strict_1.default.equal(payload.secondMeId, "secondme-user");
            strict_1.default.equal(payload.displayName, "Remi");
            strict_1.default.equal(payload.profiles[0]?.displayName, "Remi");
            strict_1.default.match(payload.memorySummary || "", /education|resources|limited/i);
            strict_1.default.deepEqual(payload.memoryHighlights, ["Grew up with limited education resources"]);
        },
    },
];
(0, test_helpers_1.runCases)("User Memory", exports.userMemoryCases).catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
