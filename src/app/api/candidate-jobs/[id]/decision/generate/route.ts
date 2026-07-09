import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

// POST /api/candidate-jobs/:id/decision/generate — AI 生成雇佣决策报告（待复核）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const cj = await prisma.candidateJob.findUnique({
      where: { id: params.id },
      include: { candidate: true, job: true, screeningReports: true, interviews: { include: { feedbacks: true } } },
    });
    if (!cj) return fail("候选人岗位关联不存在", 404);

    // PRD：医生类岗位缺少资质核验时只能生成"资料不足/暂缓"
    const isDoctor = cj.job.category?.startsWith("doctor_");
    if (isDoctor) {
      const cred = await prisma.credentialCheck.findFirst({ where: { candidateId: cj.candidateId } });
      if (!cred) return fail("医生类岗位缺少执业资质核验，无法生成正式决策报告（资料不足）", 400);
    }

    const name = cj.candidate.name;
    const output = {
      summary: `${name} 综合评估：专业方向与岗位匹配，初筛与面试反馈整体正面，建议谨慎录用并关注试用期专业能力与团队适配。`,
      recommendation: "cautious",
      riskControl: ["试用期重点观察病例质量与医疗安全", "前30天安排带教与质量复核", "明确转正标准与考核节点"],
      probationFocus: ["复杂病例独立承接能力", "医患沟通与转化", "团队协作与流程遵从"],
      risks: ["薪酬期望接近带宽上限", "试用期专业能力待验证"],
      confidence: "medium",
      human_review_required: true,
    };

    const aiOutput = await prisma.aIOutput.create({
      data: {
        scene: "hiring_decision", targetType: "candidate_job", targetId: params.id,
        inputSummary: `候选人 ${name} · 岗位 ${cj.job.title}`,
        outputJson: JSON.stringify(output), outputText: output.summary,
        provider: "mock", model: "mock-v1", status: "PENDING_REVIEW", createdById: session.userId,
      },
    });

    const decision = await prisma.hiringDecision.upsert({
      where: { candidateJobId: params.id },
      create: { candidateJobId: params.id, decision: "HOLD", summary: output.summary, riskControl: output.riskControl.join("；"), probationFocus: output.probationFocus.join("；"), aiOutputId: aiOutput.id },
      update: { summary: output.summary, riskControl: output.riskControl.join("；"), probationFocus: output.probationFocus.join("；"), aiOutputId: aiOutput.id, approvedAt: null, approvedById: null },
    });

    await logAudit({ actorId: session.userId, action: "decision.generate", objectType: "hiring_decision", objectId: decision.id });
    return ok({ decision, aiOutputId: aiOutput.id }, 201);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
