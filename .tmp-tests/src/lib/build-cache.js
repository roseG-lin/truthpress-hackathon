"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBuildArtifactPaths = getBuildArtifactPaths;
exports.removeBuildArtifacts = removeBuildArtifacts;
const promises_1 = require("node:fs/promises");
const node_path_1 = __importDefault(require("node:path"));
function getBuildArtifactPaths(projectRoot) {
    return [node_path_1.default.join(projectRoot, ".next"), node_path_1.default.join(projectRoot, ".tmp-tests")];
}
async function removeBuildArtifacts(projectRoot) {
    const targets = getBuildArtifactPaths(projectRoot);
    await Promise.all(targets.map(async (targetPath) => {
        await (0, promises_1.rm)(targetPath, { recursive: true, force: true });
    }));
}
