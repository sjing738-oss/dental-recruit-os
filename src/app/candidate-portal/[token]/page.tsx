import { verifyPortalToken } from "@/lib/portalAuth";
import { AssessmentTake } from "@/components/AssessmentTake";
import { Icon } from "@/components/ui";
import { shortDate } from "@/lib/utils";

export default async function PortalPage({ params }: { params: { token: string } }) {
  const pt = await verifyPortalToken(params.token);

  if (!pt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="LinkOff" className="w-7 h-7 text-red" />
          </div>
          <h1 className="text-lg font-bold text-ink mb-2">链接无效或已过期</h1>
          <p className="text-sm text-ink-3">该候选人端链接已失效、被撤销或超过访问次数。请联系招聘 HR 重新获取链接。</p>
        </div>
      </div>
    );
  }

  const candidate = pt.candidate;
  const cj = candidate.candidateJobs[0];
  const job = cj?.job;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* 顶部品牌 */}
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-line">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-2 flex items-center justify-center">
            <Icon name="Stethoscope" className="w-5 h-5 text-[#06121a]" />
          </div>
          <div>
            <div className="text-sm font-bold text-ink">瑞泰口腔医疗集团 · 招聘流程</div>
            <div className="text-[10px] text-ink-3">候选人互动端</div>
          </div>
        </div>

        {/* 欢迎 + 岗位介绍 */}
        <div className="card mb-4">
          <h1 className="text-lg font-bold text-ink mb-1">{candidate.name}，欢迎您</h1>
          {job ? (
            <>
              <p className="text-sm text-ink-2 mt-2">应聘岗位：<span className="text-ink font-medium">{job.title}</span></p>
              <p className="text-xs text-ink-3 mt-2 leading-relaxed">{job.reason || `欢迎了解「${job.title}」岗位，请按流程完成资料与测评。`}</p>
            </>
          ) : (
            <p className="text-sm text-ink-3 mt-2">暂无关联岗位信息</p>
          )}
        </div>

        {/* 测评 */}
        <div className="card mb-4">
          <h2 className="text-base font-semibold text-ink mb-3">动态能力测评</h2>
          {(!cj || cj.assessments.length === 0) ? (
            <p className="text-sm text-ink-3 text-center py-4">暂无测评任务，请耐心等待 HR 安排</p>
          ) : (
            <div className="space-y-5">
              {cj.assessments.map((a) => {
                const questions = a.questionsJson ? JSON.parse(a.questionsJson) : [];
                return (
                  <div key={a.id} className="p-3 rounded-lg bg-bg-2/50 border border-line">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-ink">{a.assessmentType}</span>
                      <span className="text-[10px] text-ink-3">截止 {shortDate(a.deadline)}</span>
                    </div>
                    {a.status === "SUBMITTED" || a.submission ? (
                      <div className="flex items-center gap-1.5 text-sm text-green py-1">
                        <Icon name="CheckCircle2" className="w-4 h-4" /> 已提交，等待复核
                      </div>
                    ) : (
                      <AssessmentTake token={params.token} assessmentId={a.id} questions={questions} submitted={false} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-[11px] text-ink-3 text-center mt-6">本页面仅展示与您相关的招聘流程信息，不包含内部评分与评价</p>
      </div>
    </div>
  );
}
