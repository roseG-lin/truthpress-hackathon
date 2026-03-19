const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

function runPrismaGenerate() {
  const script = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [script, "generate"], { stdio: "inherit" });

  if (result.error) {
    if (["EPERM", "EINVAL"].includes(result.error.code)) {
      console.warn("Skipping prisma generate because this environment blocks child_process spawn/fork.");
      return;
    }

    throw result.error;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    if (result.status === 1) {
      console.warn(
        "Skipping prisma generate because this environment cannot execute the Prisma CLI successfully.",
      );
      return;
    }

    process.exit(result.status);
  }
}

function patchNextEmptyRevalidateTags() {
  const targets = [
    path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "server",
      "future",
      "route-modules",
      "app-route",
      "module.js",
    ),
    path.join(process.cwd(), "node_modules", "next", "dist", "server", "app-render", "app-render.js"),
    path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "server",
      "app-render",
      "action-handler.js",
    ),
    path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "esm",
      "server",
      "future",
      "route-modules",
      "app-route",
      "module.js",
    ),
    path.join(process.cwd(), "node_modules", "next", "dist", "esm", "server", "app-render", "app-render.js"),
    path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "esm",
      "server",
      "app-render",
      "action-handler.js",
    ),
    path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "compiled",
      "next-server",
      "app-route.runtime.prod.js",
    ),
    path.join(
      process.cwd(),
      "node_modules",
      "next",
      "dist",
      "compiled",
      "next-server",
      "app-route-experimental.runtime.prod.js",
    ),
  ];

  const replacements = [
    [
      "(_staticGenerationStore_incrementalCache = staticGenerationStore.incrementalCache) == null ? void 0 : _staticGenerationStore_incrementalCache.revalidateTag(staticGenerationStore.revalidatedTags || [])",
      "(staticGenerationStore.revalidatedTags == null ? void 0 : staticGenerationStore.revalidatedTags.length) ? ((_staticGenerationStore_incrementalCache = staticGenerationStore.incrementalCache) == null ? void 0 : _staticGenerationStore_incrementalCache.revalidateTag(staticGenerationStore.revalidatedTags)) : undefined",
    ],
    [
      "(_staticGenerationStore_incrementalCache1 = staticGenerationStore.incrementalCache) == null ? void 0 : _staticGenerationStore_incrementalCache1.revalidateTag(staticGenerationStore.revalidatedTags || [])",
      "(staticGenerationStore.revalidatedTags == null ? void 0 : staticGenerationStore.revalidatedTags.length) ? ((_staticGenerationStore_incrementalCache1 = staticGenerationStore.incrementalCache) == null ? void 0 : _staticGenerationStore_incrementalCache1.revalidateTag(staticGenerationStore.revalidatedTags)) : undefined",
    ],
    [
      "(_ctx_staticGenerationStore_incrementalCache = ctx.staticGenerationStore.incrementalCache) == null ? void 0 : _ctx_staticGenerationStore_incrementalCache.revalidateTag(ctx.staticGenerationStore.revalidatedTags || [])",
      "(ctx.staticGenerationStore.revalidatedTags == null ? void 0 : ctx.staticGenerationStore.revalidatedTags.length) ? ((_ctx_staticGenerationStore_incrementalCache = ctx.staticGenerationStore.incrementalCache) == null ? void 0 : _ctx_staticGenerationStore_incrementalCache.revalidateTag(ctx.staticGenerationStore.revalidatedTags)) : undefined",
    ],
    [
      "null==(o=n.incrementalCache)?void 0:o.revalidateTag(n.revalidatedTags||[])",
      "(null==n.revalidatedTags?void 0:n.revalidatedTags.length)?null==(o=n.incrementalCache)?void 0:o.revalidateTag(n.revalidatedTags):void 0",
    ],
    [
      "null==(m=e.staticGenerationStore.incrementalCache)?void 0:m.revalidateTag(e.staticGenerationStore.revalidatedTags||[])",
      "(null==e.staticGenerationStore.revalidatedTags?void 0:e.staticGenerationStore.revalidatedTags.length)?null==(m=e.staticGenerationStore.incrementalCache)?void 0:m.revalidateTag(e.staticGenerationStore.revalidatedTags):void 0",
    ],
    [
      "null==(c=V.incrementalCache)?void 0:c.revalidateTag(V.revalidatedTags||[])",
      "(null==V.revalidatedTags?void 0:V.revalidatedTags.length)?null==(c=V.incrementalCache)?void 0:c.revalidateTag(V.revalidatedTags):void 0",
    ],
  ];

  let patchedFiles = 0;

  for (const target of targets) {
    if (!fs.existsSync(target)) {
      continue;
    }

    const source = fs.readFileSync(target, "utf8");
    let next = source;

    for (const [search, replacement] of replacements) {
      next = next.split(search).join(replacement);
    }

    if (next !== source) {
      fs.writeFileSync(target, next, "utf8");
      patchedFiles += 1;
    }
  }

  if (patchedFiles > 0) {
    console.warn(
      `Applied Next.js compatibility patch for empty revalidateTag([]) calls in ${patchedFiles} file(s).`,
    );
  }
}

runPrismaGenerate();
runPrismaDbPush();
patchNextEmptyRevalidateTags();

function runPrismaDbPush() {
  // 只在生产环境运行 db push
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const script = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  const result = spawnSync(process.execPath, [script, "db", "push", "--skip-generate"], { stdio: "inherit" });

  if (result.error) {
    console.warn("Could not run prisma db push:", result.error.message);
    return;
  }

  if (typeof result.status === "number" && result.status !== 0) {
    console.warn(`prisma db push exited with status ${result.status}`);
  }
}
