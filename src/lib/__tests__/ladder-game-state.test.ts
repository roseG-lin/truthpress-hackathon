import assert from "node:assert/strict";

import {
  createEmptyStacks,
  applyAuditOutcome,
  absorbNextD,
  appendABuild,
  createPulseKey,
  appendCConclusion,
  appendDChallenge,
  appendEmpathyStep,
  finalizeEmpathyMerge,
  type LaneStacks,
} from "../../components/ladder/ladder-state";
import { type AsyncTestCase } from "./test-helpers";

export const ladderGameStateCases: AsyncTestCase[] = [
  {
    name: "createEmptyStacks returns empty lanes for A/B/C/D",
    run: () => {
      const stacks = createEmptyStacks();
      assert.deepEqual(stacks.A, []);
      assert.deepEqual(stacks.B, []);
      assert.deepEqual(stacks.C, []);
      assert.deepEqual(stacks.D, []);
    },
  },
  {
    name: "applyAuditOutcome verifies A block without adding B block",
    run: () => {
      const stacks: LaneStacks = {
        A: [{ id: "a1", text: "A1", owner: "A", status: "pending", color: "bg-blue-500" }],
        B: [],
        C: [],
        D: [],
      };

      const result = applyAuditOutcome(stacks, 0, true);

      assert.equal(result.stacks.A[0].status, "verified");
      assert.equal(result.stacks.B.length, 0);
    },
  },
  {
    name: "applyAuditOutcome rejects A block and adds red block to B",
    run: () => {
      const stacks: LaneStacks = {
        A: [{ id: "a1", text: "A1", owner: "A", status: "pending", color: "bg-blue-500" }],
        B: [],
        C: [],
        D: [],
      };

      const result = applyAuditOutcome(stacks, 0, false);

      assert.equal(result.stacks.A.length, 0);
      assert.equal(result.stacks.B.length, 1);
      assert.equal(result.stacks.B[0].status, "rejected");
    },
  },
  {
    name: "finalizeEmpathyMerge clears D and leaves a single golden C block",
    run: () => {
      const stacks: LaneStacks = {
        A: [],
        B: [],
        C: [
          { id: "c1", text: "C1", owner: "C", status: "pending", color: "bg-violet-500" },
          { id: "c2", text: "C2", owner: "C", status: "pending", color: "bg-violet-500" },
        ],
        D: [{ id: "d1", text: "D1", owner: "D", status: "pending", color: "bg-amber-400" }],
      };

      const result = finalizeEmpathyMerge(stacks, "final empathy");

      assert.equal(result.C.length, 1);
      assert.equal(result.C[0].status, "merged");
      assert.equal(result.C[0].text, "final empathy");
      assert.equal(result.D.length, 0);
    },
  },
  {
    name: "appendCConclusion adds a C summary block",
    run: () => {
      const stacks = createEmptyStacks();
      const result = appendCConclusion(stacks, "summary");

      assert.equal(result.C.length, 1);
      assert.equal(result.C[0].owner, "C");
      assert.equal(result.C[0].text, "summary");
    },
  },
  {
    name: "appendABuild adds an A block",
    run: () => {
      const stacks = createEmptyStacks();
      const result = appendABuild(stacks, "idea");

      assert.equal(result.A.length, 1);
      assert.equal(result.A[0].owner, "A");
      assert.equal(result.A[0].text, "idea");
    },
  },
  {
    name: "appendDChallenge adds a D challenge block",
    run: () => {
      const stacks = createEmptyStacks();
      const result = appendDChallenge(stacks, "challenge");

      assert.equal(result.D.length, 1);
      assert.equal(result.D[0].owner, "D");
      assert.equal(result.D[0].text, "challenge");
    },
  },
  {
    name: "appendEmpathyStep appends a new C block",
    run: () => {
      const stacks = createEmptyStacks();
      const result = appendEmpathyStep(stacks, "empathy step");

      assert.equal(result.C.length, 1);
      assert.equal(result.C[0].owner, "C");
      assert.equal(result.C[0].text, "empathy step");
    },
  },
  {
    name: "absorbNextD moves one D block into C and removes it from D",
    run: () => {
      const stacks: LaneStacks = {
        A: [],
        B: [],
        C: [],
        D: [
          { id: "d1", text: "D1", owner: "D", status: "pending", color: "bg-amber-400" },
          { id: "d2", text: "D2", owner: "D", status: "pending", color: "bg-amber-400" },
        ],
      };

      const result = absorbNextD(stacks, "merged step");

      assert.equal(result.stacks.D.length, 1);
      assert.equal(result.stacks.C.length, 1);
      assert.equal(result.stacks.C[0].text, "merged step");
      assert.equal(result.absorbedId, "d1");
    },
  },
  {
    name: "createPulseKey returns a unique non-empty value",
    run: () => {
      const first = createPulseKey("audit");
      const startTime = Date.now();
      while (Date.now() - startTime < 2) {
        // busy wait to ensure timestamp changes
      }
      const second = createPulseKey("audit");

      assert.ok(first.length > 0);
      assert.ok(second.length > 0);
      assert.notEqual(first, second);
    },
  },
];
