import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail } from "@/lib/api";
import { canAccessCandidate } from "@/lib/dataScope";

// GET /api/candidates/:id — 候选人 360 档案聚合
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const access = await canAccessCandidate(session, params.id);
  if (!access) return fail("无权访问该候选人", 403);

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      candidateJobs: {
        include: {
          job: true,
          stageOwner: true,
          statusHistory: { orderBy: { createdAt: "desc" }, take: 20 },
          evidence: { orderBy: { createdAt: "desc" } },
          screeningReports: { orderBy: { createdAt: "desc" } },
          footprintReports: { orderBy: { createdAt: "desc" } },
          assessments: true,
          interviews: { include: { feedbacks: true, assignments: true } },
          communications: { orderBy: { createdAt: "desc" } },
          decision: true,
          offerPlan: { include: { options: true, approvals: true } },
          onboardingPlan: { include: { tasks: true } },
          complianceChecks: true,
        },
      },
      credentials: true,
      talentPool: true,
    },
  });

  if (!candidate) return fail("候选人不存在", 404);

  const auditLogs = await prisma.auditLog.findMany({
    where: { OR: [{ objectType: "candidate", objectId: params.id }, { objectType: "candidate_job", objectId: { in: candidate.candidateJobs.map((cj) => cj.id) } }] },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return ok({ candidate, auditLogs });
}
