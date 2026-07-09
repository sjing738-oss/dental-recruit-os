import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok } from "@/lib/api";

// GET /api/interviewer/tasks — 当前面试官的面试任务（只能看分配给自己的）
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const assignments = await prisma.interviewAssignment.findMany({
    where: { interviewerId: session.userId },
    include: {
      interview: {
        include: {
          candidateJob: { include: { candidate: true, job: true } },
          feedbacks: { where: { interviewerId: session.userId }, orderBy: { version: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok({
    items: assignments.map((a) => ({
      assignmentId: a.id,
      status: a.status,
      interview: {
        id: a.interview.id,
        round: a.interview.round,
        scheduledAt: a.interview.scheduledAt,
        location: a.interview.location,
        interviewStatus: a.interview.status,
        candidate: { name: a.interview.candidateJob.candidate.name, specialty: a.interview.candidateJob.candidate.specialty },
        job: { title: a.interview.candidateJob.job.title },
        myLatestFeedback: a.interview.feedbacks[0] || null,
      },
    })),
  });
}
