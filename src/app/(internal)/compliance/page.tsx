import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState, Icon } from "@/components/ui";
import { shortDate } from "@/lib/utils";

const VERIFY_LABEL: Record<string, { label: string; color: "green" | "amber" | "red" | "gray" }> = {
  VERIFIED: { label: "已核验", color: "green" },
  PENDING: { label: "核验中", color: "amber" },
  FAILED: { label: "核验失败", color: "red" },
  EXPIRED: { label: "已过期", color: "gray" },
  UNKNOWN: { label: "待核验", color: "gray" },
};

export default async function CompliancePage() {
  const [credentials, checks] = await Promise.all([
    prisma.credentialCheck.findMany({ include: { candidate: true, verifiedBy: true }, orderBy: { createdAt: "desc" } }),
    prisma.complianceCheck.findMany({ include: { candidateJob: { include: { candidate: true, job: true } }, checkedBy: true }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <div>
      <PageHeader title="合规复核" desc="执业资质核验、证据核验与合规检查" />

      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3"><Icon name="BadgeCheck" className="w-4 h-4 text-brand" /><h3 className="text-base font-semibold">执业资质核验 <span className="text-ink-3 text-sm">({credentials.length})</span></h3></div>
        {credentials.length === 0 ? (
          <EmptyState icon="BadgeCheck" title="暂无资质核验记录" desc="医生类岗位进入决策前需添加执业资质核验" />
        ) : (
          <table className="w-full">
            <thead><tr><th className="th">候选人</th><th className="th">资质类型</th><th className="th">注册范围</th><th className="th">核验状态</th><th className="th">核验人</th><th className="th">核验时间</th></tr></thead>
            <tbody>
              {credentials.map((c) => {
                const v = VERIFY_LABEL[c.verifyStatus] || VERIFY_LABEL.UNKNOWN;
                return (
                  <tr key={c.id} className="hover:bg-card-2/40">
                    <td className="td"><span className="text-ink font-medium">{c.candidate.name}</span></td>
                    <td className="td text-xs">{c.credentialType}</td>
                    <td className="td text-xs">{c.registeredScope || "—"}</td>
                    <td className="td"><Badge color={v.color}>{v.label}</Badge></td>
                    <td className="td text-xs">{c.verifiedBy?.name || "—"}</td>
                    <td className="td text-xs text-ink-3">{c.verifiedAt ? shortDate(c.verifiedAt) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3"><Icon name="ShieldCheck" className="w-4 h-4 text-brand" /><h3 className="text-base font-semibold">合规检查 <span className="text-ink-3 text-sm">({checks.length})</span></h3></div>
        {checks.length === 0 ? (
          <EmptyState icon="ShieldCheck" title="暂无合规检查记录" />
        ) : (
          <table className="w-full">
            <thead><tr><th className="th">候选人</th><th className="th">岗位</th><th className="th">检查类型</th><th className="th">状态</th><th className="th">结果摘要</th></tr></thead>
            <tbody>
              {checks.map((c) => {
                const v = VERIFY_LABEL[c.status] || VERIFY_LABEL.UNKNOWN;
                return (
                  <tr key={c.id} className="hover:bg-card-2/40">
                    <td className="td"><span className="text-ink font-medium">{c.candidateJob.candidate.name}</span></td>
                    <td className="td text-xs">{c.candidateJob.job.title}</td>
                    <td className="td text-xs">{c.checkType}</td>
                    <td className="td"><Badge color={v.color}>{v.label}</Badge></td>
                    <td className="td text-xs text-ink-3 max-w-xs truncate">{c.resultSummary || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      <p className="text-[11px] text-ink-3 mt-4 text-center">医生类岗位进入决策前必须有资质核验记录 · 关键合规项人工核验留痕</p>
    </div>
  );
}
