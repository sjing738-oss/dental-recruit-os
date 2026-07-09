"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, Icon, Card } from "@/components/ui";

export function TalentRadarForm({ jobs }: { jobs: { id: string; title: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ city: "", specialty: "", level: "", keywords: "", targetCount: 10, jobId: "" });

  function set(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/talent-search/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      alert(data.message || "创建失败");
    }
  }

  if (!open) {
    return <Button onClick={() => setOpen(true)}><Icon name="Plus" className="w-4 h-4" /> 新建搜索任务</Button>;
  }

  return (
    <Card className="mb-4">
      <form onSubmit={submit} className="space-y-4">
        <h3 className="text-base font-semibold">新建人才雷达任务</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><Label>城市</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="如：无锡" /></div>
          <div><Label>专业方向</Label><Input value={form.specialty} onChange={(e) => set("specialty", e.target.value)} placeholder="如：正畸医生" /></div>
          <div><Label>级别</Label><Select value={form.level} onChange={(e) => set("level", e.target.value)}><option value="">不限</option><option value="junior">初级</option><option value="mid">中级</option><option value="senior">高级</option><option value="expert">专家</option></Select></div>
          <div><Label>关键词</Label><Input value={form.keywords} onChange={(e) => set("keywords", e.target.value)} placeholder="机构/技术/认证" /></div>
          <div><Label>目标数量</Label><Input type="number" value={form.targetCount} onChange={(e) => set("targetCount", Number(e.target.value))} /></div>
          <div><Label>关联岗位</Label><Select value={form.jobId} onChange={(e) => set("jobId", e.target.value)}><option value="">不关联</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</Select></div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>{loading ? <><Icon name="Loader2" className="w-4 h-4 animate-spin" />创建中</> : "创建任务"}</Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>取消</Button>
        </div>
      </form>
    </Card>
  );
}

