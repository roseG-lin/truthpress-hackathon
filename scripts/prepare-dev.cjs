const fs = require("node:fs/promises");
const path = require("node:path");

async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const targets = [".next", ".tmp-tests"].map((entry) => path.join(projectRoot, entry));

  await Promise.all(
    targets.map(async (targetPath) => {
      await fs.rm(targetPath, { recursive: true, force: true });
    }),
  );

  console.log("Cleared stale build artifacts (.next, .tmp-tests).");
}

main().catch((error) => {
  console.error("Failed to prepare dev environment.");
  console.error(error);
  process.exit(1);
});
