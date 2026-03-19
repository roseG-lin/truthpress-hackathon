import type { AgentType, Block } from "./game-types";

export type LaneStacks = Record<AgentType, Block[]>;

const OWNER_COLOR: Record<AgentType, string> = {
  A: "bg-blue-500",
  B: "bg-red-500",
  C: "bg-violet-500",
  D: "bg-amber-400",
};

function createBlock(owner: AgentType, text: string, status: Block["status"] = "pending"): Block {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    owner,
    status,
    color: OWNER_COLOR[owner],
  };
}

export function createEmptyStacks(): LaneStacks {
  return { A: [], B: [], C: [], D: [] };
}

export function applyAuditOutcome(
  stacks: LaneStacks,
  index: number,
  result: "verified" | "debunked" | "uncertain",
  claim?: string,
): { stacks: LaneStacks } {
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

export function finalizeEmpathyMerge(stacks: LaneStacks, finalText: string): LaneStacks {
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

export function appendCConclusion(stacks: LaneStacks, text: string): LaneStacks {
  const block: Block = {
    id: `block-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    owner: "C",
    status: "pending",
    color: "bg-blue-500", // 初始结论使用蓝色
  };
  return { ...stacks, C: [...stacks.C, block] };
}

export function appendABuild(stacks: LaneStacks, text: string): LaneStacks {
  const block = createBlock("A", text);
  return { ...stacks, A: [...stacks.A, block] };
}

export function appendDChallenge(stacks: LaneStacks, text: string): LaneStacks {
  const block = createBlock("D", text);
  return { ...stacks, D: [...stacks.D, block] };
}

export function appendEmpathyStep(stacks: LaneStacks, text: string): LaneStacks {
  const block = createBlock("C", text);
  return { ...stacks, C: [...stacks.C, block] };
}

export function createPulseKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function absorbNextD(
  stacks: LaneStacks,
  text: string,
): { stacks: LaneStacks; absorbedId?: string } {
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
