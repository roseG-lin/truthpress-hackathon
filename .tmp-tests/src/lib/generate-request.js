"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeGenerateRequest = normalizeGenerateRequest;
function normalizeGenerateRequest(input) {
    const topic = input.topic?.trim() || "";
    if (!topic) {
        return {
            ok: false,
            error: "MISSING_FIELDS",
            status: 400,
        };
    }
    if (input.sessionUser) {
        return {
            ok: true,
            value: {
                topic,
                userId: input.sessionUser.secondMeId,
                enableEmpathy: Boolean(input.enableEmpathy),
                sessionUserId: input.sessionUser.id,
            },
        };
    }
    if (input.enableEmpathy) {
        return {
            ok: false,
            error: "AUTH_REQUIRED_FOR_EMPATHY",
            status: 401,
        };
    }
    return {
        ok: true,
        value: {
            topic,
            userId: "anonymous",
            enableEmpathy: false,
            sessionUserId: null,
        },
    };
}
