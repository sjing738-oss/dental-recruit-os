# Dental Talent Acquisition OS — 项目规划与实施计划（P0 输出）

> 基于《口腔医疗招聘全流程智能工作台｜商用级详尽 PRD v2.0》与 dental-recruit-os 技能生成。
> 本文档对应 PRD 第 15.2 章 P0 阶段：让 Workbuddy 理解 PRD，输出理解摘要、模块清单、数据模型草案和实施计划。

---

## A. 对 PRD 的理解摘要

Dental Talent Acquisition OS（dental_recruit_os）是面向**大型口腔连锁医疗机构**的 AI 招聘全流程智能工作台。它把原本停留在 Skill/Prompt 层面的 6 个招聘智能体（人才雷达、公开足迹、候选人互动、动态评估、面试决策、Offer 优化）**工程化为一个可运行、可持久化、可审计、可复盘的业务系统**。

核心设计哲学（必须贯穿始终）：

1. **先岗位后找人**：招聘从定义岗位目标和薪酬带宽开始，而非从找简历开始。所有候选人必须关联岗位或人才库。
2. **证据链优先**：公开资料只是线索，所有 Evidence 必须标记来源、可信度、核验状态、过期时间，不得直接等同事实。
3. **AI 辅助、人做决定**：所有 AIOutput 默认 `pending_review`，未确认不得进入最终决策；AI 不能输出"录用/不录用"命令。
4. **流程闭环**：Offer 接受 → 自动生成入职承接 + 30/60/90 天计划；未录用但有价值的人进入人才库二次激活。
5. **权限最小化 + 可审计**：候选人端与内部端严格隔离，高敏薪酬字段仅授权角色可见，所有关键动作写 AuditLog（不可删除）。

端到端闭环（PRD 4.1 主流程）：
岗位需求 → 人才发现 → 候选人入池 → 初筛评估 → 公开足迹 → 动态测评 → 多轮面试 → 雇佣决策 → Offer → 入职承接 → 人才库复盘。

16 个候选人状态构成完整状态机（lead_discovered → … → hired / talent_pool / rejected），每次迁移走 CandidateWorkflowService 并写 StatusHistory + AuditLog。医生类岗位进入 decision 前必须存在 credential_check，进入 offer 前 credential_check.status 不得为 unknown。

商用边界（PRD 2.2）：必做闭环首版即完整实现；外部搜索/AI Provider/消息通知/HR 系统用 Adapter + Mock，但页面、字段、接口、日志必须保留；官方执业资质实时查询、电子签、薪酬发放、复杂背调不做自动化，只记录手工核验结果。

---

## B. 建议技术栈

| 层级 | 选型 | 理由 |
| --- | --- | --- |
| 框架 | **Next.js 14（App Router）+ TypeScript** | 前后端一体，API Routes 即后端，单体易启动、易部署，符合 PRD"Next.js API Routes 或独立服务"推荐 |
| UI | **Tailwind CSS + shadcn/ui** | PRD 明确推荐"shadcn 风格组件"，专业医疗 HR SaaS 风格，组件可定制 |
| 数据库 | **Prisma ORM + SQLite（本地）/ 可切 PostgreSQL（生产）** | PRD 推荐"PostgreSQL 优先；本地可用 SQLite + Prisma"。先用 SQLite 零配置启动，schema 平滑迁移 |
| 认证 | **JWT（jose）+ RBAC 中间件 + 数据范围** | 内部端用 JWT Session，候选人端用独立 PortalToken，不共用登录 |
| AI | **统一 aiService.generate(scene, payload, options)** | 所有 AI 走注册表 + Mock Provider，先存 AIOutput 再返回，可替换真实 Provider |
| 搜索 | **talentSearchProvider.run(task)** Mock | 接口和数据结构真实，首版 Mock 返回线索 |
| 文件 | **本地 FileStorage 抽象** | 只存路径与元数据，后续接 OSS/S3 |
| 审计 | **auditService.log() 中间件** | 关键动作统一写 AuditLog |
| 图表 | **Recharts** | 看板漏斗/转化/趋势，从 DB 统计非假数据 |
| 校验 | **zod** | schema 校验，请求/响应类型安全 |

目录结构（P1 起）：
```
dental-recruit-os/
├─ prisma/schema.prisma        # 数据模型
├─ prisma/seed.ts              # 种子数据
├─ src/
│  ├─ app/                     # App Router 页面
│  │  ├─ (auth)/login
│  │  ├─ (internal)/dashboard, jobs, candidates, ...
│  │  └─ candidate-portal/[token]
│  ├─ api/                     # API Routes
│  ├─ lib/                     # prisma, auth, rbac, audit, aiService, workflow
│  ├─ components/              # UI 组件 (shadcn + 业务)
│  └─ types/                   # 类型与枚举
└─ docs/                       # 本规划与验收文档
```

---

## C. 系统模块清单（16 模块，对应 PRD 第 7 章）

| # | 模块 | 核心职责 | 阶段 |
| --- | --- | --- | --- |
| 1 | 招聘驾驶舱 | 漏斗/待办/风险/AI复盘，全局掌握 | P1占位/P9完善 |
| 2 | 招聘需求与岗位画像中心 | 岗位CRUD、AI生成画像/JD/胜任力/筛选标准、薪酬带宽 | P3 |
| 3 | 自动人才雷达与外部搜索中心 | 搜索任务、Mock结果、证据、转候选人/入人才库 | P4 |
| 4 | 候选人 360 档案 | 生命周期聚合，资料/证据/评估/面试/沟通/Offer/入职/审计 Tab | P3 |
| 5 | AI 初筛与公开足迹评估中心 | ScreeningReport、PublicFootprintReport、四类内容区分、复核 | P5 |
| 6 | 候选人互动中心 | 触达/维护/Offer前顾虑/挽回，AI话术四版本 | P5/P8 |
| 7 | 候选人互动端 | Token登录、资料提交、测评作答、面试安排、入职准备，字段隔离 | P6 |
| 8 | 动态能力评估中心 | 按岗位生成测评、评分量表、候选人作答、AI初评+人工复核 | P6 |
| 9 | 面试流程中心与面试官端 | 轮次配置、面试指南、反馈提交版本留痕、共识分歧汇总 | P7 |
| 10 | 雇佣决策中心 | 汇总资料、AI决策报告(待复核)、人工确认、试用期观察点 | P8 |
| 11 | Offer 薪酬福利方案中心 | 三档方案、带宽校验、审批流、谈判记录、接受/拒绝 | P8 |
| 12 | 入职前承接与 90 天融入中心 | 资料清单、首日安排、30/60/90计划、试用期观察 | P8 |
| 13 | 人才库中心 | 标签分层(A/B/C/D)、维护策略、二次激活、岗位推荐 | P4/P9 |
| 14 | 数据看板与招聘复盘中心 | 漏斗/周期/转化/质量/AI指标，DB统计下钻，AI复盘 | P9 |
| 15 | 合规与审计中心 | 资质核验、证据核验、AI审计、审批审计、访问审计 | P2/P9 |
| 16 | 管理后台与模板配置中心 | 用户/角色/权限/组织/模板/字典/AI场景 | P2/P9 |

---

## D. 数据模型草案（对应 PRD 第 9 章，共 27 张核心表）

### 基础与权限（P1-P2）
| 表 | 关键字段 | 说明 |
| --- | --- | --- |
| OrganizationUnit | id,name,type(parent),region,city,address,status | 组织/区域/门诊树 |
| Clinic | id,org_id,name,region,city,address,status | 门诊 |
| User | id,name,email,phone,password_hash,role_id,org_scope,status,last_login_at | 内部用户 |
| Role | id,code,name,data_scope,enabled | 角色 |
| Permission | id,code,name,category(menu/action/field/portal) | 权限点 |
| RolePermission | role_id,permission_id | 角色权限关联 |
| AuditLog | id,actor_id,action,object_type,object_id,before_json,after_json,ip,user_agent,created_at | 不可删除留痕 |

### 岗位与候选人核心（P3）
| 表 | 关键字段 |
| --- | --- |
| Job | id,title,category,clinic_id,region,headcount,priority,reason,status,owner_id,salary_min,salary_max,created_at |
| JobProfile | job_id,business_goal,responsibilities,competencies,must_have,nice_to_have,red_flags,interview_plan,confirmed_at |
| SalaryBand | id,job_category,level,region,fixed_min,fixed_max,variable_desc,approval_rule |
| Candidate | id,name,phone,email,specialty,current_org,city,expected_salary,source_type,owner_id,privacy_level |
| CandidateJob | id,candidate_id,job_id,status,stage_owner_id,priority,entered_at,hired_at,rejected_at |
| StatusHistory | id,candidate_job_id,from_status,to_status,action,reason,operator_id,created_at |
| FileAttachment | id,owner_type,owner_id,file_name,file_path,mime_type,size,uploaded_by,visibility |

### 人才雷达与证据（P4）
| 表 | 关键字段 |
| --- | --- |
| TalentSearchTask | id,job_id,city,specialty,level,org_types,keywords,target_count,status,owner_id,strategy_json |
| TalentSearchResult | id,task_id,name,current_org,specialty,source_url,reason,credibility,contact_priority,converted_candidate_id |
| Evidence | id,candidate_id,candidate_job_id,type,source_url,title,summary,credibility,verify_status,expires_at,created_by |
| CredentialCheck | id,candidate_id,credential_type,credential_no_masked,registered_scope,verify_status,verified_by,verified_at,notes |
| TalentPool | id,candidate_id,tier,tags,maintain_owner_id,next_contact_at,active_status |

### AI 评估与复核（P5）
| 表 | 关键字段 |
| --- | --- |
| AIOutput | id,scene,target_type,target_id,input_summary,output_json,output_text,provider,model,status,created_by,created_at |
| AIReview | id,ai_output_id,review_status(reviewer),reviewer_id,reviewed_at,revised_text,comment |
| ScreeningReport | id,candidate_job_id,match_score,strengths,risks,missing_info,recommendation,ai_output_id,review_status |
| PublicFootprintReport | id,candidate_job_id,verified_facts,public_clues,inferences,questions,risk_level,ai_output_id,review_status |

### 动态测评与候选人端（P6）
| 表 | 关键字段 |
| --- | --- |
| PortalToken | id,candidate_id,token,expires_at,revoked_at,max_access_count,access_count |
| DynamicAssessment | id,candidate_job_id,assessment_type,dimensions,questions_json,rubric_json,deadline,status |
| AssessmentSubmission | id,assessment_id,candidate_id,answers_json,submitted_at,ai_score,manual_score,reviewer_id |

### 面试协同（P7）
| 表 | 关键字段 |
| --- | --- |
| Interview | id,candidate_job_id,round,scheduled_at,location,guide_ai_output_id,status |
| InterviewAssignment | id,interview_id,interviewer_id,status |
| InterviewFeedback | id,interview_id,interviewer_id,scores_json,conclusion,strengths,risks,questions,submitted_at,version |
| CommunicationRecord | id,candidate_id,candidate_job_id,channel,direction,summary,content,next_follow_at,created_by |

### 决策/Offer/入职（P8）
| 表 | 关键字段 |
| --- | --- |
| HiringDecision | id,candidate_job_id,decision,summary,risk_control,probation_focus,approved_by,approved_at,ai_output_id |
| OfferPlan | id,candidate_job_id,plan_status,selected_option,salary_fixed,variable_desc,benefits,approval_status,sent_at,accepted_at |
| OfferOption | id,offer_plan_id,tier(conservative/standard/aggressive),salary_fixed,variable_desc,benefits,negotiation_script |
| OfferApproval | id,offer_plan_id,approver_id,status,comment,approved_at |
| OfferNegotiation | id,offer_plan_id,round,summary,candidate_feedback,action |
| OnboardingPlan | id,candidate_job_id,start_date,owner_id,plan_status,day30_goal,day60_goal,day90_goal,risk_watch |
| OnboardingTask | id,onboarding_plan_id,title,owner_id,due_date,status,candidate_visible |
| ComplianceCheck | id,candidate_job_id,check_type,status,result_summary,checked_by,checked_at,evidence_id |

### 配置（P9）
| 表 | 关键字段 |
| --- | --- |
| Template | id,template_type,name,version,content_json,status,created_by,updated_at |
| Dictionary | id,type,code,name,sort,enabled | 状态/淘汰原因/证据类型/风险等级字典 |

关键枚举：job_status, candidate_status(16值), ai_review_status, evidence_credibility, verify_status, risk_level(green/yellow/red), decision(recommend/cautious/hold/reject/transfer), offer_approval_status, talent_tier(A/B/C/D)。

---

## E. 路由与页面清单（PRD 6.2）

内部端：/login, /dashboard, /jobs, /jobs/new, /jobs/:id, /talent-radar, /talent-radar/tasks/:id, /candidates, /candidates/:id(+screening/footprint/assessment/interviews/decision/offer), /interviewer/tasks, /onboarding, /talent-pool, /analytics, /compliance, /audit, /settings。
候选人端：/candidate-portal/:token。
API：/api/auth/*, /api/dashboard, /api/jobs/*, /api/talent-search/*, /api/candidates/*, /api/candidate-jobs/*(transition/screening/footprint/assessments/interviews/decision/offer), /api/interviews/*, /api/offers/*, /api/onboarding/*, /api/portal/:token/*, /api/audit, /api/settings/*。

---

## F. API 清单（核心，PRD 10.2）

鉴权登录、驾驶舱、岗位CRUD+生成画像、人才搜索任务CRUD+run+convert、候选人列表/详情/360聚合、状态迁移、初筛/足迹生成、测评创建+候选人端提交、面试安排+指南+反馈、决策生成+确认、Offer生成+审批+接受、入职计划生成、审计列表、候选人端首页。全部走 service 层 + AuditLog；候选人端 /api/portal 独立；AI 接口先存 AIOutput 再返回 ai_output_id。

---

## G. P0–P10 实施计划（PRD 15.2）

| 阶段 | 目标 | 关键交付 | 验收 |
| --- | --- | --- | --- |
| **P0** | 需求装载 | 本文档 + 可视化看板 | 闭环无遗漏 |
| **P1** | 项目骨架 | Next.js+Prisma+SQLite+布局+登录+种子+基础RBAC菜单 | 本地启动可访问 |
| **P2** | 权限与组织 | RBAC+数据范围+组织门诊+登录态 | 角色看不同菜单/数据 |
| **P3** | 岗位与候选人核心 | Job/Candidate/360/状态机/StatusHistory/AuditLog | 岗位→候选人推进跑通 |
| **P4** | 人才雷达与证据 | 搜索任务+Mock+Evidence+转候选人+人才库 | 结果可转候选人带证据 |
| **P5** | AI评估与复核 | AIOutput/AIReview/初筛/足迹+统一aiService+复核 | AI输出保存可复核 |
| **P6** | 动态测评与候选人端 | PortalToken/Assessment/Submission+独立端 | 候选人端不泄露内部字段 |
| **P7** | 面试协同 | 面试安排/指南/反馈/面试官端/共识分歧 | 面试官只看被分配任务 |
| **P8** | 决策Offer入职 | 决策/Offer三档/审批/谈判/入职90天 | 录用到入职承接闭环 |
| **P9** | 看板审计设置 | Analytics(DB统计)/Audit/Templates/Settings | 数据变化看板同步 |
| **P10** | 测试修复 | E2E/权限/AI/审计验收+异常样式修复 | 验收清单全通过 |

实施纪律（PRD 15.3）：每阶段只处理一个阶段；列出新增文件/表/接口/页面/测试点；完成先运行检查再继续；报错先修复再进；外部依赖 Adapter+Mock；业务规则落在 schema/service/validation/tests。

---

## H. P1 项目骨架具体实施步骤

1. 初始化 Next.js 14 + TS + Tailwind + App Router 项目于 `dental-recruit-os/`。
2. 安装依赖：prisma/@prisma/client、zod、jose(JWT)、bcryptjs、recharts、lucide-react、shadcn 基础组件。
3. 配置 Prisma + SQLite，编写 `schema.prisma`（User/Role/Permission/RolePermission/OrganizationUnit/Clinic/AuditLog + 枚举）。
4. 编写 `lib/prisma.ts`（单例）、`lib/auth.ts`（JWT签发/校验）、`lib/rbac.ts`（权限+数据范围中间件）、`lib/audit.ts`（auditService.log）。
5. 生成主布局 + 左侧导航（按角色菜单权限渲染）+ 顶栏（用户/角色/退出）。
6. 登录页 `/login`：邮箱密码登录，签 JWT，写 AuditLog，跳驾驶舱。
7. 占位页面：/dashboard、/jobs、/candidates、/settings（带标题与"建设中"引导）。
8. 种子数据 `prisma/seed.ts`：7 类角色账号（admin/group_hr/region_hr/recruiter/medical/clinic_manager/interviewer）、组织/门诊、权限点、演示说明。
9. shadcn 风格主题：专业医疗 HR SaaS 配色（深色为主可选），简洁高级。
10. 验证：`npm run dev` 启动；不同账号登录看到不同菜单；数据库已建表且有种子数据。

---

## 商用边界与不妥协项（贯穿全阶段）

- 数据必须真实入库可复盘，不做纯静态原型。
- AI 输出统一 pending_review，未复核不进决策。
- 候选人端严格字段隔离（不返回内部评分/薪酬底线/面试官私评/AI风险）。
- 状态迁移必走 service + StatusHistory + AuditLog。
- 医生类岗位 decision 前必有 credential_check。
- 看板数据从 DB 统计，演示种子标记 Seed Demo Data。
- 外部 Provider 用 Adapter+Mock，但接口/字段/日志真实保留。
