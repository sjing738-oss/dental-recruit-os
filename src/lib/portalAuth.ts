// 候选人端 Token 校验 —— 对应 PRD 7.7 候选人互动端，独立于内部登录
import { prisma } from "./prisma";
import crypto from "crypto";

export async function generatePortalToken(candidateId: string) {
  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  await prisma.portalToken.create({
    data: { candidateId, token, expiresAt, maxAccessCount: 1000 },
  });
  return { token, expiresAt };
}

// 校验 token：过期/撤销/超限均拒绝，访问计数+1
export async function verifyPortalToken(token: string) {
  const pt = await prisma.portalToken.findUnique({
    where: { token },
    include: {
      candidate: {
        include: {
          candidateJobs: {
            include: { job: true, assessments: { include: { submission: true } } },
          },
        },
      },
    },
  });
  if (!pt) return null;
  if (pt.revokedAt) return null;
  if (pt.expiresAt < new Date()) return null;
  if (pt.maxAccessCount && pt.accessCount >= pt.maxAccessCount) return null;

  await prisma.portalToken.update({
    where: { id: pt.id },
    data: { accessCount: { increment: 1 } },
  });
  return pt;
}
