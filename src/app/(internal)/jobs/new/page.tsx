import { prisma } from "@/lib/prisma";
import { JobForm } from "@/components/JobForm";
import { PageHeader, Card } from "@/components/ui";

export default async function NewJobPage() {
  const [categories, clinics] = await Promise.all([
    prisma.dictionary.findMany({ where: { type: "job_category", enabled: true }, orderBy: { sort: "asc" } }),
    prisma.clinic.findMany({ where: { status: "active" } }),
  ]);

  return (
    <div>
      <PageHeader title="新建岗位" desc="定义岗位目标、薪酬带宽与招聘优先级" />
      <Card>
        <JobForm categories={categories.map((d) => ({ code: d.code, name: d.name }))} clinics={clinics.map((c) => ({ id: c.id, name: c.name }))} />
      </Card>
    </div>
  );
}
