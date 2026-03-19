import { rm } from "node:fs/promises";
import path from "node:path";

export function getBuildArtifactPaths(projectRoot: string): string[] {
  return [path.join(projectRoot, ".next"), path.join(projectRoot, ".tmp-tests")];
}

export async function removeBuildArtifacts(projectRoot: string): Promise<void> {
  const targets = getBuildArtifactPaths(projectRoot);

  await Promise.all(
    targets.map(async (targetPath) => {
      await rm(targetPath, { recursive: true, force: true });
    }),
  );
}
