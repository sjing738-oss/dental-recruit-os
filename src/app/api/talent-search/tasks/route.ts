import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { generateStrategy } from "@/lib/talentSearchProvider";
import { logAudit } from "@/lib/audit";

// GET /api/talent-search/tasks — 任务列表
export async function GET() {
  const session = await requireSession();
  if (!session) return unauthorized();
  const tasks = await prisma.talentSearchTask.findMany({
    include: { job: true, _count: { select: { results: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok({ items: tasks });
}

// POST /api/talent-search/tasks — 创建搜索任务（含搜索策略）
export async function POST(req: NextRequest) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const body = await req.json();
    const { jobId, city, specialty, level, orgTypes, keywords, targetCount } = body;
    if (!specialty && !keywords) return fail("专业方向或关键词至少填一项");

    const task = await prisma.talentSearchTask.create({
      data: {
        jobId: jobId || null,
        city: city || null,
        specialty: specialty || null,
        level: level || null,
        orgTypes: orgTypes || null,
        keywords: keywords || null,
        targetCount: Number(targetCount) || 10,
        status: "created",
        ownerId: session.userId,
        strategyJson: generateStrategy({
          id: "", jobId: null, city: city || null, specialty: specialty || null,
          level: level || null, orgTypes: orgTypes || null, keywords: keywords || null,
          targetCount: Number(targetCount) || 10, status: "created", ownerId: null,
          strategyJson: null, createdAt: new Date(), updatedAt: new Date(),
        } as any),
      },
    });
    await logAudit({ actorId: session.userId, action: "talent_search.create", objectType: "talent_search_task", objectId: task.id });
    return ok({ task }, 201);
  } catch (e) {
    console.error(e);
    return serverError();
  }
}
