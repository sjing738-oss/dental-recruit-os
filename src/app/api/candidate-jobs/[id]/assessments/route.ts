import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

// 按岗位类别生成 Mock 测评题目（参考 PRD 19.3 动态测评题型模板）
function generateMockAssessment(category: string) {
  const bank: Record<string, { type: string; questions: { title: string; prompt: string }[]; rubric: string[] }> = {
    doctor_ortho: {
      type: "病例分析",
      questions: [{ title: "青少年错颌畸形病例分析", prompt: "给出一位 14 岁青少年错颌畸形患者的基础资料（安氏II类、深覆合、牙列拥挤），请说明你的诊断思路、方案选择、风险告知与复诊管理计划。" }],
      rubric: ["诊断思路清晰完整", "方案选择合理有依据", "风险告知充分", "复诊管理规范"],
    },
    doctor_implant: {
      type: "医疗安全",
      questions: [{ title: "伴慢性病快速种植的风险控制", prompt: "患者存在慢性基础病且强烈要求快速种植，请说明你的术前评估、医患沟通与风险控制流程。" }],
      rubric: ["全身评估规范", "沟通充分不夸大", "风险控制有预案", "遵循种植适应症"],
    },
    nurse_head: {
      type: "感控管理",
      questions: [{ title: "器械消毒流程执行不一致的整改", prompt: "门诊出现器械消毒流程执行不一致的情况，请设计排查与整改方案。" }],
      rubric: ["问题定位准确", "整改方案可落地", "感控意识强", "团队培训有方法"],
    },
    clinic_manager: {
      type: "经营诊断",
      questions: [{ title: "门诊收入增长但 OP 下降的分析", prompt: "门诊收入增长但 OP（运营利润）下降，请从人员、项目、转化、排班与成本角度分析并给出改进方案。" }],
      rubric: ["多维度分析", "数据意识强", "改进方案可行", "医运协同理解"],
    },
  };
  const tpl = bank[category] || {
    type: "综合能力",
    questions: [{ title: "岗位适配场景题", prompt: "请结合你的经验，描述一个你处理过的代表性工作场景及你的应对方式与反思。" }],
    rubric: ["场景真实", "应对合理", "反思深入", "表达清晰"],
  };
  return {
    assessmentType: tpl.type,
    dimensions: tpl.rubric.join("、"),
    questionsJson: JSON.stringify(tpl.questions),
    rubricJson: JSON.stringify(tpl.rubric),
  };
}

// POST /api/candidate-jobs/:id/assessments — 创建动态测评任务
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const cj = await prisma.candidateJob.findUnique({ where: { id: params.id }, include: { job: true } });
    if (!cj) return fail("候选人岗位关联不存在", 404);

    const body = await req.json().catch(() => ({}));
    const mock = generateMockAssessment(cj.job.category);

    const assessment = await prisma.dynamicAssessment.create({
      data: {
        candidateJobId: params.id,
        assessmentType: mock.assessmentType,
        dimensions: mock.dimensions,
        questionsJson: mock.questionsJson,
        rubricJson: mock.rubricJson,
        deadline: body.deadline ? new Date(body.deadline) : new Date(Date.now() + 3 * 24 * 3600 * 1000),
        status: "CREATED",
      },
    });

    await logAudit({ actorId: session.userId, action: "assessment.create", objectType: "dynamic_assessment", objectId: assessment.id });
    return ok({ assessment }, 201);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
