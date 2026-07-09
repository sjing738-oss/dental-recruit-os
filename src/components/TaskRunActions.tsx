"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, Icon } from "@/components/ui";

interface ResultItem {
  id: string;
  name: string;
  currentOrg: string;
  specialty: string;
  reason: string;
  credibility: string;
  contactPriority: string;
  convertedCandidateId: string | null;
}

const CRED_COLOR: Record<string, "green" | "amber" | "red" | "gray"> = {
  HIGH: "green", MEDIUM: "amber", LOW: "red", UNKNOWN: "gray",
};

export function TaskRunActions({
  taskId,
  status,
  jobId,
  results,
}: {
  taskId: string;
  status: string;
  jobId: string | null;
  results: ResultItem[];
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [converting, setConverting] = useState("");

  async function run() {
    setRunning(true);
    try {
      const res = await fetch(`/api/talent-search/tasks/${taskId}/run`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) alert(data.message || "运行失败");
      else router.refresh();
    } finally {
      setRunning(false);
    }
  }

  async function convert(id: string) {
    setConverting(id);
    try {
      const res = await fetch(`/api/talent-search/results/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) alert(data.message || "转换失败");
      else router.refresh();
    } finally {
      setConverting("");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">搜索结果 <span className="text-ink-3 text-sm">({results.length})</span></h3>
        <Button onClick={run} disabled={running || status === "running"}>
          {running ? <><Icon name="Loader2" className="w-4 h-4 animate-spin" />搜索中</> : <><Icon name="Search" className="w-4 h-4" />{status === "completed" ? "重新搜索" : "运行搜索"}</>}
        </Button>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-10 text-sm text-ink-3">点击「运行搜索」获取人才线索（Mock Provider）</div>
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-bg-2/50 border border-line">
              <div className="w-9 h-9 rounded-full bg-purple/15 text-purple flex items-center justify-center text-sm font-bold shrink-0">{r.name.slice(0, 1)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{r.name}</span>
                  <Badge color={CRED_COLOR[r.credibility] || "gray"}>{r.credibility}</Badge>
                  {r.contactPriority === "high" && <Badge color="red">优先触达</Badge>}
                </div>
                <div className="text-xs text-ink-2 mt-0.5">{r.specialty} · {r.currentOrg}</div>
                <div className="text-xs text-ink-3 mt-1">{r.reason}</div>
              </div>
              <div className="shrink-0">
                {r.convertedCandidateId ? (
                  <Badge color="green"><Icon name="Check" className="w-3 h-3 inline" />已转候选人</Badge>
                ) : (
                  <Button variant="ghost" disabled={converting === r.id} onClick={() => convert(r.id)} className="!py-1.5 !px-3 !text-xs">
                    {converting === r.id ? <Icon name="Loader2" className="w-3.5 h-3.5 animate-spin" /> : <Icon name="UserPlus" className="w-3.5 h-3.5" />}
                    转候选人
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
