"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmptyStacks = createEmptyStacks;
exports.applyAuditOutcome = applyAuditOutcome;
exports.finalizeEmpathyMerge = finalizeEmpathyMerge;
exports.appendCConclusion = appendCConclusion;
exports.appendABuild = appendABuild;
exports.appendDChallenge = appendDChallenge;
exports.appendEmpathyStep = appendEmpathyStep;
exports.createPulseKey = createPulseKey;
exports.absorbNextD = absorbNextD;
const OWNER_COLOR = {
    A: "bg-blue-500",
    B: "bg-red-500",
    C: "bg-violet-500",
    D: "bg-amber-400",
};
function createBlock(owner, text, status = "pending") {
    return {
        id: `block-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        owner,
        status,
        color: OWNER_COLOR[owner],
    };
}
function createEmptyStacks() {
    return { A: [], B: [], C: [], D: [] };
}
function applyAuditOutcome(stacks, index, result, claim) {
    const nextA = [...stacks.A];
    const nextB = [...stacks.B];
    const target = nextA[index];
    if (!target) {
        return { stacks };
    }
    if (result === "verified") {
        nextA[index] = { ...target, status: "verified", color: "bg-green-500" };
        return { stacks: { ...stacks, A: nextA, B: nextB } };
    }
    // debunked 或 uncertain：移除 A 的块，在 B 添加结果块
    nextA.splice(index, 1);
    const isDebunked = result === "debunked";
    nextB.push({
        id: `b-reject-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text: isDebunked ? "已反驳" : "存疑",
        owner: "B",
        status: isDebunked ? "debunked" : "uncertain",
        color: isDebunked ? "bg-red-600" : "bg-amber-500",
    });
    return { stacks: { ...stacks, A: nextA, B: nextB } };
}
function finalizeEmpathyMerge(stacks, finalText) {
    return {
        ...stacks,
        C: [
            {
                id: `c-final-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                text: finalText,
                owner: "C",
                status: "merged",
                color: "bg-amber-400",
            },
        ],
        D: [],
    };
}
function appendCConclusion(stacks, text) {
    const block = {
        id: `block-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        text,
        owner: "C",
        status: "pending",
        color: "bg-blue-500", // 初始结论使用蓝色
    };
    return { ...stacks, C: [...stacks.C, block] };
}
function appendABuild(stacks, text) {
    const block = createBlock("A", text);
    return { ...stacks, A: [...stacks.A, block] };
}
function appendDChallenge(stacks, text) {
    const block = createBlock("D", text);
    return { ...stacks, D: [...stacks.D, block] };
}
function appendEmpathyStep(stacks, text) {
    const block = createBlock("C", text);
    return { ...stacks, C: [...stacks.C, block] };
}
function createPulseKey(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function absorbNextD(stacks, text) {
    if (stacks.D.length === 0) {
        return { stacks };
    }
    const [first, ...rest] = stacks.D;
    const nextC = [...stacks.C, createBlock("C", text)];
    return {
        stacks: {
            ...stacks,
            C: nextC,
            D: rest,
        },
        absorbedId: first.id,
    };
}
