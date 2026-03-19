import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { getBuildArtifactPaths, removeBuildArtifacts } from "../build-cache";
import { type AsyncTestCase } from "./test-helpers";

async function exists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export const buildCacheCases: AsyncTestCase[] = [
  {
    name: "getBuildArtifactPaths returns the expected cache targets",
    run: () => {
      const projectRoot = "E:/demo-project";
      const targets = getBuildArtifactPaths(projectRoot);

      assert.deepEqual(targets, [
        path.join(projectRoot, ".next"),
        path.join(projectRoot, ".tmp-tests"),
      ]);
    },
  },
  {
    name: "removeBuildArtifacts deletes existing build caches and ignores missing ones",
    run: async () => {
      const projectRoot = await mkdtemp(path.join(tmpdir(), "truthpress-build-cache-"));
      const nextDir = path.join(projectRoot, ".next");
      const testDir = path.join(projectRoot, ".tmp-tests");

      try {
        await mkdir(nextDir, { recursive: true });
        await mkdir(testDir, { recursive: true });
        await writeFile(path.join(nextDir, "trace"), "stale build");
        await writeFile(path.join(testDir, "status.txt"), "stale tests");

        await removeBuildArtifacts(projectRoot);

        assert.equal(await exists(nextDir), false);
        assert.equal(await exists(testDir), false);
      } finally {
        await rm(projectRoot, { recursive: true, force: true });
      }
    },
  },
];
