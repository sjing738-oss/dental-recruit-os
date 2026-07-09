"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Icon } from "@/components/ui";

// 候选人状态迁移操作 —— 调用 transition API，走状态机服务
export function CandidateActions({
  candidateJobId,
  nextOptions,
}: {
  candidateJobId: string;
  nextOptions: { status: string; label: string; color: string }[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  async function doTransition(to: string) {
    let reason = "";
    if (to === "REJECTED") {
      reason = window.prompt("请输入淘汰原因（必填）：") || "";
      if (!reason.trim()) {
        alert("淘汰必须填写原因");
        return;
      }
    }
    setLoading(to);
    try {
      const res = await fetch(`/api/candidate-jobs/${candidateJobId}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: to, reason, action: `advance_to_${to}` }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "迁移失败");
      } else {
        router.refresh();
      }
    } catch {
      alert("网络错误");
    } finally {
      setLoading("");
    }
  }

  if (nextOptions.length === 0) {
    return <div className="text-xs text-ink-3 flex items-center gap-1"><Icon name="CheckCircle2" className="w-3.5 h-3.5 text-green" />当前为终态，无可执行迁移</div>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {nextOptions.map((o) => (
        <Button
          key={o.status}
          variant={o.status === "REJECTED" ? "danger" : "ghost"}
          disabled={loading === o.status}
          onClick={() => doTransition(o.status)}
        >
          {loading === o.status ? <Icon name="Loader2" className="w-4 h-4 animate-spin" /> : <Icon name="ArrowRight" className="w-4 h-4" />}
          {o.label}
        </Button>
      ))}
    </div>
  );
}
