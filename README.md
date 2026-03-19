# TruthPress Hackathon

`TruthPress` 是一个围绕 “A/B/C 求真链路 + Agent D 共情补充 + SecondMe 记忆上下文” 搭建的 Hackathon 项目。

这份 README 按 `2026-03-19` 的真实仓库状态编写，只描述已经在仓库中落地、并且可以从代码中核实到的能力。

## 2026-03-19 Hardening Updates

- Session cookie 涓嶅啀鐩存帴瀛樺偍瑁?user.id`r
- 璁よ瘉鐜板湪閫氳繃鏈嶅姟绔?AppSession 鍏煎琛ㄨВ鏋?opaque token
- POST /api/generate 鐨勮韩浠藉綊灞炲畬鍏ㄧ敱鏈嶅姟绔喅瀹?- 鍖垮悕璋冪敤鍏佽鐢熸垚锛屼絾涓嶅厑璁稿惎鐢?empathy锛屼篃涓嶄細璇诲彇浠讳綍瀛樺偍璁板繂
- Agent D 淇濇寔涓?supplement 灞傦紝涓嶅啀瑕嗙洊 A/B/C 鐨?inalContent`r
- empathy 杈撳嚭鐜板湪閫氳繃 empatheticSupplement 鍗曠嫭鏆撮湶
- 
ext.config.mjs 涓嶅啀鍚炴帀 TypeScript 鍜?ESLint 鏋勫缓閿欒

## 2026-03-19 Audit Verdict

- Phase 1 added at-rest token encryption for newly persisted OAuth tokens; configure TOKEN_ENCRYPTION_KEY to override the fallback secret derivation.
- Confirmed and fixed: runtime validation for SecondMe OAuth env vars
- Confirmed and fixed: explicit OAuth state expiry validation in auth callback
- Confirmed and fixed: chat request payload validation
- Confirmed and fixed: targeted rate limiting for uth/login, generate, empathy-v2, and chat`r
- Confirmed and fixed: Python dependency version ranges in equirements.txt`r
- Confirmed and fixed: noisy ladder debug console.log cleanup
- False positives in the external report: README.md and .env.example already exist in the repo
- Deferred by design: token encryption at rest, broader structured error architecture, and full API-wide distributed rate limiting

## 当前结论

- 对外主入口仍是 `/cafe`，但通过 `next.config.mjs` rewrite 到当前真实实现页 `/truth-ladder`
- 登录用户会走真实的 `A -> B -> C` 生成流程，请求 `POST /api/generate`
- 当用户表达“不认同 / 希望被理解”时，当前主链路会调用 `POST /api/empathy-v2`
- 匿名用户仍可体验演示流程；匿名共情必须附带 `userBackground`
- 生成结果和共情补充都会落到本地 SQLite 的 `ContentHistory` 表
- `/dashboard` 会展示历史总数、最近一次生成、最近一次共情、最近 5 条记录
- `/dashboard/history` 支持完整历史列表，以及 `全部 / 生成 / 共情` 三种筛选
- `/dashboard/history/[id]` 可以回看单次生成或共情记录的完整细节
- `/api/profile` 会统一返回 `user + profile + memorySummary + memoryHighlights`
- `/api/memories` 与 `/dashboard/memories` 已经把记忆能力从 profile 页面中拆出
- 认证读取统一收口到 `src/lib/auth-session.ts`，并提供 `GET /api/auth/session`
- 记忆快照会同步到独立的 `MemorySnapshot` 表，`/api/memories` 优先读取该层，再回退到 profile 缓存
- `/truth-ladder` 会展示 Agent D 当前可用的记忆片段，并在共情后展示“本次共情依据”

## 与项目详情对齐状态

| 项目详情能力 | 当前状态 | 说明 |
|---|---|---|
| Agent A 发散思考 | 已实现 | `src/lib/agents/agent-a.ts` |
| Agent B 联网核查 | 已实现 | `src/lib/agents/agent-b.ts` |
| Agent C 综合输出 | 已实现 | `src/lib/agents/agent-c.ts` |
| `/api/generate` 输出 docs 定义的 stages 结构 | 已实现 | `src/app/api/generate/route.ts` + `src/lib/generate-service.ts` |
| Agent D 共情补充 | 已实现 | `src/app/api/empathy-v2/route.ts` 是当前主链路实现 |
| 登录用户使用 SecondMe `softMemory` | 已实现 | `src/app/api/profile/route.ts` 会缓存到 `Profile.softMemory` |
| 记忆摘要与共情片段展示 | 已实现 | `src/lib/user-memory.ts` + `/dashboard/profile` |
| Agent D 共情依据可视化 | 已实现 | `/truth-ladder` 会展示可用记忆片段与本次共情依据 |
| 历史浏览与详情回看 | 已实现 | `/dashboard/history` 支持筛选，`/dashboard/history/[id]` 支持详情 |
| 独立记忆接口 | 已实现 | `/api/memories` + `/dashboard/memories` |
| 独立 Memories 持久化层 | 部分对齐 | 已有 `MemorySnapshot` 表与同步逻辑，但未切回 Prisma Client 正式模型 |
| 匿名用户通过 `userBackground` 触发共情 | 已实现 | `/api/empathy-v2` 要求 `userFeedback + userBackground` |
| `/cafe` 作为主体体验入口 | 已实现 | 通过 `next.config.mjs` rewrite 到 `/truth-ladder` |
| Content History 持久化 | 已实现 | `src/lib/content-history.ts` 使用 SQLite 原生 SQL 建表读写 |
| dashboard 展示真实用户数据 | 已实现 | `src/app/dashboard/page.tsx` 已接真实 session 与内容历史 |
| NextAuth + SecondMe OAuth | 部分对齐 | 已统一到 `auth-session` 抽象层，但底层仍是本地 OAuth + 自管 session |
| 独立 Memories 表 / 记忆管理 UI | 部分对齐 | 已有独立接口与页面，但底层仍以 `softMemory` 缓存为主 |
| 完全清理旧辩论原型 | 未对齐 | `api/debate`、`actions/debate.ts`、`components/cafe/*` 仍保留 |

## 当前主链路

### 1. 首页与入口

- `/` 是当前项目首页，解释 A/B/C/D 分工与产品状态
- `/cafe` 是对外约定入口
- `/truth-ladder` 是当前真实页面实现

### 2. 认证现状

当前认证仍然是 `SecondMe OAuth + 本地服务端 session`，但已经完成两层收口：

- `src/lib/auth-session.ts`
- `src/lib/session-store.ts`

当前 cookie 中保存的是 opaque session token，服务端通过 `AppSession` 兼容表解析到真实用户，再继续读取 `User/Profile`。

### 3. 真实生成链路

登录用户在 `/cafe` 输入观点后：

1. 前端请求 `POST /api/generate`
2. Agent A 先发散拆解 claim
3. Agent B 对 claim 做核查
4. Agent C 基于核查结果生成最终内容
5. 如需共情表达，Agent D 只作为 supplement，不覆盖真值输出

相关文件：

- `src/app/truth-ladder/page.tsx`
- `src/app/api/generate/route.ts`
- `src/lib/generate-pipeline.ts`
- `src/lib/generate-service.ts`
- `src/lib/generate-request.ts`

### 4. 共情补充链路

当用户对结论不认同，或觉得表达“太冷”时：

1. 前端请求 `POST /api/empathy`
2. 当前主链路直接调用 `POST /api/empathy-v2`
3. 登录用户读取本地缓存的 `softMemory` 摘要
4. 匿名用户必须额外提供 `userBackground`
5. 返回“共情补充”，不替换原结论，只做补充表达

相关文件：

- `src/app/api/empathy-v2/route.ts`
- `src/lib/empathy.ts`
- `src/lib/agent-summary.ts`
- `src/lib/empathy-demo.ts`

### 5. 内容历史

生成和共情补充都会写入本地 SQLite 的 `ContentHistory` 表。

当前 dashboard 能力包括：

- 历史记录总数
- 最近一次 A/B/C 生成
- 最近一次 Agent D 共情补充
- 最近 5 条记录
- `/dashboard/history` 中的完整历史列表与类型筛选
- `/dashboard/history/[id]` 中的单条记录详情回看

相关文件：

- `src/lib/content-history.ts`
- `src/app/dashboard/page.tsx`
- `src/app/dashboard/history/page.tsx`
- `src/app/dashboard/history/[id]/page.tsx`

### 6. 资料与记忆上下文

`/dashboard/profile` 会展示：

- 当前账号的 `memorySummary`
- 从 `softMemory` 提取出的 `memoryHighlights`
- 原始 `Shades`
- 原始 `Soft Memory`

同时也新增了独立的记忆接口、页面与快照存储：

- `GET /api/memories`
- `/dashboard/memories`
- `src/lib/memory-snapshot.ts`

相关文件：

- `src/lib/user-memory.ts`
- `src/app/dashboard/profile/page.tsx`
- `src/app/dashboard/memories/page.tsx`
- `src/app/api/memories/route.ts`

## 当前保留的旧能力

以下模块仍在仓库中，但已经不是当前主产品链路：

- `src/app/api/debate/route.ts`
- `src/app/actions/debate.ts`
- `src/lib/debate-engine.ts`
- `src/components/cafe/cafe-experience.tsx`

这些模块更接近早期的“观点匹配 + 合成对手 + Judge 裁决”辩论原型。当前没有把它们作为默认用户入口。

## 运行与验证

以下命令在当前环境中是可执行的验证基线：

```bash
npx.cmd tsc -p tsconfig.json --noEmit
npm.cmd test
npm.cmd run build
npm.cmd run postinstall
node .tmp-tests/src/lib/session-store.test.js
node .tmp-tests/src/lib/generate-request.test.js
node .tmp-tests/src/lib/generate-service.test.js
node .tmp-tests/src/lib/generate-pipeline.test.js
```

说明：

- 当前环境无法正常使用 `tsx` / `esbuild` / 直接执行 `prisma generate`，因为系统层面存在 `child_process.spawn/fork -> EPERM` 阻塞
- `npm.cmd run build` 当前可以通过，因为 `next.config.mjs` 已显式启用 `experimental.workerThreads = true`，避开了 Next 默认的子进程 worker 路径
- `npm.cmd run postinstall` 会先尝试执行 Prisma CLI；若当前机器继续阻止相关 spawn/fork，则会自动降级为兼容跳过，而不是让安装失败
- 同一个 `postinstall-compat.cjs` 还会给本地 Next 14 分发包补一层兼容补丁，避开空 `revalidateTag([])` 在本机上的无效 IPC URL 调用
- 因此，`ContentHistory`、`MemorySnapshot`、`AppSession` 目前通过原生 SQL 兼容层工作，而不是依赖新的 Prisma Client 生成

## 环境变量

先复制：

```bash
copy .env.local.example .env.local
```

至少需要这些配置：

```env
DATABASE_URL="file:./prisma/dev.db"

NEXT_PUBLIC_SECONDME_API_URL=https://api.second.me
NEXT_PUBLIC_SECONDME_OAUTH_URL=https://second.me/oauth2/authorize
SECONDME_CLIENT_ID=your_client_id
SECONDME_CLIENT_SECRET=your_client_secret
SECONDME_CALLBACK_URL=http://localhost:3000/api/auth/callback

LLM_API_KEY=your_key
LLM_BASE_URL=https://api.deepseek.com
LLM_MODEL_NAME=deepseek-chat
```

兼容变量也支持：

```env
DEEPSEEK_API_KEY=your_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat
OPENAI_API_KEY=your_key
```

## 启动

```bash
npm.cmd install
npm.cmd run dev
```

建议按这个顺序检查：

1. 打开 `/`
2. 进入 `/cafe`
3. 匿名模式确认演示流程能自动播放
4. 登录 SecondMe 后提交一个真实观点
5. 在结论区触发一次 Agent D 共情补充
6. 打开 `/dashboard` 查看最近历史
7. 打开 `/dashboard/history` 验证筛选与详情跳转

## 仍需继续对齐的地方

如果目标是让项目和 `docs/项目详情.md` 更彻底一致，下一轮优先级建议如下：

1. 迁移到底层 NextAuth
2. 把 `ContentHistory`、`MemorySnapshot`、`AppSession` 正式迁回 Prisma Client 管理
3. 清理旧辩论原型
4. 补正式的记忆管理能力
5. 补产品级 QA 与完整回归

## 目录速览

```text
src/
  app/
    page.tsx                        # 当前首页
    truth-ladder/page.tsx           # 当前真实主页面
    cafe/page.tsx                   # 保留文件，由 next rewrite 绕过
    dashboard/page.tsx              # dashboard 概览
    dashboard/history/page.tsx      # 历史列表与筛选
    dashboard/history/[id]/page.tsx # 历史详情
    dashboard/memories/page.tsx     # 独立记忆视图
    api/
      generate/route.ts             # A/B/C 生成接口
      empathy-v2/route.ts           # 当前可维护的共情实现
      empathy/route.ts              # 对外入口，由 rewrite 转到 v2
      profile/route.ts              # SecondMe 用户资料同步
      memories/route.ts             # Agent D 记忆上下文接口
      auth/*                        # OAuth 登录流程
      auth/session/route.ts         # 统一 session 查询
      debate/route.ts               # 旧辩论 API
  lib/
    agents/*                        # Agent A/B/C
    generate-*.ts                   # docs 对齐后的生成协议与服务层
    generate-request.ts             # generate 鉴权与归属规则
    session-store.ts                # AppSession 兼容层
    empathy.ts                      # 共情 prompt 与上下文逻辑
    content-history.ts              # 内容历史建表/写入/查询
    memory-snapshot.ts              # 记忆快照建表/写入/查询
    auth-session.ts                 # 统一认证抽象层
    debate-engine.ts                # 旧辩论引擎
prisma/
  schema.prisma                     # 当前数据库 schema
docs/
  项目详情.md                       # 产品目标与理想方案
```

## License

Hackathon demo project.
