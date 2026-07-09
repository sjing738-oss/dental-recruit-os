import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { candidateScope } from "@/lib/dataScope";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// GET /api/candidates — 候选人列表（按数据范围过滤）
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthorized();
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") || "";

  const candidates = await prisma.candidate.findMany({
    where: {
      ...candidateScope(session),
      ...(keyword ? { OR: [{ name: { contains: keyword } }, { specialty: { contains: keyword } }, { currentOrg: { contains: keyword } }] } : {}),
    },
    include: {
      owner: true,
      candidateJobs: { include: { job: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return ok({ items: candidates });
}

// POST /api/candidates — 创建候选人（可同时关联岗位）
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { name, phone, email, specialty, currentOrg, city, expectedSalary, sourceType, jobId } = body;
    if (!name) return fail("姓名为必填");

    const candidate = await prisma.candidate.create({
      data: {
        name, phone: phone || null, email: email || null,
        specialty: specialty || null, currentOrg: currentOrg || null,
        city: city || null, expectedSalary: expectedSalary ? Number(expectedSalary) : null,
        sourceType: sourceType || "direct", ownerId: session.userId, privacyLevel: "L2",
      },
    });

    if (jobId) {
      await prisma.candidateJob.create({
        data: { candidateId: candidate.id, jobId, status: "POOLED", stageOwnerId: session.userId, priority: "medium" },
      });
    }

    await logAudit({ actorId: session.userId, action: AUDIT_ACTIONS.CANDIDATE_CREATE, objectType: "candidate", objectId: candidate.id, after: { name } });
    return ok({ candidate }, 201);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
