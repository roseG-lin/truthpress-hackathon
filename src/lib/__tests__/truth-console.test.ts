import assert from "node:assert/strict";

import {
  getEvidenceStrength,
  getVerdictAccent,
  summarizeWinningSide,
} from "../truth-console";
import { type AsyncTestCase } from "./test-helpers";

export const truthConsoleCases: AsyncTestCase[] = [
  {
    name: "winning side summary returns readable arena copy",
    run: () => {
      assert.equal(summarizeWinningSide("user"), "当前用户一方更占上风");
      assert.equal(summarizeWinningSide("opponent"), "当前对手一方更占上风");
      assert.equal(summarizeWinningSide("draw"), "当前双方势均力敌");
    },
  },
  {
    name: "verdict accent maps each verdict to stable UI tokens",
    run: () => {
      assert.equal(getVerdictAccent("supported"), "emerald");
      assert.equal(getVerdictAccent("mixed"), "amber");
      assert.equal(getVerdictAccent("unsupported"), "rose");
      assert.equal(getVerdictAccent("uncertain"), "slate");
    },
  },
  {
    name: "evidence strength escalates with richer sources",
    run: () => {
      assert.equal(
        getEvidenceStrength([
          {
            title: "Evidence title",
            snippet: "A long summary that gives enough detail to feel trustworthy.",
            url: "https://example.com/research",
          },
        ]),
        "strong",
      );

      assert.equal(
        getEvidenceStrength([
          {
            title: "Short",
            snippet: "tiny",
            url: "https://example.com",
          },
        ]),
        "medium",
      );

      assert.equal(
        getEvidenceStrength([
          {
            title: "No search results",
            snippet: "No public search results were returned.",
            url: "",
          },
        ]),
        "weak",
      );
    },
  },
];
