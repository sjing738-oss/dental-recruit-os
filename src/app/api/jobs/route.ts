import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { jobScope } from "@/lib/dataScope";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// GET /api/jobs — 岗位列表（按数据范围过滤）
export async function GET(req: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthorized();
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") || "";
  const status = searchParams.get("status");

  const jobs = await prisma.job.findMany({
    where: {
      ...jobScope(session),
      ...(status ? { status } : {}),
      ...(keyword ? { title: { contains: keyword } } : {}),
    },
    include: { clinic: true, owner: true, _count: { select: { candidateJobs: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok({ items: jobs });
}

// POST /api/jobs — 创建岗位
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { title, category, clinicId, region, headcount, priority, reason, salaryMin, salaryMax, salaryDesc } = body;
    if (!title || !category) return fail("岗位名称和类别为必填");

    const job = await prisma.job.create({
      data: {
        title, category,
        clinicId: clinicId || null,
        region: region || session.region,
        headcount: Number(headcount) || 1,
        priority: priority || "medium",
        reason: reason || null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        salaryDesc: salaryDesc || null,
        status: "DRAFT",
        ownerId: session.userId,
      },
    });
    await logAudit({ actorId: session.userId, action: AUDIT_ACTIONS.JOB_CREATE, objectType: "job", objectId: job.id, after: { title } });
    return ok({ job }, 201);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
