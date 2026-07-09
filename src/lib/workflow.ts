import { prisma } from "./prisma";
import { logAudit, AUDIT_ACTIONS } from "./audit";
import type { SessionPayload } from "./auth";
import { canTransition, isDoctorCategory, STATUS_LABELS } from "./status";

// re-export 纯函数（保持现有 import 兼容）
export { STATUS_LABELS, STATUS_COLORS, canTransition, nextStatuses, isDoctorCategory } from "./status";

export interface TransitionResult {
  ok: boolean;
  status?: string;
  message?: string;
}

// 执行状态迁移 —— 所有迁移必经此 service，写 StatusHistory + AuditLog（PRD 4.3）
export async function transition(
  candidateJobId: string,
  toStatus: string,
  session: SessionPayload,
  options?: { reason?: string; action?: string }
): Promise<TransitionResult> {
  const cj = await prisma.candidateJob.findUnique({
    where: { id: candidateJobId },
    include: { job: true },
  });
  if (!cj) return { ok: false, message: "候选人岗位关联不存在" };

  const from = cj.status;
  if (from === toStatus) return { ok: false, message: "状态未变化" };
  if (!canTransition(from, toStatus)) {
    return { ok: false, message: `不允许从「${STATUS_LABELS[from] || from}」迁移到「${STATUS_LABELS[toStatus] || toStatus}」` };
  }

  // 进入 rejected 必填淘汰原因
  if (toStatus === "REJECTED" && !options?.reason) {
    return { ok: false, message: "淘汰必须填写原因" };
  }

  // 医生类岗位进入 decision 前必须存在 credential_check（PRD 4.3）
  if (toStatus === "DECISION" && isDoctorCategory(cj.job.category)) {
    const cred = await prisma.credentialCheck.findFirst({ where: { candidateId: cj.candidateId } });
    if (!cred) {
      return { ok: false, message: "医生类岗位进入决策前必须先添加执业资质核验记录" };
    }
  }

  const before = { status: from };
  await prisma.candidateJob.update({
    where: { id: candidateJobId },
    data: {
      status: toStatus,
      rejectedAt: toStatus === "REJECTED" ? new Date() : cj.rejectedAt,
      rejectReason: toStatus === "REJECTED" ? options?.reason : cj.rejectReason,
      hiredAt: toStatus === "HIRED" ? new Date() : cj.hiredAt,
    },
  });

  await prisma.statusHistory.create({
    data: {
      candidateJobId,
      fromStatus: from,
      toStatus,
      action: options?.action || `transition_${from}_to_${toStatus}`,
      reason: options?.reason || null,
      operatorId: session.userId,
    },
  });

  await logAudit({
    actorId: session.userId,
    action: AUDIT_ACTIONS.CANDIDATE_TRANSITION,
    objectType: "candidate_job",
    objectId: candidateJobId,
    before,
    after: { status: toStatus, reason: options?.reason },
  });

  return { ok: true, status: toStatus };
}
