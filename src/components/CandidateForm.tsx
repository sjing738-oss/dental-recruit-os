"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, Icon } from "@/components/ui";

export function CandidateForm({ jobs }: { jobs: { id: string; title: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", email: "", specialty: "", currentOrg: "",
    city: "", expectedSalary: "", sourceType: "direct", jobId: "",
  });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      router.push("/candidates");
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
          <Label>姓名 *</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div>
          <Label>专业方向</Label>
          <Input value={form.specialty} onChange={(e) => set("specialty", e.target.value)} placeholder="如：正畸医生" />
        </div>
        <div>
          <Label>手机号</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </div>
        <div>
          <Label>邮箱</Label>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
        </div>
        <div>
          <Label>当前机构</Label>
          <Input value={form.currentOrg} onChange={(e) => set("currentOrg", e.target.value)} />
        </div>
        <div>
          <Label>城市</Label>
          <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div>
          <Label>期望薪酬（元/月）</Label>
          <Input type="number" value={form.expectedSalary} onChange={(e) => set("expectedSalary", e.target.value)} />
        </div>
        <div>
          <Label>来源</Label>
          <Select value={form.sourceType} onChange={(e) => set("sourceType", e.target.value)}>
            <option value="direct">直接投递</option>
            <option value="referral">内推</option>
            <option value="talent_radar">人才雷达</option>
            <option value="other">其他</option>
          </Select>
        </div>
      </div>
      <div>
        <Label>关联岗位（创建后直接入池）</Label>
        <Select value={form.jobId} onChange={(e) => set("jobId", e.target.value)}>
          <option value="">暂不关联</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
        </Select>
      </div>
      {error && <div className="flex items-center gap-2 text-xs text-red bg-red/10 border border-red/25 rounded-lg px-3 py-2"><Icon name="AlertCircle" className="w-3.5 h-3.5" />{error}</div>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>{loading ? <><Icon name="Loader2" className="w-4 h-4 animate-spin" />保存中</> : <><Icon name="Save" className="w-4 h-4" />保存候选人</>}</Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>取消</Button>
      </div>
    </form>
  );
}
