import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, EmptyState, Icon } from "@/components/ui";
import { TalentRadarForm } from "@/components/TalentRadarForm";
import Link from "next/link";

const STATUS: Record<string, { label: string; color: "gray" | "brand" | "amber" | "green" | "red" }> = {
  created: { label: "待运行", color: "gray" },
  running: { label: "搜索中", color: "brand" },
  completed: { label: "已完成", color: "green" },
  failed: { label: "失败", color: "red" },
};

export default async function TalentRadarPage() {
  const [tasks, jobs] = await Promise.all([
    prisma.talentSearchTask.findMany({ include: { job: true, _count: { select: { results: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.job.findMany({ where: { status: "OPEN" } }),
  ]);

  return (
    <div>
      <PageHeader title="人才雷达" desc="围绕城市、专长、机构与公开专业足迹主动发现口腔医疗人才" />
      <TalentRadarForm jobs={jobs.map((j) => ({ id: j.id, title: j.title }))} />

      {tasks.length === 0 ? (
        <Card><EmptyState icon="Radar" title="暂无搜索任务" desc="创建一个人才雷达任务，主动发现潜在口腔医疗人才" /></Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full">
            <thead><tr><th className="th">任务</th><th className="th">城市</th><th className="th">专业方向</th><th className="th">关联岗位</th><th className="th">结果数</th><th className="th">状态</th><th className="th"></th></tr></thead>
            <tbody>
              {tasks.map((t) => {
                const st = STATUS[t.status] || STATUS.created;
                return (
                  <tr key={t.id} className="hover:bg-card-2/40">
                    <td className="td"><span className="text-ink font-medium">{t.specialty || t.keywords || "搜索任务"}</span><div className="text-[10px] text-ink-3">{new Date(t.createdAt).toLocaleDateString("zh-CN")}</div></td>
                    <td className="td">{t.city || "不限"}</td>
                    <td className="td">{t.specialty || "—"}</td>
                    <td className="td">{t.job?.title || "—"}</td>
                    <td className="td"><span className="text-ink">{t._count.results}</span></td>
                    <td className="td"><Badge color={st.color}>{st.label}</Badge></td>
                    <td className="td"><Link href={`/talent-radar/tasks/${t.id}`} className="text-brand hover:underline text-xs">详情 ›</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
      <p className="text-[11px] text-ink-3 mt-4">首版使用 Mock Provider，接口与数据结构真实，后续可替换为真实搜索源</p>
    </div>
  );
}
