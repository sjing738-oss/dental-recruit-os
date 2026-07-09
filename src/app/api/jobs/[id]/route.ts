import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail } from "@/lib/api";

// GET /api/jobs/:id — 岗位详情（含画像、关联候选人）
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      clinic: true,
      owner: true,
      profile: true,
      candidateJobs: { include: { candidate: true }, orderBy: { enteredAt: "desc" } },
    },
  });
  if (!job) return fail("岗位不存在", 404);
  return ok({ job });
}

// PATCH /api/jobs/:id — 更新岗位
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  const body = await req.json();
  const before = await prisma.job.findUnique({ where: { id: params.id } });
  if (!before) return fail("岗位不存在", 404);
  const job = await prisma.job.update({
    where: { id: params.id },
    data: {
      ...("title" in body ? { title: body.title } : {}),
      ...("status" in body ? { status: body.status } : {}),
      ...("priority" in body ? { priority: body.priority } : {}),
      ...("salaryMin" in body ? { salaryMin: body.salaryMin ? Number(body.salaryMin) : null } : {}),
      ...("salaryMax" in body ? { salaryMax: body.salaryMax ? Number(body.salaryMax) : null } : {}),
      ...("reason" in body ? { reason: body.reason } : {}),
    },
  });
  return ok({ job });
}
