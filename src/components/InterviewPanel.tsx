"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select, Input, Label, Badge, Icon } from "@/components/ui";
import { shortDate } from "@/lib/utils";

const ROUNDS = [
  { value: "HR_INITIAL", label: "HR 初面" },
  { value: "MEDICAL_PROFESSIONAL", label: "医疗专业面" },
  { value: "CLINIC_MANAGER", label: "门诊负责人面" },
  { value: "CHRO_FINAL", label: "CHRO/高管终面" },
];
const CON_LABEL: Record<string, string> = { recommend: "推荐录用", cautious: "谨慎录用", hold: "暂缓", reject: "不推荐" };
const CON_COLOR: Record<string, "green" | "amber" | "blue" | "red"> = { recommend: "green", cautious: "amber", hold: "blue", reject: "red" };

interface Feedback { interviewerId: string | null; conclusion: string; strengths: string | null; risks: string | null; version: number }
interface InterviewItem {
  id: string; round: string; scheduledAt: string | null; location: string | null; status: string;
  feedbacks: Feedback[];
  assignments: { interviewer: { name: string } | null }[];
}

export function InterviewPanel({
  candidateJobId,
  interviews,
  interviewers,
}: {
  candidateJobId: string;
  interviews: InterviewItem[];
  interviewers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ round: "HR_INITIAL", scheduledAt: "", location: "", interviewerId: "" });

  async function schedule(e: React.FormEvent) {
    e.preventDefault();
    if (!form.interviewerId) { alert("请选择面试官"); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/candidate-jobs/${candidateJobId}/interviews`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, scheduledAt: form.scheduledAt || null, interviewerIds: [form.interviewerId] }),
      });
      const data = await res.json();
      if (res.ok) { setOpen(false); router.refresh(); }
      else alert(data.message);
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">面试协同</h3>
        <Button variant="ghost" onClick={() => setOpen(!open)}><Icon name="Plus" className="w-4 h-4" />安排面试</Button>
      </div>

      {open && (
        <form onSubmit={schedule} className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg bg-bg-2/50 border border-line">
          <div><Label>面试轮次</Label><Select value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })}>{ROUNDS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></div>
          <div><Label>面试官</Label><Select value={form.interviewerId} onChange={(e) => setForm({ ...form, interviewerId: e.target.value })}><option value="">请选择</option>{interviewers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></div>
          <div><Label>面试时间</Label><Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></div>
          <div><Label>地点/会议链接</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="门诊或视频链接" /></div>
          <div className="col-span-2"><Button type="submit" disabled={loading}>{loading ? <Icon name="Loader2" className="w-4 h-4 animate-spin" /> : "创建面试任务"}</Button></div>
        </form>
      )}

      {interviews.length === 0 ? (
        <p className="text-xs text-ink-3 text-center py-4">暂无面试安排，点击「安排面试」创建</p>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => {
            const conclusions = iv.feedbacks.map((f) => f.conclusion);
            const allSame = conclusions.length > 0 && conclusions.every((c) => c === conclusions[0]);
            return (
              <div key={iv.id} className="p-3 rounded-lg bg-bg-2/50 border border-line">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge color="purple">{ROUNDS.find((r) => r.value === iv.round)?.label || iv.round}</Badge>
                    <span className="text-xs text-ink-3">{iv.scheduledAt ? shortDate(iv.scheduledAt) : "时间待定"}</span>
                  </div>
                  {iv.feedbacks.length > 0 && (
                    <Badge color={allSame ? "green" : "amber"}>{allSame ? "面试官共识" : "存在分歧"}</Badge>
                  )}
                </div>
                <div className="text-[11px] text-ink-3 mb-2">面试官：{iv.assignments.map((a) => a.interviewer?.name).filter(Boolean).join("、") || "未分配"}</div>
                {iv.feedbacks.length === 0 ? (
                  <p className="text-xs text-ink-3">等待面试官提交反馈</p>
                ) : (
                  <div className="space-y-1.5">
                    {iv.feedbacks.map((f, i) => (
                      <div key={i} className="text-xs flex items-start gap-2">
                        <Badge color={CON_COLOR[f.conclusion] || "gray"}>{CON_LABEL[f.conclusion] || f.conclusion}</Badge>
                        <span className="text-ink-2 flex-1">{f.strengths || f.risks || "—"} <span className="text-ink-3">v{f.version}</span></span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
