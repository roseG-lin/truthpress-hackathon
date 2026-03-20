"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCacheCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const promises_1 = require("node:fs/promises");
const node_fs_1 = require("node:fs");
const node_os_1 = require("node:os");
const node_path_1 = __importDefault(require("node:path"));
const build_cache_1 = require("../build-cache");
async function exists(targetPath) {
    try {
        await (0, promises_1.access)(targetPath, node_fs_1.constants.F_OK);
        return true;
    }
    catch {
        return false;
    }
}
exports.buildCacheCases = [
    {
        name: "getBuildArtifactPaths returns the expected cache targets",
        run: () => {
            const projectRoot = "E:/demo-project";
            const targets = (0, build_cache_1.getBuildArtifactPaths)(projectRoot);
            strict_1.default.deepEqual(targets, [
                node_path_1.default.join(projectRoot, ".next"),
                node_path_1.default.join(projectRoot, ".tmp-tests"),
            ]);
        },
    },
    {
        name: "removeBuildArtifacts deletes existing build caches and ignores missing ones",
        run: async () => {
            const projectRoot = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), "truthpress-build-cache-"));
            const nextDir = node_path_1.default.join(projectRoot, ".next");
            const testDir = node_path_1.default.join(projectRoot, ".tmp-tests");
            try {
                await (0, promises_1.mkdir)(nextDir, { recursive: true });
                await (0, promises_1.mkdir)(testDir, { recursive: true });
                await (0, promises_1.writeFile)(node_path_1.default.join(nextDir, "trace"), "stale build");
                await (0, promises_1.writeFile)(node_path_1.default.join(testDir, "status.txt"), "stale tests");
                await (0, build_cache_1.removeBuildArtifacts)(projectRoot);
                strict_1.default.equal(await exists(nextDir), false);
                strict_1.default.equal(await exists(testDir), false);
            }
            finally {
                await (0, promises_1.rm)(projectRoot, { recursive: true, force: true });
            }
        },
    },
];
