import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, Icon } from "@/components/ui";
import { STATUS_LABELS, STATUS_COLORS, STATUS_FLOW_ORDER } from "@/lib/status";
import { cn } from "@/lib/utils";

export default async function AnalyticsPage() {
  const [statusGroups, categoryGroups, aiGroups, offerGroups, totalCandidates, totalJobs, hired] = await Promise.all([
    prisma.candidateJob.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.job.groupBy({ by: ["category"], _count: { _all: true } }),
    prisma.aIOutput.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.offerPlan.groupBy({ by: ["planStatus"], _count: { _all: true } }),
    prisma.candidate.count(),
    prisma.job.count(),
    prisma.candidateJob.count({ where: { status: "HIRED" } }),
  ]);
  const statusMap = new Map(statusGroups.map((g) => [g.status, g._count._all]));
  const aiMap = new Map(aiGroups.map((g) => [g.status, g._count._all]));
  const offerAccepted = offerGroups.find((g) => g.planStatus === "ACCEPTED")?._count._all || 0;
  const offerTotal = offerGroups.reduce((s, g) => s + g._count._all, 0);
  const aiConfirmed = (aiMap.get("CONFIRMED") || 0) + (aiMap.get("REVISED") || 0);
  const aiTotal = aiGroups.reduce((s, g) => s + g._count._all, 0);
  const funnelMax = Math.max(1, ...STATUS_FLOW_ORDER.map((s) => statusMap.get(s) || 0));

  const stats = [
    { label: "候选人总数", value: totalCandidates, icon: "Users", color: "text-blue", bg: "bg-blue/10" },
    { label: "岗位总数", value: totalJobs, icon: "Briefcase", color: "text-brand", bg: "bg-brand/10" },
    { label: "已入职", value: hired, icon: "UserCheck", color: "text-green", bg: "bg-green/10" },
    { label: "Offer 接受率", value: offerTotal ? `${Math.round((offerAccepted / offerTotal) * 100)}%` : "—", icon: "TrendingUp", color: "text-purple", bg: "bg-purple/10" },
    { label: "AI 报告复核率", value: aiTotal ? `${Math.round((aiConfirmed / aiTotal) * 100)}%` : "—", icon: "Sparkles", color: "text-amber", bg: "bg-amber/10" },
    { label: "AI 待复核", value: aiMap.get("PENDING_REVIEW") || 0, icon: "Clock", color: "text-red", bg: "bg-red/10" },
  ];

  return (
    <div>
      <PageHeader title="数据看板" desc="招聘漏斗、转化、质量与 AI 使用价值（全部从数据库实时统计）" action={<Badge color="green">真实数据</Badge>} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col items-center text-center">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-2", s.bg)}><Icon name={s.icon} className={cn("w-5 h-5", s.color)} /></div>
            <div className="text-xl font-bold text-ink">{s.value}</div>
            <div className="text-[11px] text-ink-3 mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-base font-semibold mb-3">招聘漏斗</h3>
          <div className="space-y-2">
            {STATUS_FLOW_ORDER.map((s) => {
              const count = statusMap.get(s) || 0;
              const width = (count / funnelMax) * 100;
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-ink-2 text-right shrink-0">{STATUS_LABELS[s]}</div>
                  <div className="flex-1 h-6 bg-bg-2 rounded-md overflow-hidden">
                    <div className={cn("h-full rounded-md flex items-center justify-end px-2", `bg-${STATUS_COLORS[s] === "brand" ? "brand" : STATUS_COLORS[s] === "green" ? "green" : STATUS_COLORS[s] === "purple" ? "purple" : STATUS_COLORS[s] === "amber" ? "amber" : STATUS_COLORS[s] === "red" ? "red" : "blue"}`)} style={{ width: `${Math.max(width, count > 0 ? 8 : 0)}%` }}>
                      {count > 0 && <span className="text-[10px] font-semibold text-white">{count}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold mb-3">岗位类别分布</h3>
          <div className="space-y-2">
            {categoryGroups.map((g) => {
              const max = Math.max(1, ...categoryGroups.map((x) => x._count._all));
              return (
                <div key={g.category} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-ink-2 truncate">{g.category}</div>
                  <div className="flex-1 h-5 bg-bg-2 rounded-md overflow-hidden">
                    <div className="h-full bg-teal rounded-md" style={{ width: `${(g._count._all / max) * 100}%` }} />
                  </div>
                  <span className="text-xs text-ink w-6 text-right">{g._count._all}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold mb-3">AI 输出复核状态</h3>
          <div className="space-y-2">
            {aiGroups.map((g) => (
              <div key={g.status} className="flex items-center justify-between p-2 rounded-lg bg-bg-2/50">
                <span className="text-sm text-ink-2">{g.status === "PENDING_REVIEW" ? "待复核" : g.status === "CONFIRMED" ? "已确认" : g.status === "REVISED" ? "已修订" : "已驳回"}</span>
                <Badge color={g.status === "CONFIRMED" ? "green" : g.status === "PENDING_REVIEW" ? "amber" : g.status === "REJECTED" ? "red" : "blue"}>{g._count._all}</Badge>
              </div>
            ))}
            {aiGroups.length === 0 && <p className="text-xs text-ink-3 text-center py-2">暂无 AI 输出</p>}
          </div>
        </Card>

        <Card>
          <h3 className="text-base font-semibold mb-3">Offer 状态分布</h3>
          <div className="space-y-2">
            {offerGroups.map((g) => (
              <div key={g.planStatus} className="flex items-center justify-between p-2 rounded-lg bg-bg-2/50">
                <span className="text-sm text-ink-2">{g.planStatus === "DRAFT" ? "草稿" : g.planStatus === "ACCEPTED" ? "已接受" : g.planStatus === "SENT" ? "已发送" : g.planStatus}</span>
                <Badge color={g.planStatus === "ACCEPTED" ? "green" : "gray"}>{g._count._all}</Badge>
              </div>
            ))}
            {offerGroups.length === 0 && <p className="text-xs text-ink-3 text-center py-2">暂无 Offer</p>}
          </div>
        </Card>
      </div>
      <p className="text-[11px] text-ink-3 mt-6 text-center">所有指标从数据库实时统计 · 非固定假数据 · 新增/推进流程后指标自动变化</p>
    </div>
  );
}
