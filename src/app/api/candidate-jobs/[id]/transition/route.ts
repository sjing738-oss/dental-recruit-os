import { NextRequest } from "next/server";
import { requireSession, unauthorized, ok, fail } from "@/lib/api";
import { transition } from "@/lib/workflow";

// POST /api/candidate-jobs/:id/transition — 候选人状态迁移（走状态机服务）
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  const body = await req.json();
  const { toStatus, reason, action } = body;
  if (!toStatus) return fail("缺少目标状态 toStatus");

  const result = await transition(params.id, toStatus, session, { reason, action });
  if (!result.ok) return fail(result.message || "迁移失败");
  return ok({ status: result.status });
}
