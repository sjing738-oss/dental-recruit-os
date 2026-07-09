import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canAccessCandidate } from "@/lib/dataScope";
import { PageHeader, Card, Badge, Button, EmptyState, Icon } from "@/components/ui";
import { CandidateActions } from "@/components/CandidateActions";
import { AIReportPanel } from "@/components/AIReportPanel";
import { PortalPanel } from "@/components/PortalPanel";
import { InterviewPanel } from "@/components/InterviewPanel";
import { DecisionOfferPanel } from "@/components/DecisionOfferPanel";
import { hasPermission, PERMISSIONS } from "@/lib/constants";
import { STATUS_LABELS, STATUS_COLORS, STATUS_FLOW_ORDER, nextStatuses, isDoctorCategory } from "@/lib/status";
import { formatDate, maskPhone, maskEmail, shortDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function CandidateDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const access = await canAccessCandidate(session, params.id);
  if (!access) {
    return <Card><EmptyState icon="Lock" title="无权访问" desc="你没有权限查看该候选人" action={<Link href="/candidates"><Button>返回列表</Button></Link>} /></Card>;
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      candidateJobs: {
        include: {
          job: true, stageOwner: true,
          statusHistory: { orderBy: { createdAt: "desc" }, take: 15 },
          evidence: { orderBy: { createdAt: "desc" } },
          screeningReports: { orderBy: { createdAt: "desc" } },
          footprintReports: { orderBy: { createdAt: "desc" } },
          assessments: { include: { submission: true }, orderBy: { createdAt: "desc" } },
          interviews: { include: { feedbacks: true, assignments: { include: { interviewer: true } } }, orderBy: { createdAt: "desc" } },
          decision: true,
          offerPlan: { include: { options: true, approvals: true } },
          onboardingPlan: { include: { tasks: true } },
          communications: { orderBy: { createdAt: "desc" }, take: 10, include: { created: true } },
        },
      },
      credentials: true,
      talentPool: true,
      tokens: true,
    },
  });

  const interviewers = await prisma.user.findMany({
    where: { role: { code: { in: ["medical", "interviewer"] } } },
    select: { id: true, name: true },
  });

  if (!candidate) {
    return <Card><EmptyState icon="AlertCircle" title="候选人不存在" action={<Link href="/candidates"><Button>返回列表</Button></Link>} /></Card>;
  }

  const cj = candidate.candidateJobs[0];
  const currentStatus = cj?.status;
  const nextOptions = cj ? nextStatuses(cj.status) : [];
  const currentIndex = cj ? STATUS_FLOW_ORDER.indexOf(cj.status) : -1;
  const isDoctor = cj ? isDoctorCategory(cj.job.category) : false;
  const hasCredential = candidate.credentials.length > 0;

  return (
    <div>
      <PageHeader
        title={candidate.name}
        desc={`${candidate.specialty || "未填写"} · ${candidate.currentOrg || "未填写"} · ${candidate.city || ""}`}
        action={
          <span className="flex items-center gap-2">
            {currentStatus && <Badge color={(STATUS_COLORS[currentStatus] as any) || "gray"}>{STATUS_LABELS[currentStatus] || currentStatus}</Badge>}
            <Link href="/candidates"><Button variant="ghost"><Icon name="ArrowLeft" className="w-4 h-4" />返回</Button></Link>
          </span>
        }
      />

      {/* 摘要卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <Card><div className="text-xs text-ink-3 mb-1">关联岗位</div><div className="text-sm font-semibold text-ink">{cj?.job?.title || "—"}</div></Card>
        <Card><div className="text-xs text-ink-3 mb-1">负责人</div><div className="text-sm font-semibold text-ink">{cj?.stageOwner?.name || candidate.owner?.name || "—"}</div></Card>
        <Card><div className="text-xs text-ink-3 mb-1">期望薪酬</div><div className="text-sm font-semibold text-ink">{candidate.expectedSalary ? `${candidate.expectedSalary}元/月` : "—"}</div></Card>
        <Card><div className="text-xs text-ink-3 mb-1">来源</div><div className="text-sm font-semibold text-ink">{candidate.sourceType || "—"}</div></Card>
      </div>

      {/* 医生类资质提醒 */}
      {isDoctor && !hasCredential && (
        <div className="flex items-center gap-2 text-xs text-amber bg-amber/10 border border-amber/25 rounded-lg px-3 py-2.5 mb-4">
          <Icon name="AlertTriangle" className="w-4 h-4" />
          该候选人为医生类岗位（{cj.job.title}），进入决策前必须添加执业资质核验记录
        </div>
      )}

      {/* 状态时间轴 */}
      {cj && (
        <Card className="mb-4">
          <h3 className="text-base font-semibold mb-3">招聘流程进度</h3>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FLOW_ORDER.map((s, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <div key={s} className="flex items-center">
                  <div className={`px-2.5 py-1 rounded-md text-xs ${active ? "bg-brand text-[#06121a] font-semibold" : done ? "bg-green/15 text-green" : "bg-bg-2 text-ink-3"}`}>
                    {done && <Icon name="Check" className="w-3 h-3 inline mr-1" />}{STATUS_LABELS[s]}
                  </div>
                  {i < STATUS_FLOW_ORDER.length - 1 && <Icon name="ChevronRight" className="w-3 h-3 text-ink-3 mx-0.5" />}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 状态迁移 */}
      {cj && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">下一步操作</h3>
            <span className="text-xs text-ink-3">状态迁移走服务层，自动写 StatusHistory + AuditLog</span>
          </div>
          <CandidateActions candidateJobId={cj.id} nextOptions={nextOptions} />
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 资料 */}
        <Card>
          <h3 className="text-base font-semibold mb-3">基础资料</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-ink-3">姓名</span><span className="text-ink">{candidate.name}</span></div>
            <div className="flex justify-between"><span className="text-ink-3">手机</span><span className="text-ink">{maskPhone(candidate.phone)}</span></div>
            <div className="flex justify-between"><span className="text-ink-3">邮箱</span><span className="text-ink">{maskEmail(candidate.email)}</span></div>
            <div className="flex justify-between"><span className="text-ink-3">专业方向</span><span className="text-ink">{candidate.specialty || "—"}</span></div>
            <div className="flex justify-between"><span className="text-ink-3">当前机构</span><span className="text-ink">{candidate.currentOrg || "—"}</span></div>
            <div className="flex justify-between"><span className="text-ink-3">城市</span><span className="text-ink">{candidate.city || "—"}</span></div>
          </div>
        </Card>

        {/* 证据与资质 */}
        <Card>
          <h3 className="text-base font-semibold mb-3">证据与资质核验</h3>
          {candidate.credentials.length === 0 && (!cj || cj.evidence.length === 0) ? (
            <EmptyState icon="FileSearch" title="暂无证据" desc="P4 人才雷达与 P5 公开足迹将补充证据" />
          ) : (
            <div className="space-y-3">
              {candidate.credentials.map((cr) => (
                <div key={cr.id} className="flex items-center justify-between p-2 rounded-lg bg-bg-2/50">
                  <div>
                    <div className="text-sm text-ink">{cr.credentialType}</div>
                    <div className="text-[10px] text-ink-3">{cr.registeredScope || "注册范围未填"}</div>
                  </div>
                  <Badge color={cr.verifyStatus === "VERIFIED" ? "green" : cr.verifyStatus === "FAILED" ? "red" : "amber"}>{cr.verifyStatus === "VERIFIED" ? "已核验" : cr.verifyStatus === "FAILED" ? "核验失败" : "待核验"}</Badge>
                </div>
              ))}
              {cj?.evidence.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-2 rounded-lg bg-bg-2/50">
                  <div className="min-w-0">
                    <div className="text-sm text-ink truncate">{ev.title || ev.type}</div>
                    <div className="text-[10px] text-ink-3">{ev.type} · {ev.credibility}</div>
                  </div>
                  <Badge color={ev.verifyStatus === "VERIFIED" ? "green" : "gray"}>{ev.verifyStatus}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* AI 评估（P5） */}
        {cj && (
          <Card className="lg:col-span-2">
            <AIReportPanel candidateJobId={cj.id} screeningReports={cj.screeningReports as any} footprintReports={cj.footprintReports as any} />
          </Card>
        )}

        {/* 面试协同（P7） */}
        {cj && (
          <Card>
            <InterviewPanel candidateJobId={cj.id} interviews={cj.interviews as any} interviewers={interviewers} />
          </Card>
        )}

        {/* 沟通记录 */}
        <Card>
          <h3 className="text-base font-semibold mb-3">沟通记录</h3>
          {cj?.communications.length === 0 ? (
            <EmptyState icon="MessageSquare" title="暂无沟通记录" desc="P5 候选人互动中心将生成触达话术" />
          ) : (
            <div className="space-y-2">
              {cj?.communications.map((m) => (
                <div key={m.id} className="p-2 rounded-lg bg-bg-2/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-2">{m.channel} · {m.direction}</span>
                    <span className="text-ink-3">{shortDate(m.createdAt)}</span>
                  </div>
                  <div className="text-sm text-ink mt-1">{m.summary || m.content}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 决策·Offer·入职（P8） */}
        {cj && (
          <Card className="lg:col-span-2">
            <DecisionOfferPanel candidateJobId={cj.id} decision={cj.decision as any} offerPlan={cj.offerPlan as any} onboardingPlan={cj.onboardingPlan as any} canApprove={hasPermission(session.roleCode, PERMISSIONS.OFFER_APPROVE)} />
          </Card>
        )}
      </div>

      {/* 候选人端与测评（P6） */}
      {cj && (
        <Card className="mt-4">
          <PortalPanel candidateId={candidate.id} candidateJobId={cj.id} assessments={cj.assessments as any} tokenCount={candidate.tokens.length} />
        </Card>
      )}

      {/* 状态历史 + 审计 */}
      <Card className="mt-4">
        <h3 className="text-base font-semibold mb-3">状态变更历史</h3>
        {cj?.statusHistory.length === 0 ? (
          <p className="text-xs text-ink-3 text-center py-2">暂无状态变更</p>
        ) : (
          <div className="space-y-2">
            {cj?.statusHistory.map((h) => (
              <div key={h.id} className="flex items-start gap-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
                <div className="flex-1">
                  <span className="text-ink-2">{h.fromStatus ? STATUS_LABELS[h.fromStatus] + " → " : ""}{STATUS_LABELS[h.toStatus]}</span>
                  {h.reason && <span className="text-ink-3"> · {h.reason}</span>}
                  <div className="text-[10px] text-ink-3">{formatDate(h.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-[11px] text-ink-3 mt-4 text-center">候选人 360 档案 · 所有状态迁移经服务层校验并写入 StatusHistory 与 AuditLog</p>
    </div>
  );
}
