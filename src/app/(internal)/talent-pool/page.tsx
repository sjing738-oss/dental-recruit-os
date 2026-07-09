import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState, Button, Icon } from "@/components/ui";

const TIER: Record<string, { label: string; color: "green" | "blue" | "amber" | "gray" }> = {
  A: { label: "A 高价值·短期可触达", color: "green" },
  B: { label: "B 中期维护", color: "blue" },
  C: { label: "C 长期观察", color: "amber" },
  D: { label: "D 暂不维护", color: "gray" },
};

export default async function TalentPoolPage() {
  // 展示人才库状态或已淘汰的候选人（可作为人才资产维护/二次激活）
  const candidateJobs = await prisma.candidateJob.findMany({
    where: { status: { in: ["TALENT_POOL", "REJECTED"] } },
    include: { candidate: true, job: true },
    orderBy: { enteredAt: "desc" },
  });

  const poolRecords = await prisma.talentPool.findMany({
    include: { candidate: true },
  });
  const poolMap = new Map(poolRecords.map((p) => [p.candidateId, p]));

  return (
    <div>
      <PageHeader title="人才库" desc="沉淀未录用但有价值的人才，长期维护与二次激活" />

      {candidateJobs.length === 0 ? (
        <Card><EmptyState icon="Database" title="人才库暂无记录" desc="候选人进入「人才库」或「已淘汰」状态后将在此展示，可二次激活匹配岗位" /></Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full">
            <thead><tr><th className="th">候选人</th><th className="th">专业方向</th><th className="th">城市</th><th className="th">原岗位</th><th className="th">分层</th><th className="th">状态</th><th className="th"></th></tr></thead>
            <tbody>
              {candidateJobs.map((cj) => {
                const tp = poolMap.get(cj.candidateId);
                const tier = tp?.tier || "B";
                const t = TIER[tier] || TIER.B;
                return (
                  <tr key={cj.id} className="hover:bg-card-2/40">
                    <td className="td"><span className="text-ink font-medium">{cj.candidate.name}</span></td>
                    <td className="td">{cj.candidate.specialty || "—"}</td>
                    <td className="td">{cj.candidate.city || "—"}</td>
                    <td className="td">{cj.job?.title || "—"}</td>
                    <td className="td"><Badge color={t.color}>{tier}</Badge></td>
                    <td className="td"><Badge color={cj.status === "TALENT_POOL" ? "blue" : "gray"}>{cj.status === "TALENT_POOL" ? "人才库" : "已淘汰"}</Badge></td>
                    <td className="td"><Link href={`/candidates/${cj.candidate.id}`} className="text-brand hover:underline text-xs">查看 ›</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <p className="text-[11px] text-ink-3 mt-4">人才分层 A/B/C/D · 在候选人 360 档案可将其重新激活至「已入池」状态</p>
    </div>
  );
}
