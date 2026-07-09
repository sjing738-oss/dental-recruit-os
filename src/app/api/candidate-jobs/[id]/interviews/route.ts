import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

// POST /api/candidate-jobs/:id/interviews — 安排面试（创建任务并分配面试官）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const cj = await prisma.candidateJob.findUnique({ where: { id: params.id }, include: { job: true, candidate: true } });
    if (!cj) return fail("候选人岗位关联不存在", 404);

    const body = await req.json();
    const { round, scheduledAt, location, interviewerIds } = body;
    if (!round || !interviewerIds?.length) return fail("面试轮次与面试官为必填");

    const interview = await prisma.interview.create({
      data: {
        candidateJobId: params.id,
        round,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        location: location || null,
        status: "SCHEDULED",
      },
    });

    await prisma.interviewAssignment.createMany({
      data: interviewerIds.map((uid: string) => ({ interviewId: interview.id, interviewerId: uid, status: "assigned" })),
    });

    await logAudit({ actorId: session.userId, action: "interview.schedule", objectType: "interview", objectId: interview.id, after: { round, interviewerCount: interviewerIds.length } });
    return ok({ interview }, 201);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
