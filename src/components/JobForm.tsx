"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, Textarea, Icon } from "@/components/ui";

export function JobForm({
  categories,
  clinics,
}: {
  categories: { code: string; name: string }[];
  clinics: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "", category: "", clinicId: "", region: "", headcount: 1,
    priority: "medium", reason: "", salaryMin: "", salaryMax: "", salaryDesc: "",
  });

  function set(k: string, v: string | number) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      router.push("/jobs");
      router.refresh();
    } else {
      setError(data.message || "创建失败");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>岗位名称 *</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="如：正畸医生" required />
        </div>
        <div>
          <Label>岗位类别 *</Label>
          <Select value={form.category} onChange={(e) => set("category", e.target.value)} required>
            <option value="">请选择</option>
            {categories.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label>所属门诊</Label>
          <Select value={form.clinicId} onChange={(e) => set("clinicId", e.target.value)}>
            <option value="">不限</option>
            {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label>区域</Label>
          <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="如：无锡" />
        </div>
        <div>
          <Label>招聘人数</Label>
          <Input type="number" value={form.headcount} onChange={(e) => set("headcount", Number(e.target.value))} />
        </div>
        <div>
          <Label>优先级</Label>
          <Select value={form.priority} onChange={(e) => set("priority", e.target.value)}>
            <option value="high">高</option>
            <option value="medium">中</option>
            <option value="low">低</option>
          </Select>
        </div>
        <div>
          <Label>薪酬下限（元/月）</Label>
          <Input type="number" value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} placeholder="如 25000" />
        </div>
        <div>
          <Label>薪酬上限（元/月）</Label>
          <Input type="number" value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} placeholder="如 45000" />
        </div>
      </div>
      <div>
        <Label>薪酬说明</Label>
        <Input value={form.salaryDesc} onChange={(e) => set("salaryDesc", e.target.value)} placeholder="如 25k-45k/月 + 绩效" />
      </div>
      <div>
        <Label>招聘原因 / 业务目标</Label>
        <Textarea value={form.reason} onChange={(e) => set("reason", e.target.value)} placeholder="如：补强正畸业务，提升复杂病例承接能力" />
      </div>
      {error && <div className="flex items-center gap-2 text-xs text-red bg-red/10 border border-red/25 rounded-lg px-3 py-2"><Icon name="AlertCircle" className="w-3.5 h-3.5" />{error}</div>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? <><Icon name="Loader2" className="w-4 h-4 animate-spin" />保存中</> : <><Icon name="Save" className="w-4 h-4" />保存岗位</>}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>取消</Button>
      </div>
      <p className="text-xs text-ink-3">岗位创建后为「草稿」状态，确认岗位画像后可发布为「招聘中」</p>
    </form>
  );
}
