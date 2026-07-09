"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, Icon } from "@/components/ui";
import { shortDate } from "@/lib/utils";

interface Assessment {
  id: string;
  assessmentType: string;
  status: string;
  deadline: string | null;
  submission?: { submittedAt: string | null } | null;
}

export function PortalPanel({
  candidateId,
  candidateJobId,
  assessments,
  tokenCount,
}: {
  candidateId: string;
  candidateJobId: string;
  assessments: Assessment[];
  tokenCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [link, setLink] = useState("");

  async function genToken() {
    setLoading("token");
    try {
      const res = await fetch(`/api/candidates/${candidateId}/portal-token`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        const origin = window.location.origin;
        setLink(`${origin}${data.url}`);
      } else alert(data.message);
    } finally { setLoading(""); }
  }

  async function createAssessment() {
    setLoading("assess");
    try {
      const res = await fetch(`/api/candidate-jobs/${candidateJobId}/assessments`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      const data = await res.json();
      if (res.ok) router.refresh();
      else alert(data.message);
    } finally { setLoading(""); }
  }

  const copyLink = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      alert("链接已复制");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">候选人端与动态测评</h3>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={!!loading} onClick={genToken}>
            {loading === "token" ? <Icon name="Loader2" className="w-4 h-4 animate-spin" /> : <Icon name="Link" className="w-4 h-4" />}生成候选人端链接
          </Button>
          <Button disabled={!!loading} onClick={createAssessment}>
            {loading === "assess" ? <Icon name="Loader2" className="w-4 h-4 animate-spin" /> : <Icon name="FileQuestion" className="w-4 h-4" />}创建测评
          </Button>
        </div>
      </div>

      {link && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bg-2/50 border border-line">
          <Icon name="ExternalLink" className="w-4 h-4 text-brand shrink-0" />
          <input readOnly value={link} className="flex-1 bg-transparent text-xs text-ink-2 outline-none" />
          <Button variant="ghost" onClick={copyLink} className="!py-1 !px-2 !text-xs"><Icon name="Copy" className="w-3.5 h-3.5" />复制</Button>
        </div>
      )}
      {!link && tokenCount > 0 && <p className="text-[11px] text-ink-3">已有 {tokenCount} 个候选人端令牌，可生成新链接</p>}

      <div>
        <div className="text-xs text-ink-3 mb-2">测评任务（{assessments.length}）</div>
        {assessments.length === 0 ? (
          <p className="text-xs text-ink-3 text-center py-3">暂无测评，点击「创建测评」按岗位生成场景题</p>
        ) : (
          <div className="space-y-2">
            {assessments.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-bg-2/50">
                <div>
                  <div className="text-sm text-ink">{a.assessmentType}</div>
                  <div className="text-[10px] text-ink-3">截止 {shortDate(a.deadline)}</div>
                </div>
                <Badge color={a.status === "SUBMITTED" ? "green" : a.status === "REVIEWED" ? "blue" : "amber"}>
                  {a.status === "SUBMITTED" ? "已作答" : a.status === "REVIEWED" ? "已复核" : a.status === "CREATED" ? "待作答" : a.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[11px] text-ink-3">候选人端通过 Token 独立访问，不返回内部评分/AI 风险/薪酬底线</p>
    </div>
  );
}
