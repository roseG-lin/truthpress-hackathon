"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCafeAccess = resolveCafeAccess;
function resolveCafeAccess(user) {
    if (user) {
        return { mode: "interactive", canInput: true, showLogin: false };
    }
    return { mode: "demo", canInput: false, showLogin: true };
}
