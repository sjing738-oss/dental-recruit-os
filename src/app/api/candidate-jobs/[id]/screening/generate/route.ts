import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { generate } from "@/lib/aiService";

// POST /api/candidate-jobs/:id/screening/generate — 生成初筛报告（AI，待复核）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const cj = await prisma.candidateJob.findUnique({
      where: { id: params.id },
      include: { candidate: true, job: true },
    });
    if (!cj) return fail("候选人岗位关联不存在", 404);

    const { aiOutputId, output } = await generate(
      "screening_report",
      { targetType: "candidate_job", targetId: params.id, candidate: cj.candidate, job: cj.job },
      session.userId
    );

    const report = await prisma.screeningReport.create({
      data: {
        candidateJobId: params.id,
        matchScore: output.matchScore ?? null,
        strengths: JSON.stringify(output.verified_facts),
        risks: JSON.stringify(output.risks),
        missingInfo: JSON.stringify(output.missing_info),
        recommendation: output.recommended_next_actions[0] || null,
        aiOutputId,
        reviewStatus: "PENDING_REVIEW",
      },
    });

    return ok({ report, aiOutputId }, 201);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
