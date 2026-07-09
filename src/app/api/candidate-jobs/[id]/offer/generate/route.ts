import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

// POST /api/candidate-jobs/:id/offer/generate — 生成三档 Offer（保守/标准/争取）+ 薪酬带宽校验
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const cj = await prisma.candidateJob.findUnique({
      where: { id: params.id },
      include: { candidate: true, job: true, decision: true },
    });
    if (!cj) return fail("候选人岗位关联不存在", 404);
    // PRD：审批前不发送；生成前建议已有决策
    if (!cj.decision || !cj.decision.approvedAt) {
      return fail("请先完成雇佣决策确认后再生成 Offer", 400);
    }

    const base = cj.job.salaryMin || 20000;
    const cap = cj.job.salaryMax || 40000;
    const mid = Math.round((base + cap) / 2);
    const options = [
      { tier: "conservative", salaryFixed: base, variableDesc: "按门店绩效提成", benefits: "五险一金+餐补+带薪年假", negotiationScript: "稳妥方案，符合候选人期望下限，利于快速成交" },
      { tier: "standard", salaryFixed: mid, variableDesc: "按门店绩效提成+季度奖金", benefits: "五险一金+餐补+年假+培训预算", negotiationScript: "标准推荐方案，兼顾内部公平与候选人价值" },
      { tier: "aggressive", salaryFixed: cap, variableDesc: "按门店绩效提成+季度奖金+签约奖", benefits: "五险一金+餐补+年假+培训+住房补贴", negotiationScript: "争取方案，用于强意愿候选人，需额外审批" },
    ];

    const offer = await prisma.offerPlan.upsert({
      where: { candidateJobId: params.id },
      create: { candidateJobId: params.id, planStatus: "DRAFT", approvalStatus: "DRAFT" },
      update: { planStatus: "DRAFT", approvalStatus: "DRAFT", selectedOption: null },
    });
    await prisma.offerOption.deleteMany({ where: { offerPlanId: offer.id } });
    await prisma.offerOption.createMany({
      data: options.map((o) => ({ offerPlanId: offer.id, ...o })),
    });

    const overBand = options.filter((o) => o.salaryFixed > cap).map((o) => o.tier);

    await logAudit({ actorId: session.userId, action: "offer.generate", objectType: "offer_plan", objectId: offer.id, after: { overBand } });
    return ok({ offer, options, overBand, salaryBand: { min: base, max: cap } }, 201);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
