import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail, serverError } from "@/lib/api";
import { verifyPortalToken } from "@/lib/portalAuth";
import { logAudit } from "@/lib/audit";

// POST /api/portal/:token/assessments/:id/submit — 候选人端提交测评作答
export async function POST(req: NextRequest, { params }: { params: { token: string; id: string } }) {
  const pt = await verifyPortalToken(params.token);
  if (!pt) return fail("链接无效或已过期", 403);

  try {
    const assessment = await prisma.dynamicAssessment.findUnique({
      where: { id: params.id },
      include: { submission: true, candidateJob: { include: { candidate: true } } },
    });
    if (!assessment) return fail("测评不存在", 404);
    // 校验该测评属于该候选人
    if (assessment.candidateJob.candidateId !== pt.candidateId) return fail("无权作答该测评", 403);
    if (assessment.submission) return fail("该测评已提交作答", 400);

    const body = await req.json();
    const { answers } = body;
    if (!answers) return fail("请提交作答内容");

    const submission = await prisma.assessmentSubmission.create({
      data: {
        assessmentId: params.id,
        candidateId: pt.candidateId,
        answersJson: JSON.stringify(answers),
        submittedAt: new Date(),
      },
    });

    await prisma.dynamicAssessment.update({ where: { id: params.id }, data: { status: "SUBMITTED" } });

    await logAudit({ actorId: null, action: "portal.submit", objectType: "assessment_submission", objectId: submission.id, after: { assessmentId: params.id } });

    return ok({ submissionId: submission.id }, 201);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
