import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, fail } from "@/lib/api";
import { verifyPortalToken } from "@/lib/portalAuth";
import { logAudit } from "@/lib/audit";

// GET /api/portal/:token — 候选人端首页数据（严格字段隔离，不返回内部评分/薪酬底线/AI风险）
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const pt = await verifyPortalToken(params.token);
  if (!pt) return fail("链接无效或已过期，请联系 HR", 403);

  const candidate = pt.candidate;
  const cj = candidate.candidateJobs[0];

  await logAudit({ actorId: null, action: "portal.access", objectType: "candidate", objectId: candidate.id, after: { token: params.token.slice(0, 8) + "..." } });

  // 仅返回候选人可见字段
  return ok({
    candidate: {
      name: candidate.name,
      specialty: candidate.specialty,
    },
    job: cj?.job
      ? {
          title: cj.job.title,
          category: cj.job.category,
          // 仅返回岗位介绍，绝不返回薪酬底线
          intro: cj.job.reason || `欢迎了解「${cj.job.title}」岗位`,
        }
      : null,
    assessments: cj?.assessments.map((a) => ({
      id: a.id,
      assessmentType: a.assessmentType,
      questions: a.questionsJson ? JSON.parse(a.questionsJson) : [],
      deadline: a.deadline,
      status: a.status,
      submitted: !!a.submission,
      // 不返回 aiScore / manualScore / 评分量表内部细节
    })) || [],
    // 面试安排、入职准备占位（P7/P8 接入）
    interviews: [],
    onboarding: [],
  });
}
