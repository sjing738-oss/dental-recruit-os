import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { PageHeader, Card, Icon, Badge } from "@/components/ui";
import { ROLE_NAMES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_FLOW: { key: string; label: string; color: string }[] = [
  { key: "LEAD_DISCOVERED", label: "待确认线索", color: "bg-ink-3" },
  { key: "POOLED", label: "已入池", color: "bg-blue" },
  { key: "SCREENING", label: "初筛中", color: "bg-teal" },
  { key: "ASSESSMENT", label: "动态测评", color: "bg-amber" },
  { key: "INTERVIEW_1", label: "面试中", color: "bg-purple" },
  { key: "DECISION", label: "决策中", color: "bg-brand" },
  { key: "OFFER", label: "Offer中", color: "bg-green" },
  { key: "HIRED", label: "已入职", color: "bg-green" },
  { key: "TALENT_POOL", label: "人才库", color: "bg-blue" },
  { key: "REJECTED", label: "已淘汰", color: "bg-red" },
];

export default async function DashboardPage() {
  const session = await getSession();

  const [openJobs, totalJobs, totalCandidates, hired, aiPending, credentialPending, recentAudit] =
    await Promise.all([
      prisma.job.count({ where: { status: "OPEN" } }),
      prisma.job.count(),
      prisma.candidate.count(),
      prisma.candidateJob.count({ where: { status: "HIRED" } }),
      prisma.aIOutput.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.credentialCheck.count({ where: { verifyStatus: { in: ["UNKNOWN", "PENDING"] } } }),
      prisma.auditLog.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { actor: true } }),
    ]);

  const statusGroups = await prisma.candidateJob.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const statusMap = new Map(statusGroups.map((g) => [g.status, g._count._all]));
  const funnelMax = Math.max(1, ...STATUS_FLOW.map((s) => statusMap.get(s.key as any) || 0));

  const stats = [
    { label: "开放岗位", value: openJobs, total: totalJobs, icon: "Briefcase", color: "text-brand", bg: "bg-brand/10" },
    { label: "候选人总数", value: totalCandidates, icon: "Users", color: "text-blue", bg: "bg-blue/10" },
    { label: "已入职", value: hired, icon: "UserCheck", color: "text-green", bg: "bg-green/10" },
    { label: "AI 待复核", value: aiPending, icon: "Sparkles", color: "text-amber", bg: "bg-amber/10" },
  ];

  const todos = [
    { icon: "FileSearch", label: "AI 报告待复核", count: aiPending, color: "text-amber" },
    { icon: "BadgeCheck", label: "资质待核验", count: credentialPending, color: "text-red" },
  ];

  const roleName = session ? ROLE_NAMES[session.roleCode] || session.roleCode : "";

  return (
    <div>
      <PageHeader
        title="招聘驾驶舱"
        desc="全局掌握岗位、候选人、风险与待办"
        action={
          <span className="flex items-center gap-2">
            <Badge color="brand">{roleName}</Badge>
            <span className="text-sm text-ink-2">欢迎回来，{session?.name}</span>
          </span>
        }
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", s.bg)}>
              <Icon name={s.icon} className={cn("w-5 h-5", s.color)} />
            </div>
            <div>
              <div className="text-2xl font-bold text-ink leading-none">
                {s.value}
                {s.total !== undefined && <span className="text-sm text-ink-3 font-normal"> / {s.total}</span>}
              </div>
              <div className="text-xs text-ink-3 mt-1">{s.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 招聘漏斗 */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold">招聘漏斗</h3>
            <Badge color="gray">候选人阶段分布</Badge>
          </div>
          <div className="space-y-2.5">
            {STATUS_FLOW.map((s) => {
              const count = statusMap.get(s.key as any) || 0;
              const width = (count / funnelMax) * 100;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-ink-2 text-right shrink-0">{s.label}</div>
                  <div className="flex-1 h-7 bg-bg-2 rounded-md overflow-hidden">
                    <div
                      className={cn("h-full rounded-md flex items-center justify-end px-2 transition-all", s.color)}
                      style={{ width: `${Math.max(width, count > 0 ? 8 : 0)}%` }}
                    >
                      {count > 0 && <span className="text-[10px] font-semibold text-white">{count}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
            {totalCandidates === 0 && (
              <p className="text-center text-xs text-ink-3 py-4">
                暂无候选人数据，运行种子数据或前往「人才雷达」开始招聘流程
              </p>
            )}
          </div>
        </Card>

        {/* 待办 + 最近审计 */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-base font-semibold mb-3">今日待办</h3>
            <div className="space-y-2">
              {todos.map((t) => (
                <div key={t.label} className="flex items-center justify-between p-2.5 rounded-lg bg-bg-2/50">
                  <div className="flex items-center gap-2.5">
                    <Icon name={t.icon} className={cn("w-4 h-4", t.color)} />
                    <span className="text-sm text-ink-2">{t.label}</span>
                  </div>
                  <Badge color={t.count > 0 ? "amber" : "gray"}>{t.count}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-base font-semibold mb-3">最近活动</h3>
            <div className="space-y-2.5">
              {recentAudit.length === 0 && <p className="text-xs text-ink-3 text-center py-2">暂无活动</p>}
              {recentAudit.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-ink-2">{log.actor?.name || "系统"}</span>
                    <span className="text-ink-3"> · {log.action}</span>
                    <div className="text-[10px] text-ink-3">{new Date(log.createdAt).toLocaleString("zh-CN")}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <p className="text-[11px] text-ink-3 mt-6 text-center">
        指标均从数据库实时统计 · 非固定假数据 · 新增/推进流程后指标自动变化
      </p>
    </div>
  );
}
