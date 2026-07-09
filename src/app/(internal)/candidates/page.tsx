import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { candidateScope } from "@/lib/dataScope";
import { PageHeader, Card, Badge, Button, EmptyState, Icon } from "@/components/ui";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/status";
import { maskPhone } from "@/lib/utils";

export default async function CandidatesPage() {
  const session = await getSession();
  const candidates = await prisma.candidate.findMany({
    where: candidateScope(session!),
    include: { owner: true, candidateJobs: { include: { job: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="候选人管理"
        desc="管理候选人全生命周期，沉淀 360 档案与证据链"
        action={<Link href="/candidates/new"><Button><Icon name="UserPlus" className="w-4 h-4" /> 新增候选人</Button></Link>}
      />
      {candidates.length === 0 ? (
        <Card><EmptyState icon="Users" title="暂无候选人" desc="通过人才雷达或手动添加候选人" action={<Link href="/candidates/new"><Button>新增候选人</Button></Link>} /></Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="th">候选人</th>
                <th className="th">专业方向</th>
                <th className="th">当前机构</th>
                <th className="th">城市</th>
                <th className="th">关联岗位</th>
                <th className="th">当前状态</th>
                <th className="th">负责人</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => {
                const cj = c.candidateJobs[0];
                const status = cj?.status;
                return (
                  <tr key={c.id} className="hover:bg-card-2/40">
                    <td className="td">
                      <div className="text-ink font-medium">{c.name}</div>
                      <div className="text-[10px] text-ink-3">{maskPhone(c.phone)}</div>
                    </td>
                    <td className="td">{c.specialty || "—"}</td>
                    <td className="td">{c.currentOrg || "—"}</td>
                    <td className="td">{c.city || "—"}</td>
                    <td className="td">{cj?.job?.title || "—"}</td>
                    <td className="td">{status ? <Badge color={(STATUS_COLORS[status] as any) || "gray"}>{STATUS_LABELS[status] || status}</Badge> : <span className="text-ink-3">未关联</span>}</td>
                    <td className="td">{c.owner?.name || "—"}</td>
                    <td className="td"><Link href={`/candidates/${c.id}`} className="text-brand hover:underline text-xs">360档案 ›</Link></td>
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
