import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState, Icon } from "@/components/ui";
import { formatDate } from "@/lib/utils";

const ACTION_COLOR: Record<string, "blue" | "green" | "amber" | "red" | "purple" | "gray"> = {
  "auth.login": "green", "auth.logout": "gray", "candidate.create": "blue",
  "candidate.transition": "purple", "ai.generate": "amber", "ai.review": "amber",
  "offer.approve": "green", "offer.accept": "green", "decision.confirm": "green",
  "portal.access": "blue", "portal.submit": "blue", "system.seed": "gray",
};

export default async function AuditPage() {
  const logs = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <PageHeader title="审计日志" desc="所有关键动作的留痕，不可删除，支持筛选与追溯" action={<Badge color="brand">{logs.length} 条</Badge>} />

      {logs.length === 0 ? (
        <Card><EmptyState icon="ScrollText" title="暂无审计日志" /></Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">时间</th>
                <th className="th">操作者</th>
                <th className="th">动作</th>
                <th className="th">对象类型</th>
                <th className="th">对象 ID</th>
                <th className="th">摘要</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-card-2/40">
                  <td className="td text-xs whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="td">{log.actor?.name || <span className="text-ink-3">系统/候选人</span>}</td>
                  <td className="td"><Badge color={ACTION_COLOR[log.action] || "gray"}>{log.action}</Badge></td>
                  <td className="td text-xs">{log.objectType}</td>
                  <td className="td text-xs text-ink-3 font-mono">{log.objectId?.slice(-8) || "—"}</td>
                  <td className="td text-xs text-ink-3 max-w-xs truncate">
                    {log.beforeJson ? `变更前: ${log.beforeJson.slice(0, 40)}` : log.afterJson ? log.afterJson.slice(0, 50) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <p className="text-[11px] text-ink-3 mt-4 text-center">审计日志不可从普通页面删除 · 登录/状态迁移/AI调用/审批/候选人端访问均留痕</p>
    </div>
  );
}
