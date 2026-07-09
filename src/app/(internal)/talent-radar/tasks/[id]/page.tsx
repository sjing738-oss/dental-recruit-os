import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, Button, EmptyState, Icon } from "@/components/ui";
import { TaskRunActions } from "@/components/TaskRunActions";

export default async function TaskDetailPage({ params }: { params: { id: string } }) {
  const task = await prisma.talentSearchTask.findUnique({
    where: { id: params.id },
    include: { job: true, results: { orderBy: { createdAt: "desc" } } },
  });

  if (!task) {
    return <Card><EmptyState icon="AlertCircle" title="任务不存在" action={<Link href="/talent-radar"><Button>返回列表</Button></Link>} /></Card>;
  }

  let strategy: any = null;
  try {
    strategy = task.strategyJson ? JSON.parse(task.strategyJson) : null;
  } catch {
    strategy = null;
  }

  return (
    <div>
      <PageHeader
        title={`搜索任务 · ${task.specialty || task.keywords || "未命名"}`}
        desc={`${task.city || "不限城市"} · ${task.level || "不限级别"} · 目标 ${task.targetCount} 人`}
        action={<Link href="/talent-radar"><Button variant="ghost"><Icon name="ArrowLeft" className="w-4 h-4" />返回</Button></Link>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card><div className="text-xs text-ink-3 mb-1">城市</div><div className="text-sm font-semibold text-ink">{task.city || "不限"}</div></Card>
        <Card><div className="text-xs text-ink-3 mb-1">专业方向</div><div className="text-sm font-semibold text-ink">{task.specialty || "不限"}</div></Card>
        <Card><div className="text-xs text-ink-3 mb-1">关联岗位</div><div className="text-sm font-semibold text-ink">{task.job?.title || "未关联"}</div></Card>
      </div>

      {strategy && (
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3"><Icon name="Lightbulb" className="w-4 h-4 text-amber" /><h3 className="text-base font-semibold">AI 搜索策略</h3><Badge color="amber">Mock</Badge></div>
          <div className="space-y-2 text-sm">
            {strategy.keywords && <div><span className="text-ink-3">关键词组合：</span><span className="text-ink-2">{strategy.keywords}</span></div>}
            {strategy.channels && <div><span className="text-ink-3">推荐渠道：</span><span className="text-ink-2">{strategy.channels.join("、")}</span></div>}
            {strategy.targetProfile && <div><span className="text-ink-3">目标画像：</span><span className="text-ink-2">{strategy.targetProfile}</span></div>}
          </div>
        </Card>
      )}

      <Card>
        <TaskRunActions
          taskId={task.id}
          status={task.status}
          jobId={task.jobId}
          results={task.results.map((r) => ({
            id: r.id, name: r.name, currentOrg: r.currentOrg || "", specialty: r.specialty || "",
            reason: r.reason || "", credibility: r.credibility, contactPriority: r.contactPriority,
            convertedCandidateId: r.convertedCandidateId,
          }))}
        />
      </Card>
      <p className="text-[11px] text-ink-3 mt-4 text-center">转候选人时自动带入来源证据（Evidence），符合 PRD 7.3 要求</p>
    </div>
  );
}
