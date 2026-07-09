import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader, Card, Badge, EmptyState, Icon } from "@/components/ui";
import { FeedbackForm } from "@/components/FeedbackForm";
import { shortDate } from "@/lib/utils";

const ROUND: Record<string, string> = {
  HR_INITIAL: "HR 初面", MEDICAL_PROFESSIONAL: "医疗专业面",
  CLINIC_MANAGER: "门诊负责人面", CHRO_FINAL: "CHRO/高管终面",
};

export default async function InterviewerTasksPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const assignments = await prisma.interviewAssignment.findMany({
    where: { interviewerId: session.userId },
    include: {
      interview: {
        include: {
          candidateJob: { include: { candidate: true, job: true } },
          feedbacks: { where: { interviewerId: session.userId }, orderBy: { version: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader title="面试任务" desc={`欢迎，${session.name}。这里是你被分配的面试任务`} action={<Badge color="brand">{assignments.length} 个任务</Badge>} />

      {assignments.length === 0 ? (
        <Card><EmptyState icon="ClipboardList" title="暂无面试任务" desc="HR 安排面试后，你的任务将出现在这里" /></Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => {
            const iv = a.interview;
            const c = iv.candidateJob.candidate;
            const job = iv.candidateJob.job;
            const latest = iv.feedbacks[0];
            return (
              <Card key={a.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-ink">{c.name}</span>
                      <Badge color="purple">{ROUND[iv.round] || iv.round}</Badge>
                      {latest && <Badge color="green">已反馈 v{latest.version}</Badge>}
                    </div>
                    <div className="text-xs text-ink-3 mt-1">{job.title} · {c.specialty} · {c.currentOrg}</div>
                    <div className="text-xs text-ink-3 mt-0.5">{iv.scheduledAt ? `面试时间：${shortDate(iv.scheduledAt)}` : "时间待定"} {iv.location ? `· ${iv.location}` : ""}</div>
                  </div>
                </div>
                <FeedbackForm interviewId={iv.id} latest={latest ? { conclusion: latest.conclusion, strengths: latest.strengths, risks: latest.risks, questions: latest.questions, version: latest.version, submittedAt: latest.submittedAt?.toISOString() || null } : null} />
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-[11px] text-ink-3 mt-4 text-center">面试官只能看到分配给自己的任务 · 反馈提交后修改生成新版本，原始保留</p>
    </div>
  );
}
