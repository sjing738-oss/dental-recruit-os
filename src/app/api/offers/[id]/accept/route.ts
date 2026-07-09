import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail } from "@/lib/api";
import { logAudit } from "@/lib/audit";

// POST /api/offers/:id/accept — 标记 Offer 接受 → 自动生成入职承接与 30/60/90 天计划
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  const offer = await prisma.offerPlan.findUnique({ where: { id: params.id }, include: { candidateJob: true } });
  if (!offer) return fail("Offer 不存在", 404);
  // PRD：审批前不得发送/接受
  if (offer.approvalStatus !== "APPROVED") return fail("Offer 未审批通过，不可接受", 400);

  await prisma.offerPlan.update({ where: { id: params.id }, data: { planStatus: "ACCEPTED", acceptedAt: new Date() } });

  // 自动生成入职承接计划（PRD 7.12：Offer 接受后自动生成）
  const startDate = new Date(Date.now() + 14 * 24 * 3600 * 1000);
  const onboarding = await prisma.onboardingPlan.upsert({
    where: { candidateJobId: offer.candidateJobId },
    create: {
      candidateJobId: offer.candidateJobId,
      startDate,
      ownerId: session.userId,
      planStatus: "PENDING",
      day30Goal: "熟悉门诊流程与团队，完成带教与系统培训",
      day60Goal: "独立承接常规病例，达到基本产能标准",
      day90Goal: "转正考核：病例质量、医患沟通、团队协作与流程遵从",
      riskWatch: "试用期专业能力与医疗安全观察（来自决策风险点）",
    },
    update: { planStatus: "PENDING" },
  });

  // 资料清单任务
  await prisma.onboardingTask.createMany({
    data: [
      { onboardingPlanId: onboarding.id, title: "身份证复印件", candidateVisible: true },
      { onboardingPlanId: onboarding.id, title: "学历/学位证书", candidateVisible: true },
      { onboardingPlanId: onboarding.id, title: "执业资格证书（医生岗位必填）", candidateVisible: true },
      { onboardingPlanId: onboarding.id, title: "银行卡信息", candidateVisible: true },
      { onboardingPlanId: onboarding.id, title: "入职体检报告", candidateVisible: true },
    ],
  });

  await logAudit({ actorId: session.userId, action: "offer.accept", objectType: "offer_plan", objectId: params.id, after: { onboardingPlanId: onboarding.id } });
  return ok({ offer, onboarding });
}
