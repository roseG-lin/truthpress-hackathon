"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchmakerCases = void 0;
const strict_1 = __importDefault(require("node:assert/strict"));
const promises_1 = require("node:fs/promises");
const node_os_1 = require("node:os");
const node_path_1 = __importDefault(require("node:path"));
const matchmaker_1 = require("../matchmaker");
const runtime_1 = require("../runtime");
exports.matchmakerCases = [
    {
        name: "createOpinionStore persists opinions to the JSON file",
        run: async () => {
            const dir = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), "truthpress-matchmaker-"));
            const filePath = node_path_1.default.join(dir, "opinions.json");
            try {
                const store = (0, matchmaker_1.createOpinionStore)(filePath);
                const saved = await store.append({
                    userId: "user-1",
                    topic: "AI should replace teachers",
                    stanceText: "AI should replace teachers because scale matters.",
                    displayName: "Alice",
                    avatarUrl: "https://example.com/alice.png",
                    sourceType: "anonymous",
                });
                const content = JSON.parse(await (0, promises_1.readFile)(filePath, "utf8"));
                strict_1.default.equal(content.length, 1);
                strict_1.default.equal(content[0].id, saved.id);
                strict_1.default.equal(content[0].displayName, "Alice");
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        },
    },
    {
        name: "findOpposingOpinion prefers a real opposite stance before fallback",
        run: () => {
            const opinions = [
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
            const match = (0, matchmaker_1.findOpposingOpinion)({
                userId: "user-1",
                topic: "AI should replace teachers",
                stanceText: "AI should replace teachers in most classrooms.",
            }, opinions);
            strict_1.default.ok(match);
            strict_1.default.equal(match?.userId, "user-2");
        },
    },
    {
        name: "resolveOpponent falls back to synthetic persona when no real match exists",
        run: async () => {
            const dir = await (0, promises_1.mkdtemp)(node_path_1.default.join((0, node_os_1.tmpdir)(), "truthpress-opponent-"));
            const filePath = node_path_1.default.join(dir, "opinions.json");
            try {
                const store = (0, matchmaker_1.createOpinionStore)(filePath);
                const opponent = await (0, matchmaker_1.resolveOpponent)({
                    currentOpinion: {
                        userId: "user-1",
                        topic: "Pineapple belongs on pizza",
                        stanceText: "Pineapple belongs on pizza because sweet-salty contrast works.",
                        displayName: "Casey",
                        avatarUrl: "",
                        sourceType: "anonymous",
                    },
                    store,
                }, async () => ({
                    name: "SaltyPurist99",
                    avatarUrl: "https://example.com/purist.png",
                    bio: "A late-night forum regular who distrusts fruit on savory food.",
                    argument: "Pineapple ruins pizza texture and overwhelms the cheese.",
                    sourceType: "synthetic",
                }));
                strict_1.default.equal(opponent.sourceType, "synthetic");
                strict_1.default.equal(opponent.name, "SaltyPurist99");
            }
            finally {
                await (0, promises_1.rm)(dir, { recursive: true, force: true });
            }
        },
    },
    {
        name: "runtime helpers support anonymous fallback and SecondMe enrichment",
        run: () => {
            const anonymous = (0, runtime_1.createAnonymousDebateUser)();
            const merged = (0, runtime_1.mergeUserProfile)(anonymous, {
                id: "db-user-1",
                secondMeId: "secondme-123",
                displayName: "Rina",
                avatarUrl: "https://example.com/rina.png",
                bio: "SecondMe profile",
            });
            strict_1.default.match(anonymous.userId, /^anon-/);
            strict_1.default.equal(anonymous.sourceType, "anonymous");
            strict_1.default.equal(merged.userId, "db-user-1");
            strict_1.default.equal(merged.displayName, "Rina");
            strict_1.default.equal(merged.sourceType, "secondme");
        },
    },
];
