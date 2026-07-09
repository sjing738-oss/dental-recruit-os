import { prisma } from "./prisma";

interface AuditParams {
  actorId?: string | null;
  action: string;
  objectType: string;
  objectId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
}

// 统一审计入口 —— 所有关键动作经此写入 AuditLog（不可删除）
export async function logAudit(params: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        action: params.action,
        objectType: params.objectType,
        objectId: params.objectId || null,
        beforeJson: params.before ? JSON.stringify(params.before) : null,
        afterJson: params.after ? JSON.stringify(params.after) : null,
        ip: params.ip || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (e) {
    // 审计失败不应阻断主业务，但需记录到 stderr
    console.error("[audit] 写入失败:", e);
  }
}

// 常用 action 常量
export const AUDIT_ACTIONS = {
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  JOB_CREATE: "job.create",
  JOB_UPDATE: "job.update",
  CANDIDATE_CREATE: "candidate.create",
  CANDIDATE_TRANSITION: "candidate.transition",
  AI_GENERATE: "ai.generate",
  AI_REVIEW: "ai.review",
  OFFER_APPROVE: "offer.approve",
  PORTAL_ACCESS: "portal.access",
  PORTAL_SUBMIT: "portal.submit",
} as const;
