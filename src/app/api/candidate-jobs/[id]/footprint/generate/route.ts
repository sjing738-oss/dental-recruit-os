import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { generate } from "@/lib/aiService";

// POST /api/candidate-jobs/:id/footprint/generate — 生成公开足迹报告（AI，待复核，引用证据）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const cj = await prisma.candidateJob.findUnique({
      where: { id: params.id },
      include: { candidate: true, job: true, evidence: true },
    });
    if (!cj) return fail("候选人岗位关联不存在", 404);

    // PRD 7.5：没有公开来源时报告必须提示"资料不足"
    if (cj.evidence.length === 0) {
      return fail("暂无公开来源证据，请先在 360 档案补充证据后再生成公开足迹报告", 400);
    }

    const { aiOutputId, output } = await generate(
      "public_footprint_report",
      { targetType: "candidate_job", targetId: params.id, candidate: cj.candidate, job: cj.job },
      session.userId
    );

    const report = await prisma.publicFootprintReport.create({
      data: {
        candidateJobId: params.id,
        verifiedFacts: JSON.stringify(output.verified_facts),
        publicClues: JSON.stringify(output.public_clues),
        inferences: JSON.stringify(output.inferences),
        questions: JSON.stringify(output.missing_info),
        riskLevel: (output.risk_level as any) || "GREEN",
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
