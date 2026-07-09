import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

// POST /api/ai-outputs/:id/review — 人工复核（确认/编辑确认/驳回）
// action: confirm | revise | reject
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { action, revisedText, comment } = body;
    if (!["confirm", "revise", "reject"].includes(action)) return fail("action 必须为 confirm/revise/reject");

    const aiOutput = await prisma.aIOutput.findUnique({ where: { id: params.id } });
    if (!aiOutput) return fail("AI 输出不存在", 404);

    const reviewStatus = action === "confirm" ? "CONFIRMED" : action === "revise" ? "REVISED" : "REJECTED";
    const outputStatus = action === "confirm" ? "CONFIRMED" : action === "revise" ? "REVISED" : "REJECTED";

    // upsert AIReview
    const review = await prisma.aIReview.upsert({
      where: { aiOutputId: params.id },
      update: { reviewStatus: reviewStatus as any, reviewerId: session.userId, reviewedAt: new Date(), revisedText: revisedText || null, comment: comment || null },
      create: { aiOutputId: params.id, reviewStatus: reviewStatus as any, reviewerId: session.userId, reviewedAt: new Date(), revisedText: revisedText || null, comment: comment || null },
    });

    await prisma.aIOutput.update({ where: { id: params.id }, data: { status: outputStatus as any } });

    // 同步报告复核状态
    if (aiOutput.targetType === "candidate_job") {
      if (aiOutput.scene === "screening_report") {
        await prisma.screeningReport.updateMany({ where: { aiOutputId: params.id }, data: { reviewStatus: reviewStatus as any } });
      } else if (aiOutput.scene === "public_footprint_report") {
        await prisma.publicFootprintReport.updateMany({ where: { aiOutputId: params.id }, data: { reviewStatus: reviewStatus as any } });
      }
    }

    await logAudit({ actorId: session.userId, action: "ai.review", objectType: "ai_output", objectId: params.id, after: { action, reviewStatus } });

    return ok({ review });
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
