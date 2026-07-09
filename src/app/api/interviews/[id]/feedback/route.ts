import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

// POST /api/interviews/:id/feedback — 面试官提交反馈（版本留痕，不覆盖原版）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    // 校验该面试官被分配到此面试
    const assignment = await prisma.interviewAssignment.findFirst({
      where: { interviewId: params.id, interviewerId: session.userId },
    });
    if (!assignment) return fail("你未被分配到此面试", 403);

    const body = await req.json();
    const { scores, conclusion, strengths, risks, questions } = body;
    if (!conclusion) return fail("请填写面试结论");

    // 版本递增（PRD 4.3：反馈修改生成新版本，不覆盖原始）
    const existing = await prisma.interviewFeedback.count({ where: { interviewId: params.id, interviewerId: session.userId } });

    const feedback = await prisma.interviewFeedback.create({
      data: {
        interviewId: params.id,
        interviewerId: session.userId,
        scoresJson: scores ? JSON.stringify(scores) : null,
        conclusion,
        strengths: strengths || null,
        risks: risks || null,
        questions: questions || null,
        submittedAt: new Date(),
        version: existing + 1,
      },
    });

    await logAudit({ actorId: session.userId, action: "interview.feedback", objectType: "interview_feedback", objectId: feedback.id, after: { conclusion, version: feedback.version } });
    return ok({ feedback }, 201);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
