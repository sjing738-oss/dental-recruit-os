import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { jobScope } from "@/lib/dataScope";
import { PageHeader, Card, Badge, Button, EmptyState, Icon } from "@/components/ui";

const JOB_STATUS: Record<string, { label: string; color: "gray" | "brand" | "amber" | "red" | "green" | "blue" }> = {
  DRAFT: { label: "草稿", color: "gray" },
  OPEN: { label: "招聘中", color: "brand" },
  PAUSED: { label: "暂停", color: "amber" },
  CLOSED: { label: "已关闭", color: "blue" },
  CANCELLED: { label: "已取消", color: "red" },
};
const PRIORITY: Record<string, { label: string; color: "red" | "amber" | "gray" }> = {
  high: { label: "高", color: "red" },
  medium: { label: "中", color: "amber" },
  low: { label: "低", color: "gray" },
};

export default async function JobsPage() {
  const session = await getSession();
  const jobs = await prisma.job.findMany({
    where: jobScope(session!),
    include: { clinic: true, _count: { select: { candidateJobs: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="岗位需求"
        desc="从业务目标定义岗位画像、薪酬带宽与招聘优先级"
        action={<Link href="/jobs/new"><Button><Icon name="Plus" className="w-4 h-4" /> 新建岗位</Button></Link>}
      />
      {jobs.length === 0 ? (
        <Card><EmptyState icon="Briefcase" title="暂无岗位" desc="创建第一个招聘岗位，开始全流程招聘" action={<Link href="/jobs/new"><Button>新建岗位</Button></Link>} /></Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">岗位</th>
                <th className="th">类别</th>
                <th className="th">门诊</th>
                <th className="th">优先级</th>
                <th className="th">薪酬</th>
                <th className="th">候选人</th>
                <th className="th">状态</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => {
                const st = JOB_STATUS[j.status] || JOB_STATUS.DRAFT;
                const pr = PRIORITY[j.priority] || PRIORITY.medium;
                return (
                  <tr key={j.id} className="hover:bg-card-2/40">
                    <td className="td"><span className="text-ink font-medium">{j.title}</span></td>
                    <td className="td">{j.category}</td>
                    <td className="td">{j.clinic?.name || j.region || "—"}</td>
                    <td className="td"><Badge color={pr.color}>{pr.label}</Badge></td>
                    <td className="td">{j.salaryDesc || (j.salaryMin ? `${j.salaryMin}-${j.salaryMax}` : "—")}</td>
                    <td className="td"><span className="text-ink">{j._count.candidateJobs}</span></td>
                    <td className="td"><Badge color={st.color}>{st.label}</Badge></td>
                    <td className="td"><Link href={`/jobs/${j.id}`} className="text-brand hover:underline text-xs">详情 ›</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
