# TruthPress_Hackathon - SecondMe 集成项目

## 项目概述

本项目是 SecondMe Hackathon 参赛项目，集成了 SecondMe 的核心功能模块。

## 技术栈

- **前端**: Next.js (React)
- **后端**: Next.js API Routes
- **数据库**: SQLite (Prisma ORM)
- **认证**: OAuth 2.0 (SecondMe)

## 已启用的 SecondMe 模块

| 模块 | 功能 | 权限范围 |
|------|------|---------|
| `auth` | OAuth 认证 | user.info |
| `profile` | 用户资料 | user.info, user.info.shades, user.info.softmemory |
| `chat` | 聊天功能 | chat |
| `note` | 笔记功能 | note.add |
| `voice` | 语音功能 | voice |

## 配置信息

### SecondMe 应用凭证

- **Client ID**: `01107f2e-1765-47b0-9aa3-b4d71cbd560c`
- **Callback URL**: `http://localhost:3000/api/auth/callback`

### 数据库

- **类型**: SQLite
- **位置**: `./dev.db`

## API 端点

- **Base URL**: `https://api.second.me`
- **OAuth 授权**: `https://second.me/oauth2/authorize`
- **Token 获取**: `https://api.second.me/oauth2/token`

## 项目结构

```
TruthPress_Hackathon/
├── .secondme/
│   └── state.json          # SecondMe 配置状态
├── prisma/
│   └── schema.prisma       # 数据库模型定义
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API Routes
│   │   │   ├── auth/      # OAuth 认证端点
│   │   │   ├── chat/      # 聊天 API
│   │   │   ├── note/      # 笔记 API
│   │   │   └── profile/   # 用户资料 API
│   │   └── (dashboard)/   # 主应用页面
│   ├── components/        # React 组件
│   │   ├── auth/          # 认证组件
│   │   ├── chat/          # 聊天组件
│   │   ├── note/          # 笔记组件
│   │   └── profile/       # 资料组件
│   └── lib/               # 工具库
│       ├── secondme.ts    # SecondMe API 客户端
│       └── prisma.ts      # Prisma 客户端
├── .env.local             # 环境变量（需创建）
└── package.json
```

## 数据库模型

### User 表
```prisma
model User {
  id            String   @id @default(cuid())
  secondMeId    String   @unique
  accessToken   String
  refreshToken  String?
  tokenExpires  DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  chats         Chat[]
  notes         Note[]
}
```

### Chat 表
```prisma
model Chat {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  content   String
  createdAt DateTime @default(now())
}
```

### Note 表
```prisma
model Note {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  title     String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 环境变量

创建 `.env.local` 文件：

```env
# SecondMe OAuth
SECONDME_CLIENT_ID="01107f2e-1765-47b0-9aa3-b4d71cbd560c"
SECONDME_CLIENT_SECRET="aa6697b22dd4f3e7db5e42a3e754c7e2c1b73f42ee2b962bde3ab728ca95e15e"
SECONDME_CALLBACK_URL="http://localhost:3000/api/auth/callback"

# Database
DATABASE_URL="file:./dev.db"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 开发步骤

1. **安装依赖**
   ```bash
   npm install
   ```

2. **初始化数据库**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   ```
   http://localhost:3000
   ```

## 设计原则

- **亮色主题**：仅使用浅色主题
- **简约优雅**：极简设计，减少视觉噪音
- **中文界面**：所有用户可见文字使用中文
- **稳定优先**：避免复杂动画，仅用简单过渡效果

## 下一步

- [ ] 运行 `/secondme-prd` 定义产品需求
- [ ] 运行 `/secondme-nextjs` 生成项目代码

---

**生成时间**: 2026-03-17
**SecondMe 版本**: 1.0.0
