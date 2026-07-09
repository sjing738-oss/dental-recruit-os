"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select, Textarea, Label, Icon, Badge } from "@/components/ui";

const CONCLUSIONS = [
  { value: "recommend", label: "推荐录用" },
  { value: "cautious", label: "谨慎录用" },
  { value: "hold", label: "暂缓" },
  { value: "reject", label: "不推荐" },
];
const CON_COLOR: Record<string, "green" | "amber" | "blue" | "red"> = {
  recommend: "green", cautious: "amber", hold: "blue", reject: "red",
};

interface LatestFeedback {
  conclusion: string | null;
  strengths: string | null;
  risks: string | null;
  questions: string | null;
  version: number;
  submittedAt: string | null;
}

export function FeedbackForm({ interviewId, latest }: { interviewId: string; latest: LatestFeedback | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    conclusion: latest?.conclusion || "",
    strengths: latest?.strengths || "",
    risks: latest?.risks || "",
    questions: latest?.questions || "",
  });

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.conclusion) { alert("请选择面试结论"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}/feedback`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) router.refresh();
      else alert(data.message);
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3 mt-3">
      {latest && (
        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink-3">已提交反馈</span>
          <Badge color={CON_COLOR[latest.conclusion || ""] || "gray"}>{CONCLUSIONS.find((c) => c.value === latest.conclusion)?.label || latest.conclusion || "—"} · v{latest.version}</Badge>
        </div>
      )}
      <div>
        <Label>面试结论 *</Label>
        <Select value={form.conclusion} onChange={(e) => set("conclusion", e.target.value)} required>
          <option value="">请选择</option>
          {CONCLUSIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </div>
      <div><Label>候选人优势</Label><Textarea value={form.strengths} onChange={(e) => set("strengths", e.target.value)} placeholder="专业能力、病例经验、沟通…" /></div>
      <div><Label>风险与顾虑</Label><Textarea value={form.risks} onChange={(e) => set("risks", e.target.value)} placeholder="资质、文化适配、专业风险…" /></div>
      <div><Label>待追问 / 疑问</Label><Textarea value={form.questions} onChange={(e) => set("questions", e.target.value)} /></div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>{loading ? <><Icon name="Loader2" className="w-4 h-4 animate-spin" />提交中</> : <><Icon name="Send" className="w-4 h-4" />{latest ? "提交新版本" : "提交反馈"}</>}</Button>
        {latest && <span className="text-[11px] text-ink-3">再次提交生成新版本，原始反馈保留</span>}
      </div>
    </form>
  );
}
