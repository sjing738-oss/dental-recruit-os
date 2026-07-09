import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PERMISSIONS, ROLE_PERMISSIONS } from "../src/lib/constants";

const prisma = new PrismaClient();

// 权限码 → 中文名
const PERMISSION_NAMES: Record<string, string> = {
  "dashboard.view": "驾驶舱查看",
  "jobs.view": "岗位查看",
  "jobs.create": "岗位创建",
  "talent_radar.view": "人才雷达查看",
  "candidates.view": "候选人查看",
  "candidates.create": "候选人创建",
  "candidates.transition": "候选人状态迁移",
  "assessment.view": "评估测评查看",
  "interview.view": "面试查看",
  "interviewer_tasks.view": "面试官任务查看",
  "decision.view": "决策查看",
  "offer.view": "Offer 查看",
  "offer.approve": "Offer 审批",
  "onboarding.view": "入职查看",
  "talent_pool.view": "人才库查看",
  "analytics.view": "数据看板查看",
  "compliance.view": "合规复核查看",
  "audit.view": "审计日志查看",
  "settings.view": "系统设置查看",
  "ai.generate": "AI 生成",
  "salary.view": "薪酬查看",
};

async function main() {
  const passwordHash = await bcrypt.hash("123456", 10);
  console.log("🌱 开始播种种子数据...");

  // 1. 组织
  const group = await prisma.organizationUnit.create({
    data: { name: "瑞泰口腔医疗集团", type: "GROUP", region: "全国", city: "上海", status: "active" },
  });
  const region = await prisma.organizationUnit.create({
    data: { name: "华东大区", type: "REGION", parentId: group.id, region: "华东", city: "上海", status: "active" },
  });

  // 2. 门诊
  const clinicData = [
    { name: "瑞泰口腔·无锡梁溪门诊", region: "华东", city: "无锡", address: "无锡市梁溪区人民路 88 号" },
    { name: "瑞泰口腔·苏州工业园门诊", region: "华东", city: "苏州", address: "苏州市工业园区现代大道 66 号" },
    { name: "瑞泰口腔·江阴人民路门诊", region: "华东", city: "江阴", address: "江阴市人民路 120 号" },
    { name: "瑞泰口腔·南京建邺门诊", region: "华东", city: "南京", address: "南京市建邺区江东中路 99 号" },
  ];
  const clinics: Record<string, { id: string }> = {};
  for (const c of clinicData) {
    const clinic = await prisma.clinic.create({ data: { ...c, orgId: region.id, status: "active" } });
    clinics[c.city] = clinic;
  }

  // 3. 角色
  const roleDefs = [
    { code: "admin", name: "系统管理员", dataScope: "ALL" },
    { code: "group_hr", name: "集团HR负责人", dataScope: "ALL" },
    { code: "region_hr", name: "区域HR", dataScope: "REGION" },
    { code: "recruiter", name: "招聘HR", dataScope: "OWNED" },
    { code: "medical", name: "医疗负责人", dataScope: "ASSIGNED" },
    { code: "clinic_manager", name: "门诊负责人", dataScope: "CLINIC" },
    { code: "interviewer", name: "面试官", dataScope: "ASSIGNED" },
  ];
  const roles: Record<string, { id: string }> = {};
  for (const r of roleDefs) {
    const role = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, dataScope: r.dataScope },
      create: r,
    });
    roles[r.code] = role;
  }

  // 4. 权限点
  const permRecords: Record<string, { id: string }> = {};
  for (const code of Object.values(PERMISSIONS)) {
    const category = code.includes(".view") || code.includes(".view")
      ? (code === "ai.generate" || code === "offer.approve" || code === "candidates.transition" || code === "jobs.create" || code === "candidates.create" ? "ACTION" : "MENU")
      : "ACTION";
    const perm = await prisma.permission.upsert({
      where: { code },
      update: {},
      create: { code, name: PERMISSION_NAMES[code] || code, category: category },
    });
    permRecords[code] = perm;
  }

  // 5. 角色-权限关联
  for (const [roleCode, perms] of Object.entries(ROLE_PERMISSIONS)) {
    const role = roles[roleCode];
    for (const p of perms) {
      const perm = permRecords[p];
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }

  // 6. 用户
  const usersData = [
    { name: "系统管理员", email: "admin@example.com", roleCode: "admin", orgId: group.id, region: "全国" },
    { name: "陈思远", email: "group_hr@example.com", roleCode: "group_hr", orgId: group.id, region: "全国" },
    { name: "林婉清", email: "region_hr@example.com", roleCode: "region_hr", orgId: region.id, region: "华东" },
    { name: "赵明辉", email: "recruiter@example.com", roleCode: "recruiter", orgId: region.id, region: "华东" },
    { name: "周建华", email: "medical@example.com", roleCode: "medical", orgId: region.id, region: "华东" },
    { name: "吴海燕", email: "clinic_manager@example.com", roleCode: "clinic_manager", orgId: region.id, region: "华东", clinicId: clinics["无锡"].id },
    { name: "孙立群", email: "interviewer@example.com", roleCode: "interviewer", orgId: region.id, region: "华东" },
  ];
  const users: Record<string, { id: string }> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: {
        name: u.name,
        email: u.email,
        phone: "138" + String(Math.floor(10000000 + Math.random() * 89999999)),
        passwordHash,
        roleId: roles[u.roleCode].id,
        orgId: u.orgId,
        region: u.region,
        clinicId: u.clinicId || null,
        status: "ACTIVE",
      },
    });
    users[u.roleCode] = user;
  }

  // 7. 字典
  const dicts = [
    { type: "job_category", code: "doctor_ortho", name: "正畸医生" },
    { type: "job_category", code: "doctor_implant", name: "种植医生" },
    { type: "job_category", code: "doctor_prostho", name: "修复医生" },
    { type: "job_category", code: "doctor_perio", name: "牙周医生" },
    { type: "job_category", code: "doctor_pedo", name: "儿牙医生" },
    { type: "job_category", code: "doctor_general", name: "全科医生" },
    { type: "job_category", code: "nurse", name: "护士" },
    { type: "job_category", code: "nurse_head", name: "护士长" },
    { type: "job_category", code: "consultant", name: "咨询师" },
    { type: "job_category", code: "clinic_manager", name: "门诊经理" },
    { type: "reject_reason", code: "credential", name: "资质不符" },
    { type: "reject_reason", code: "experience", name: "经验不符" },
    { type: "reject_reason", code: "salary", name: "薪酬不匹配" },
    { type: "reject_reason", code: "risk", name: "专业风险" },
    { type: "reject_reason", code: "culture", name: "文化适配" },
    { type: "reject_reason", code: "give_up", name: "候选人主动放弃" },
    { type: "evidence_type", code: "academic", name: "学术成果" },
    { type: "evidence_type", code: "case", name: "病例展示" },
    { type: "evidence_type", code: "industry", name: "行业活动" },
    { type: "evidence_type", code: "credential", name: "执业资质" },
  ];
  for (const d of dicts) {
    await prisma.dictionary.upsert({
      where: { type_code: { type: d.type, code: d.code } },
      update: { name: d.name },
      create: d,
    });
  }

  // 8. 演示岗位（PRD 19.2）
  const jobsData = [
    { title: "正畸医生", category: "doctor_ortho", clinicId: clinics["无锡"].id, region: "无锡", headcount: 1, priority: "high", reason: "补强正畸业务，提升复杂病例承接能力", salaryMin: 25000, salaryMax: 45000, salaryDesc: "25k-45k/月 + 绩效" },
    { title: "种植医生", category: "doctor_implant", clinicId: clinics["苏州"].id, region: "苏州", headcount: 1, priority: "high", reason: "提升种植项目转化和病例质量", salaryMin: 30000, salaryMax: 55000, salaryDesc: "30k-55k/月 + 绩效" },
    { title: "护士长", category: "nurse_head", clinicId: clinics["江阴"].id, region: "江阴", headcount: 1, priority: "medium", reason: "提升护理团队规范和感控管理", salaryMin: 10000, salaryMax: 16000, salaryDesc: "10k-16k/月" },
    { title: "门诊经理", category: "clinic_manager", clinicId: clinics["南京"].id, region: "南京", headcount: 1, priority: "medium", reason: "提升门诊经营协同和目标达成", salaryMin: 18000, salaryMax: 30000, salaryDesc: "18k-30k/月 + 绩效" },
  ];
  const jobs: { id: string; title: string }[] = [];
  for (const j of jobsData) {
    const job = await prisma.job.create({
      data: {
        ...j,
        status: "OPEN",
        ownerId: users["recruiter"].id,
      },
    });
    jobs.push({ id: job.id, title: job.title });
  }

  // 9. 演示候选人 + CandidateJob（让漏斗有分布数据，标记为 Seed Demo）
  const candidatesData = [
    { name: "张明轩", specialty: "正畸医生", currentOrg: "某三甲口腔医院", city: "无锡", phone: "13912345001", email: "zhangmx@example.com", expectedSalary: 38000, sourceType: "talent_radar", jobIdx: 0, status: "SCREENING" },
    { name: "李雅婷", specialty: "种植医生", currentOrg: "某连锁口腔机构", city: "苏州", phone: "13912345002", email: "liyt@example.com", expectedSalary: 45000, sourceType: "referral", jobIdx: 1, status: "ASSESSMENT" },
    { name: "王浩然", specialty: "种植医生", currentOrg: "某口腔诊所", city: "苏州", phone: "13912345003", email: "wanghr@example.com", expectedSalary: 42000, sourceType: "talent_radar", jobIdx: 1, status: "INTERVIEW_1" },
    { name: "刘思琪", specialty: "护士长", currentOrg: "某综合医院口腔科", city: "江阴", phone: "13912345004", email: "liusq@example.com", expectedSalary: 13000, sourceType: "direct", jobIdx: 2, status: "SCREEN_PASS" },
    { name: "陈志强", specialty: "门诊经理", currentOrg: "某医疗集团", city: "南京", phone: "13912345005", email: "chenzq@example.com", expectedSalary: 26000, sourceType: "referral", jobIdx: 3, status: "DECISION" },
    { name: "赵丽华", specialty: "正畸医生", currentOrg: "某口腔连锁", city: "无锡", phone: "13912345006", email: "zhaolh@example.com", expectedSalary: 40000, sourceType: "talent_radar", jobIdx: 0, status: "OFFER" },
    { name: "孙伟杰", specialty: "种植医生", currentOrg: "某私立口腔", city: "苏州", phone: "13912345007", email: "sunwj@example.com", expectedSalary: 48000, sourceType: "direct", jobIdx: 1, status: "HIRED" },
    { name: "周婷婷", specialty: "护士", currentOrg: "某门诊", city: "江阴", phone: "13912345008", email: "zhoutt@example.com", expectedSalary: 9000, sourceType: "talent_radar", jobIdx: 2, status: "LEAD_DISCOVERED" },
    { name: "吴俊豪", specialty: "门诊经理", currentOrg: "某连锁", city: "南京", phone: "13912345009", email: "wujh@example.com", expectedSalary: 24000, sourceType: "referral", jobIdx: 3, status: "REJECTED" },
  ];

  for (const c of candidatesData) {
    const candidate = await prisma.candidate.create({
      data: {
        name: c.name,
        phone: c.phone,
        email: c.email,
        specialty: c.specialty,
        currentOrg: c.currentOrg,
        city: c.city,
        expectedSalary: c.expectedSalary,
        sourceType: c.sourceType,
        ownerId: users["recruiter"].id,
        privacyLevel: "L2",
      },
    });
    const job = jobs[c.jobIdx];
    await prisma.candidateJob.create({
      data: {
        candidateId: candidate.id,
        jobId: job.id,
        status: c.status,
        stageOwnerId: users["recruiter"].id,
        priority: "medium",
      },
    });
    // 给已入职的补 hiredAt
    if (c.status === "HIRED") {
      await prisma.candidateJob.update({
        where: { candidateId_jobId: { candidateId: candidate.id, jobId: job.id } },
        data: { hiredAt: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      });
    }
    if (c.status === "REJECTED") {
      await prisma.candidateJob.update({
        where: { candidateId_jobId: { candidateId: candidate.id, jobId: job.id } },
        data: { rejectedAt: new Date(), rejectReason: "experience" },
      });
    }
  }

  // 10. 初始审计记录
  await prisma.auditLog.create({
    data: {
      action: "system.seed",
      objectType: "system",
      objectId: "seed",
      afterJson: JSON.stringify({ message: "种子数据初始化完成（Seed Demo Data）" }),
    },
  });

  console.log("✅ 种子数据完成");
  console.log("   - 组织: 1集团 + 1区域 + 4门诊");
  console.log("   - 角色: 7 个");
  console.log("   - 权限: " + Object.keys(PERMISSIONS).length + " 个");
  console.log("   - 用户: 7 个（密码均为 123456）");
  console.log("   - 字典: " + dicts.length + " 条");
  console.log("   - 演示岗位: 4 个");
  console.log("   - 演示候选人: 9 个（含状态分布，Seed Demo Data）");
}

main()
  .catch((e) => {
    console.error("❌ 种子数据失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
