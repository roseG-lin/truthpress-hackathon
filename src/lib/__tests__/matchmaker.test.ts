import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  createOpinionStore,
  findOpposingOpinion,
  resolveOpponent,
  type OpinionRecord,
} from "../matchmaker";
import { createAnonymousDebateUser, mergeUserProfile } from "../runtime";
import { type AsyncTestCase } from "./test-helpers";

export const matchmakerCases: AsyncTestCase[] = [
  {
    name: "createOpinionStore persists opinions to the JSON file",
    run: async () => {
      const dir = await mkdtemp(path.join(tmpdir(), "truthpress-matchmaker-"));
      const filePath = path.join(dir, "opinions.json");

      try {
        const store = createOpinionStore(filePath);
        const saved = await store.append({
          userId: "user-1",
          topic: "AI should replace teachers",
          stanceText: "AI should replace teachers because scale matters.",
          displayName: "Alice",
          avatarUrl: "https://example.com/alice.png",
          sourceType: "anonymous",
        });

        const content = JSON.parse(await readFile(filePath, "utf8")) as OpinionRecord[];

        assert.equal(content.length, 1);
        assert.equal(content[0].id, saved.id);
        assert.equal(content[0].displayName, "Alice");
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
  },
  {
    name: "findOpposingOpinion prefers a real opposite stance before fallback",
    run: () => {
      const opinions: OpinionRecord[] = [
        {
          id: "op-1",
          userId: "user-2",
          topic: "AI should replace teachers",
          stanceText: "AI should not replace teachers because empathy matters.",
          displayName: "Jordan",
          avatarUrl: "https://example.com/jordan.png",
          sourceType: "secondme",
          createdAt: "2026-03-17T10:00:00.000Z",
        },
        {
          id: "op-2",
          userId: "user-3",
          topic: "AI should replace teachers",
          stanceText: "AI should replace teachers because scale matters.",
          displayName: "Taylor",
          avatarUrl: "https://example.com/taylor.png",
          sourceType: "anonymous",
          createdAt: "2026-03-17T11:00:00.000Z",
        },
      ];

      const match = findOpposingOpinion(
        {
          userId: "user-1",
          topic: "AI should replace teachers",
          stanceText: "AI should replace teachers in most classrooms.",
        },
        opinions,
      );

      assert.ok(match);
      assert.equal(match?.userId, "user-2");
    },
  },
  {
    name: "resolveOpponent falls back to synthetic persona when no real match exists",
    run: async () => {
      const dir = await mkdtemp(path.join(tmpdir(), "truthpress-opponent-"));
      const filePath = path.join(dir, "opinions.json");

      try {
        const store = createOpinionStore(filePath);
        const opponent = await resolveOpponent(
          {
            currentOpinion: {
              userId: "user-1",
              topic: "Pineapple belongs on pizza",
              stanceText: "Pineapple belongs on pizza because sweet-salty contrast works.",
              displayName: "Casey",
              avatarUrl: "",
              sourceType: "anonymous",
            },
            store,
          },
          async () => ({
            name: "SaltyPurist99",
            avatarUrl: "https://example.com/purist.png",
            bio: "A late-night forum regular who distrusts fruit on savory food.",
            argument: "Pineapple ruins pizza texture and overwhelms the cheese.",
            sourceType: "synthetic",
          }),
        );

        assert.equal(opponent.sourceType, "synthetic");
        assert.equal(opponent.name, "SaltyPurist99");
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
  },
  {
    name: "runtime helpers support anonymous fallback and SecondMe enrichment",
    run: () => {
      const anonymous = createAnonymousDebateUser();
      const merged = mergeUserProfile(anonymous, {
        id: "db-user-1",
        secondMeId: "secondme-123",
        displayName: "Rina",
        avatarUrl: "https://example.com/rina.png",
        bio: "SecondMe profile",
      });

      assert.match(anonymous.userId, /^anon-/);
      assert.equal(anonymous.sourceType, "anonymous");
      assert.equal(merged.userId, "db-user-1");
      assert.equal(merged.displayName, "Rina");
      assert.equal(merged.sourceType, "secondme");
    },
  },
];
