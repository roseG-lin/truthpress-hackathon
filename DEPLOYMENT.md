# TruthPress Hackathon 部署指南

本文档指导如何将 TruthPress 项目部署到公网，让任何人都可以访问使用。

---

## 🎯 推荐方案：Railway 部署

Railway 是最简单的部署方案，支持：
- ✅ Node.js 运行环境
- ✅ 持久化存储（PostgreSQL 数据库）
- ✅ 自动 HTTPS
- ✅ 免费额度（$5/月）

---

## 📝 部署步骤

### 第一步：准备 GitHub 仓库

1. 在 GitHub 创建新仓库（命名为 `truthpress-hackathon`）

2. 在项目目录执行以下命令：

```bash
cd "E:/Claude code/TruthPress_Hackathon"

# 初始化 git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: TruthPress Hackathon Project"

# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/truthpress-hackathon.git

# 推送到 GitHub
git push -u origin main
```

---

### 第二步：在 Railway 部署

1. **注册 Railway**
   - 访问：https://railway.app/
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project" → "Deploy from GitHub repo"
   - 选择你的 `truthpress-hackathon` 仓库

3. **配置环境变量**

   在 Railway 项目设置中，添加以下环境变量：

   ```
   # LLM API（使用你的 DeepSeek API Key）
   LLM_API_KEY=sk-your-actual-api-key
   LLM_BASE_URL=https://api.deepseek.com
   LLM_MODEL_NAME=deepseek-chat

   # SecondMe OAuth（使用现有的）
   SECONDME_CLIENT_ID=01107f2e-1765-47b0-9aa3-b4d71cbd560c
   SECONDME_CLIENT_SECRET=aa6697b22dd4f3e7db5e42a3e754c7e2c1b73f42ee2b962bde3ab728ca95e15e
   SECONDME_CALLBACK_URL=https://your-app.railway.app/api/auth/callback
   NEXT_PUBLIC_APP_URL=https://your-app.railway.app
   NEXT_PUBLIC_SECONDME_OAUTH_URL=https://second.me/oauth2/authorize
   NEXT_PUBLIC_SECONDME_API_URL=https://api.second.me

   # 运行环境
   NODE_ENV=production
   PORT=3000
   ```

4. **添加 PostgreSQL 数据库**

   - 在 Railway 项目中点击 "New Service"
   - 选择 "Database" → "Add PostgreSQL"
   - Railway 会自动提供 `DATABASE_URL` 环境变量

5. **设置根目录**

   在 Railway 项目设置中，确保：
   - Root Directory: 留空（项目根目录）
   - Build Command: `npm run build`
   - Start Command: `npm start`

6. **部署！**

   - 点击 "Deploy" 按钮
   - 等待几分钟后，Railway 会提供一个 HTTPS URL

---

### 第三步：配置域名（可选）

如果你有自己的域名：

1. 在 Railway 项目设置中选择 "Domains"
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录

---

## 🔧 其他部署方案

### 方案 A：Vercel（不推荐）

⚠️ **问题**：Vercel 是 serverless 平台，不支持 SQLite 持久化存储。

如果要用 Vercel，需要：
1. 将数据库改为 PostgreSQL（如 Vercel Postgres 或 Supabase）
2. 修改 `DATABASE_URL` 配置
3. 可能需要修改 Prisma 配置

### 方案 B：自己的 VPS

如果你有自己的服务器：

```bash
# 1. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装 PM2（进程管理器）
npm install -g pm2

# 3. 克隆代码
git clone https://github.com/YOUR_USERNAME/truthpress-hackathon.git
cd truthpress-hackathon

# 4. 安装依赖
npm install

# 5. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入真实的配置

# 6. 构建项目
npm run build

# 7. 使用 PM2 启动
pm2 start npm --name "truthpress" -- start

# 8. 配置 Nginx 反向代理（可选）
# 9. 配置 SSL 证书（使用 Let's Encrypt）
```

### 方案 C：Render.com

类似 Railway，步骤：
1. 访问 https://render.com/
2. 连接 GitHub 仓库
3. 创建 "Web Service"
4. 选择 "Free" 实例类型
5. 配置环境变量
6. 添加 PostgreSQL 数据库
7. 部署

---

## 🔑 需要准备的配置信息

| 配置项 | 获取方式 |
|--------|----------|
| `LLM_API_KEY` | DeepSeek API Key |
| `SECONDME_CLIENT_ID` | SecondMe 开发者平台 |
| `SECONDME_CLIENT_SECRET` | SecondMe 开发者平台 |
| `DATABASE_URL` | Railway/Render 自动提供 |

---

## ⚠️ 重要提醒

1. **不要提交敏感信息**
   - `.env` 文件已在 `.gitignore` 中
   - 确保不要把 API Key 提交到 GitHub

2. **修改 OAuth 回调地址**
   - 部署后需要在 SecondMe 平台修改回调 URL
   - 从 `http://localhost:3000/api/auth/callback` 改为 `https://your-domain.railway.app/api/auth/callback`

3. **数据库迁移**
   - Railway PostgreSQL 会自动创建表
   - 确保环境变量 `DATABASE_URL` 正确配置

---

## 📞 需要帮助？

如果遇到问题，检查：
1. Railway 日志中的错误信息
2. 环境变量是否正确配置
3. 数据库连接是否正常
4. OAuth 回调 URL 是否正确

---

## 🎉 部署成功后

你的网站将通过以下地址访问：
- Railway: `https://your-app.railway.app`
- 自定义域名: `https://your-domain.com`

用户可以：
- 访问真理之梯页面
- 使用 SecondMe 账号登录
- 体验完整的 A/B/C/D Agent 流程
