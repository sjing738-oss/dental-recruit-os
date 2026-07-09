import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, unauthorized, ok, fail } from "@/lib/api";
import { generatePortalToken } from "@/lib/portalAuth";
import { logAudit } from "@/lib/audit";

// POST /api/candidates/:id/portal-token — 为候选人生成互动端 Token
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireSession();
  if (!session) return unauthorized();
  const candidate = await prisma.candidate.findUnique({ where: { id: params.id } });
  if (!candidate) return fail("候选人不存在", 404);

  const { token, expiresAt } = await generatePortalToken(params.id);
  await logAudit({ actorId: session.userId, action: "portal.token_generate", objectType: "candidate", objectId: params.id, after: { expiresAt } });

  return ok({ token, url: `/candidate-portal/${token}`, expiresAt }, 201);
}
