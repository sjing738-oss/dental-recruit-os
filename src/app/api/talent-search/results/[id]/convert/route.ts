import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { logAudit } from "@/lib/audit";

// POST /api/talent-search/results/:id/convert — 转为候选人（自动带入来源证据）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const result = await prisma.talentSearchResult.findUnique({
      where: { id: params.id },
      include: { task: true },
    });
    if (!result) return fail("搜索结果不存在", 404);
    if (result.convertedCandidateId) return fail("该线索已转为候选人", 400);

    const body = await req.json().catch(() => ({}));
    const jobId = body.jobId || result.task.jobId;

    // 创建候选人
    const candidate = await prisma.candidate.create({
      data: {
        name: result.name,
        specialty: result.specialty,
        currentOrg: result.currentOrg,
        sourceType: "talent_radar",
        ownerId: session.userId,
        privacyLevel: "L2",
      },
    });

    // 关联岗位（若有）
    let candidateJobId: string | null = null;
    if (jobId) {
      const cj = await prisma.candidateJob.create({
        data: { candidateId: candidate.id, jobId, status: "LEAD_DISCOVERED", stageOwnerId: session.userId, priority: "medium" },
      });
      candidateJobId = cj.id;
    }

    // 自动带入来源证据（PRD 7.3：转候选人时自动带入来源 Evidence）
    await prisma.evidence.create({
      data: {
        candidateId: candidate.id,
        candidateJobId,
        type: "industry",
        sourceUrl: result.sourceUrl,
        title: `人才雷达发现 · ${result.name}`,
        summary: result.reason,
        credibility: result.credibility as any,
        verifyStatus: "UNKNOWN",
        createdById: session.userId,
      },
    });

    // 标记已转换
    await prisma.talentSearchResult.update({ where: { id: params.id }, data: { convertedCandidateId: candidate.id } });

    await logAudit({
      actorId: session.userId,
      action: "talent_search.convert",
      objectType: "candidate",
      objectId: candidate.id,
      after: { name: candidate.name, source: "talent_radar", evidenceBrought: true },
    });

    return ok({ candidateId: candidate.id }, 201);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
