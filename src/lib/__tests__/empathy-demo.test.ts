import assert from "node:assert/strict";

import {
  buildEmpathyDemoPayload,
  DEMO_EMPATHY_BACKGROUND,
  DEMO_EMPATHY_FEEDBACK,
} from "../empathy-demo";
import { type AsyncTestCase } from "./test-helpers";

export const empathyDemoCases: AsyncTestCase[] = [
  {
    name: "buildEmpathyDemoPayload returns stable demo fields",
    run: () => {
      const payload = buildEmpathyDemoPayload("original text");

      assert.equal(payload.originalContent, "original text");
      assert.equal(payload.feedback, DEMO_EMPATHY_FEEDBACK);
      assert.equal(payload.background, DEMO_EMPATHY_BACKGROUND);
    },
  },
];
