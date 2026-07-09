import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail, serverError } from "@/lib/api";
import { runSearch } from "@/lib/talentSearchProvider";
import { logAudit } from "@/lib/audit";

// POST /api/talent-search/tasks/:id/run — 运行搜索（Mock Provider）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  try {
    const task = await prisma.talentSearchTask.findUnique({ where: { id: params.id } });
    if (!task) return fail("任务不存在", 404);

    await prisma.talentSearchTask.update({ where: { id: params.id }, data: { status: "running" } });

    const results = await runSearch(task);

    // 清除旧结果（重新运行）
    await prisma.talentSearchResult.deleteMany({ where: { taskId: params.id } });

    // 写入新结果
    await prisma.talentSearchResult.createMany({
      data: results.map((r) => ({
        taskId: params.id,
        name: r.name,
        currentOrg: r.currentOrg,
        specialty: r.specialty,
        sourceUrl: r.sourceUrl,
        reason: r.reason,
        credibility: r.credibility,
        contactPriority: r.contactPriority,
      })),
    });

    await prisma.talentSearchTask.update({ where: { id: params.id }, data: { status: "completed" } });
    await logAudit({ actorId: session.userId, action: "talent_search.run", objectType: "talent_search_task", objectId: params.id, after: { resultCount: results.length } });

    return ok({ count: results.length });
  } catch (e) {
    console.error(e);
    await prisma.talentSearchTask.update({ where: { id: params.id }, data: { status: "failed" } }).catch(() => {});
    return serverError("搜索失败");
  }
}
