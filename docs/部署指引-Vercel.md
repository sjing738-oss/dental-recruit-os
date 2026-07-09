# Dental Talent Acquisition OS · Vercel 部署指引

> 把全栈招聘系统部署到 Vercel + Neon Postgres，获得一个永久在线访问网址。
> 全程约 15 分钟，需注册 Neon 和 Vercel 两个免费账号。本地 SQLite 开发环境不受影响。

## 前置准备

项目已为你准备好部署所需配置：
- `prisma/schema.postgres.prisma` — PostgreSQL 版数据模型
- `vercel.json` — Vercel 构建命令（自动建表 + 构建）
- `.env.example` — 环境变量模板
- `package.json` 新增 `deploy:db` / `deploy:seed` 脚本

---

## 第一步：创建 Neon Postgres 数据库（免费）

1. 打开 https://neon.tech ，点击 **Sign up**，用 GitHub 或邮箱注册（免费 tier 足够）。
2. 登录后点 **New Project**，名称填 `dental-recruit`，Region 选离你近的（如 `AWS Asia Pacific (Singapore)`），点 Create。
3. 项目创建后，在 Dashboard 找到 **Connection string**，复制形如：
   ```
   postgresql://dental_user:xxxxxxxx@ep-xxx-pooler.region.aws.neon.tech/dental?sslmode=require
   ```
   👉 这就是你的 `DATABASE_URL`，先存好，下一步和 Vercel 都要用。

## 第二步：本地连 Neon 初始化数据库（建表 + 播种）

在项目目录执行（把 `<你的NEON_URL>` 替换为上一步复制的连接串）：

```bash
cd C:/Users/71729/WorkBuddy/2026-07-09-10-37-27/dental-recruit-os

# 1. 用 Postgres schema 生成 client + 建表
DATABASE_URL="<你的NEON_URL>" npm run deploy:db

# 2. 播种初始数据（7角色/4岗位/9候选人/字典等）
DATABASE_URL="<你的NEON_URL>" npm run deploy:seed
```

看到 `✅ 种子数据完成` 即成功。此时 Neon 数据库已建好 27 张表并填入演示数据。

## 第三步：把代码推到 GitHub

1. 打开 https://github.com/new ，新建仓库（如 `dental-recruit-os`），**不要**勾选 README/gitignore。
2. 在项目目录执行（替换 `你的用户名`）：
   ```bash
   cd C:/Users/71729/WorkBuddy/2026-07-09-10-37-27/dental-recruit-os
   git init
   git add .
   git commit -m "Dental Talent Acquisition OS - 全栈招聘系统"
   git branch -M main
   git remote add origin https://github.com/你的用户名/dental-recruit-os.git
   git push -u origin main
   ```
   > 注意：`.gitignore` 已排除 `.env` 和 `dev.db`，密钥不会上传。

## 第四步：Vercel 导入项目

1. 打开 https://vercel.com ，点 **Sign Up** → 用 **GitHub 账号**注册（这样能直接导入 GitHub 仓库）。
2. 登录后点 **Add New...** → **Project** → 找到 `dental-recruit-os` 仓库 → **Import**。
3. 在配置页 **Environment Variables** 处添加两项：
   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | 第一步复制的 Neon 连接串 |
   | `JWT_SECRET` | 一段强随机串（可用 `openssl rand -base64 32` 生成，或随便填一长串） |
4. **Build & Output Settings** 不用改（`vercel.json` 已配置好构建命令：自动 `prisma generate` + `db push` + `next build`）。
5. 点 **Deploy**，等待 2-3 分钟构建完成。

## 第五步：访问线上系统

部署成功后，Vercel 会给你一个网址，形如：
```
https://dental-recruit-os-xxxxx.vercel.app
```

打开它，用演示账号登录（密码均为 `123456`）：
- `admin@example.com`（全权限）
- `group_hr@example.com`（审批决策/Offer）
- `recruiter@example.com`（招聘执行）

🎉 系统已上线！任何时候都能访问，不依赖本地电脑开机。

---

## 可选：绑定自定义域名

Vercel 项目 → Settings → Domains → 添加你的域名（如 `recruit.yourcompany.com`），按提示配 DNS 即可。

## 常见问题

**Q: 部署后登录提示"会话已过期"或 500？**
A: 检查 Vercel 环境变量是否正确设置了 `DATABASE_URL` 和 `JWT_SECRET`，并在 Vercel 重新部署（Deployments → Redeploy）。

**Q: 构建报错 `Prisma can't reach database`？**
A: Neon 连接串需含 `?sslmode=require`；确认 Neon 项目处于 Active 状态（免费 tier 空闲会自动暂停，首次连接会唤醒）。

**Q: 想重新初始化数据库数据？**
A: 本地执行 `DATABASE_URL="<NEON_URL>" npm run deploy:db` 会重建表，再 `npm run deploy:seed` 播种。

**Q: 代码更新后如何同步到线上？**
A: `git push origin main` 后，Vercel 会自动检测并重新部署。

**Q: 本地开发还能用 SQLite 吗？**
A: 能。本地 `.env` 仍是 `file:./dev.db`，`npm run dev` 用 SQLite schema，与线上 Postgres 互不影响。
