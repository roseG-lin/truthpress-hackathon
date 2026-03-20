"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cafeAccessCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const cafe_access_1 = require("../cafe-access");
exports.cafeAccessCases = [
    {
        name: "resolveCafeAccess returns demo mode for anonymous user",
        run: () => {
            const access = (0, cafe_access_1.resolveCafeAccess)(null);
            strict_1.default.equal(access.mode, "demo");
            strict_1.default.equal(access.canInput, false);
            strict_1.default.equal(access.showLogin, true);
        },
    },
    {
        name: "resolveCafeAccess returns interactive mode for logged-in user",
        run: () => {
            const access = (0, cafe_access_1.resolveCafeAccess)({ id: "user" });
            strict_1.default.equal(access.mode, "interactive");
            strict_1.default.equal(access.canInput, true);
            strict_1.default.equal(access.showLogin, false);
        },
    },
];
