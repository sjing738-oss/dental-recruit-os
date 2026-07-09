import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail } from "@/lib/api";

// GET /api/talent-search/tasks/:id — 任务详情（含搜索结果）
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  const task = await prisma.talentSearchTask.findUnique({
    where: { id: params.id },
    include: { job: true, results: { orderBy: { createdAt: "desc" } } },
  });
  if (!task) return fail("任务不存在", 404);
  return ok({ task });
}
