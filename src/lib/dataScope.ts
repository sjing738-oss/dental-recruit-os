import { prisma } from "./prisma";
import type { SessionPayload } from "./auth";

// 数据范围过滤 —— 对应 PRD 3.2 数据访问等级与 12.1 RBAC
// ALL: 全部；REGION: 本区域；CLINIC: 本门诊；OWNED: 自己负责；ASSIGNED: 分配给自己

export interface ScopedWhere {
  // 用于 Job：按 region/clinicId/ownerId 过滤
  job?: Record<string, unknown>;
  // 用于 Candidate：按 ownerId 或关联岗位 region 过滤
  candidate?: Record<string, unknown>;
}

// 根据会话生成 Job 查询的 where 片段
export function jobScope(session: SessionPayload): Record<string, unknown> {
  switch (session.dataScope) {
    case "ALL":
      return {};
    case "REGION":
      return { region: session.region };
    case "CLINIC":
      return { clinicId: session.clinicId };
    case "OWNED":
      return { ownerId: session.userId };
    case "ASSIGNED":
      return { ownerId: session.userId };
    default:
      return { ownerId: session.userId };
  }
}

// 根据会话生成 Candidate 查询的 where 片段
export function candidateScope(session: SessionPayload): Record<string, unknown> {
  switch (session.dataScope) {
    case "ALL":
      return {};
    case "REGION":
      // 候选人按 city 或关联岗位 region 过滤；OWNED 兜底
      return {
        OR: [
          { city: session.region },
          { ownerId: session.userId },
        ],
      };
    case "OWNED":
      return { ownerId: session.userId };
    case "ASSIGNED":
      return { ownerId: session.userId };
    case "CLINIC":
      return { ownerId: session.userId };
    default:
      return { ownerId: session.userId };
  }
}

// 判断是否可访问某候选人（用于详情页）
export async function canAccessCandidate(session: SessionPayload, candidateId: string): Promise<boolean> {
  if (session.dataScope === "ALL") return true;
  const c = await prisma.candidate.findUnique({ where: { id: candidateId }, select: { ownerId: true, city: true } });
  if (!c) return false;
  if (session.dataScope === "OWNED" || session.dataScope === "ASSIGNED") return c.ownerId === session.userId;
  if (session.dataScope === "REGION") return c.city === session.region || c.ownerId === session.userId;
  return c.ownerId === session.userId;
}
