import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { hasPermission } from "@/lib/constants";
import { PERMISSIONS } from "@/lib/constants";

// POST /api/candidate-jobs/:id/decision/confirm — 人工确认雇佣决策（授权角色）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  // 仅集团HR/区域HR/CHRO 可确认最终决策
  if (!hasPermission(session.roleCode, PERMISSIONS.DECISION_VIEW)) {
    return fail("无权确认雇佣决策", 403);
  }
  const body = await req.json();
  const { decision } = body;
  if (!["recommend", "cautious", "hold", "reject", "transfer"].includes(decision)) {
    return fail("决策结论非法");
  }

  const existing = await prisma.hiringDecision.findUnique({ where: { candidateJobId: params.id } });
  if (!existing) return fail("请先生成决策报告", 400);

  const updated = await prisma.hiringDecision.update({
    where: { candidateJobId: params.id },
    data: { decision, approvedById: session.userId, approvedAt: new Date() },
  });

  await logAudit({ actorId: session.userId, action: "decision.confirm", objectType: "hiring_decision", objectId: updated.id, after: { decision } });
  return ok({ decision: updated });
}
