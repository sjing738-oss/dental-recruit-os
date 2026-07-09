# Dental Talent Acquisition OS

口腔医疗招聘全流程智能工作台 · dental_recruit_os · 基于 PRD v2.0 商用级详尽版构建

## 技术栈

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + 自研 shadcn 风格组件
- **Prisma ORM** + SQLite（本地，可平滑切 PostgreSQL）
- **JWT (jose)** + RBAC + 数据范围
- 统一 `aiService.generate`（Mock，可替换）
- Recharts / Zod

## 启动方式

```bash
# 首次：安装依赖 + 建库 + 播种
npm install
npm run setup        # = prisma generate && prisma db push && tsx prisma/seed.ts

# 开发
npm run dev          # http://localhost:3000
```

## 测试账号（密码均为 123456）

| 邮箱 | 角色 | 数据范围 |
| --- | --- | --- |
| admin@example.com | 系统管理员 | all |
| group_hr@example.com | 集团HR负责人 | all |
| region_hr@example.com | 区域HR | region |
| recruiter@example.com | 招聘HR | owned |
| medical@example.com | 医疗负责人 | assigned |
| clinic_manager@example.com | 门诊负责人 | clinic |
| interviewer@example.com | 面试官 | assigned |

> 登录页提供「演示账号」一键填充。

## 种子数据（Seed Demo Data）

- 组织：1 集团 + 1 区域 + 4 门诊（无锡/苏州/江阴/南京）
- 7 角色 + 21 权限点
- 4 演示岗位（正畸/种植医生/护士长/门诊经理）
- 9 演示候选人（分布在 lead_discovered → hired 各状态，驾驶舱漏斗可见）

## 当前进度

### P0 需求装载 ✅
理解摘要、技术栈、16 模块、27 数据表、P0-P10 计划（见 `docs/PROJECT_PLAN.md`、`docs/P0_规划看板.html`）

### P1 项目骨架 ✅
- 可运行全栈项目（Next.js + Prisma + SQLite）
- 登录页（JWT 认证 + 演示账号快捷填充）
- 主布局 + 左侧导航（按角色菜单权限渲染）+ 顶栏
- 招聘驾驶舱（**从数据库真实统计**：开放岗位/候选人/已入职/AI待复核 + 招聘漏斗 + 最近活动）
- 11 个模块占位页（菜单可达，标注后续阶段）
- 基础表：User/Role/Permission/RolePermission/OrganizationUnit/Clinic/AuditLog + 全量 27 表 schema
- RBAC：角色 → 菜单权限（不同角色登录看到不同菜单）
- 审计：登录/登出写 AuditLog

### P2 权限与组织 ✅
数据范围过滤（all/region/clinic/owned/assigned）+ 访问校验

### P3 岗位与候选人核心 ✅
状态机服务（16状态/合法迁移/医生类资质校验/淘汰原因/StatusHistory+AuditLog）、岗位CRUD、候选人CRUD、360档案

### P4 人才雷达与证据 ✅
搜索任务+Mock Provider+证据+转候选人自动带入Evidence+人才库

### P5 AI 评估与复核 ✅
统一 aiService.generate(Mock)+初筛/公开足迹报告+四类内容+复核(确认/修订/驳回)

### P6 动态测评与候选人端 ✅
PortalToken+测评作答+候选人端独立访问+字段隔离(无内部评分/薪酬底线)

### P7 面试协同 ✅
面试安排+面试官任务页+反馈版本留痕+共识分歧识别

### P8 决策/Offer/入职 ✅
AI决策报告+三档Offer+审批流+接受→自动30/60/90入职计划

### P9 看板审计设置 ✅
Analytics(DB统计)+审计日志+用户角色设置+合规复核

### P10 测试修复 ✅
端到端验收+权限验收+AI验收+字段隔离验收（见 `docs/验收报告.html`）

> **P0–P10 全部完成**，系统已达成 PRD v2.0「可商用雏形」全部交付定义，端到端招聘闭环跑通。

## 商用边界（不妥协项）

- 数据真实入库可复盘，非静态原型
- AI 输出统一 `pending_review`，未复核不进决策
- 候选人端字段隔离（不返回内部评分/薪酬底线/面试官私评）
- 状态迁移走 service + StatusHistory + AuditLog
- 医生类岗位 decision 前必有 credential_check
- 看板从 DB 统计，演示种子标记 Seed Demo Data
- 外部 Provider 用 Adapter + Mock，接口/字段/日志真实保留

## 关键约束（SQLite）

SQLite 不支持 enum，Prisma schema 中所有枚举字段已用 `String` + `@default("VALUE")` 实现；业务层在 `lib/constants.ts` 集中维护状态/角色码，保证可维护性。
