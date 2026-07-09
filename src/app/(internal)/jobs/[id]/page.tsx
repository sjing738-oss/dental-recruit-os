import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, Button, EmptyState, Icon } from "@/components/ui";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/workflow";

const JOB_STATUS: Record<string, { label: string; color: "gray" | "brand" | "amber" | "blue" | "red" }> = {
  DRAFT: { label: "草稿", color: "gray" }, OPEN: { label: "招聘中", color: "brand" },
  PAUSED: { label: "暂停", color: "amber" }, CLOSED: { label: "已关闭", color: "blue" }, CANCELLED: { label: "已取消", color: "red" },
};

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: { clinic: true, owner: true, profile: true, candidateJobs: { include: { candidate: true }, orderBy: { enteredAt: "desc" } } },
  });

  if (!job) {
    return <Card><EmptyState icon="AlertCircle" title="岗位不存在" action={<Link href="/jobs"><Button>返回列表</Button></Link>} /></Card>;
  }

  const st = JOB_STATUS[job.status] || JOB_STATUS.DRAFT;

  return (
    <div>
      <PageHeader
        title={job.title}
        desc={`${job.category} · ${job.clinic?.name || job.region || ""}`}
        action={
          <span className="flex items-center gap-2">
            <Badge color={st.color}>{st.label}</Badge>
            <Link href="/jobs"><Button variant="ghost"><Icon name="ArrowLeft" className="w-4 h-4" />返回</Button></Link>
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card><div className="text-xs text-ink-3 mb-1">招聘人数</div><div className="text-lg font-bold text-ink">{job.headcount}</div></Card>
        <Card><div className="text-xs text-ink-3 mb-1">薪酬带宽</div><div className="text-lg font-bold text-ink">{job.salaryDesc || (job.salaryMin ? `${job.salaryMin}-${job.salaryMax}元` : "未设置")}</div></Card>
        <Card><div className="text-xs text-ink-3 mb-1">负责人</div><div className="text-lg font-bold text-ink">{job.owner?.name || "—"}</div></Card>
      </div>

      {job.reason && (
        <Card className="mb-4">
          <div className="text-xs text-ink-3 mb-1">招聘原因 / 业务目标</div>
          <p className="text-sm text-ink-2">{job.reason}</p>
        </Card>
      )}

      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold">岗位画像</h3>
          <Badge color="amber">P5 阶段 AI 生成</Badge>
        </div>
        {job.profile ? (
          <div className="text-sm text-ink-2 space-y-2">
            {job.profile.businessGoal && <div><span className="text-ink-3">业务目标：</span>{job.profile.businessGoal}</div>}
            {job.profile.responsibilities && <div><span className="text-ink-3">核心职责：</span>{job.profile.responsibilities}</div>}
          </div>
        ) : (
          <EmptyState icon="Sparkles" title="岗位画像待生成" desc="将在 P5 阶段接入 AI 生成岗位画像、JD、胜任力模型与筛选标准" />
        )}
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-line">
          <h3 className="text-base font-semibold">关联候选人 <span className="text-ink-3 text-sm">({job.candidateJobs.length})</span></h3>
        </div>
        {job.candidateJobs.length === 0 ? (
          <EmptyState icon="Users" title="暂无候选人" desc="通过人才雷达或手动添加候选人到此岗位" />
        ) : (
          <table className="w-full">
            <thead><tr><th className="th">候选人</th><th className="th">专业方向</th><th className="th">当前机构</th><th className="th">状态</th><th className="th"></th></tr></thead>
            <tbody>
              {job.candidateJobs.map((cj) => (
                <tr key={cj.id} className="hover:bg-card-2/40">
                  <td className="td"><span className="text-ink font-medium">{cj.candidate.name}</span></td>
                  <td className="td">{cj.candidate.specialty || "—"}</td>
                  <td className="td">{cj.candidate.currentOrg || "—"}</td>
                  <td className="td"><Badge color={(STATUS_COLORS[cj.status] as any) || "gray"}>{STATUS_LABELS[cj.status] || cj.status}</Badge></td>
                  <td className="td"><Link href={`/candidates/${cj.candidate.id}`} className="text-brand hover:underline text-xs">360档案 ›</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
