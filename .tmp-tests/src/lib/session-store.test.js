"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionStoreCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const test_helpers_1 = require("./__tests__/test-helpers");
const session_store_1 = require("./session-store");
exports.sessionStoreCases = [
    {
        name: "createSessionToken returns an opaque token rather than a user identifier",
        run: () => {
            const token = (0, session_store_1.createSessionToken)();
            strict_1.default.ok(token.length >= 32);
            strict_1.default.ok(!token.includes("user-123"));
            strict_1.default.match(token, /^[A-Za-z0-9_-]+$/);
        },
    },
    {
        name: "hashSessionToken is deterministic and changes when the token is tampered with",
        run: () => {
            const token = (0, session_store_1.createSessionToken)();
            const tampered = `${token}x`;
            strict_1.default.equal((0, session_store_1.hashSessionToken)(token), (0, session_store_1.hashSessionToken)(token));
            strict_1.default.notEqual((0, session_store_1.hashSessionToken)(token), (0, session_store_1.hashSessionToken)(tampered));
        },
    },
];
if (require.main === module) {
    (0, test_helpers_1.runCases)("Session Store", exports.sessionStoreCases).catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
