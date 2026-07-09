import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail } from "@/lib/api";
import { logAudit } from "@/lib/audit";
import { hasPermission, PERMISSIONS } from "@/lib/constants";

// POST /api/offers/:id/approve — Offer 审批（授权角色）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  if (!hasPermission(session.roleCode, PERMISSIONS.OFFER_APPROVE)) {
    return fail("无权审批 Offer", 403);
  }
  const body = await req.json().catch(() => ({}));
  const offer = await prisma.offerPlan.findUnique({ where: { id: params.id } });
  if (!offer) return fail("Offer 不存在", 404);

  const approval = await prisma.offerApproval.create({
    data: { offerPlanId: params.id, approverId: session.userId, status: "APPROVED", comment: body.comment || null, approvedAt: new Date() },
  });
  await prisma.offerPlan.update({ where: { id: params.id }, data: { approvalStatus: "APPROVED" } });

  await logAudit({ actorId: session.userId, action: "offer.approve", objectType: "offer_plan", objectId: params.id, after: { status: "APPROVED" } });
  return ok({ approval });
}
