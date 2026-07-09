import { prisma } from "@/lib/prisma";
import { CandidateForm } from "@/components/CandidateForm";
import { PageHeader, Card } from "@/components/ui";

export default async function NewCandidatePage() {
  const jobs = await prisma.job.findMany({ where: { status: "OPEN" }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader title="新增候选人" desc="录入候选人基础信息，可同时关联岗位入池" />
      <Card>
        <CandidateForm jobs={jobs.map((j) => ({ id: j.id, title: j.title }))} />
      </Card>
    </div>
  );
}
