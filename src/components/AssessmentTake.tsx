"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";

interface Question {
  title: string;
  prompt: string;
}

export function AssessmentTake({
  token,
  assessmentId,
  questions,
  submitted,
}: {
  token: string;
  assessmentId: string;
  questions: Question[];
  submitted: boolean;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(submitted);

  async function submit() {
    if (questions.some((_, i) => !answers[i]?.trim())) {
      alert("请完成所有题目作答");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/portal/${token}/assessments/${assessmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (res.ok) setDone(true);
      else alert(data.message || "提交失败");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-green py-2">
        <Icon name="CheckCircle2" className="w-4 h-4" /> 已提交作答，请等待 HR 与评估人员复核
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <div key={i}>
          <div className="text-sm font-semibold text-ink mb-1">题目 {i + 1}：{q.title}</div>
          <div className="text-xs text-ink-3 mb-2 leading-relaxed">{q.prompt}</div>
          <textarea
            value={answers[i] || ""}
            onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
            className="input min-h-[140px] resize-y"
            placeholder="请在此作答，支持长文本…"
          />
        </div>
      ))}
      <Button onClick={submit} disabled={loading} className="w-full">
        {loading ? <><Icon name="Loader2" className="w-4 h-4 animate-spin" />提交中</> : <><Icon name="Send" className="w-4 h-4" />提交作答</>}
      </Button>
    </div>
  );
}
