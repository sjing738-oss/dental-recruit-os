"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Badge, Icon } from "@/components/ui";

interface Report {
  id: string;
  aiOutputId: string | null;
  reviewStatus: string;
  matchScore?: number | null;
  strengths?: string | null;
  risks?: string | null;
  missingInfo?: string | null;
  recommendation?: string | null;
  verifiedFacts?: string | null;
  publicClues?: string | null;
  inferences?: string | null;
  questions?: string | null;
  riskLevel?: string | null;
  createdAt: string;
}

function parseArr(s?: string | null): string[] {
  try {
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

const REVIEW_BADGE: Record<string, { label: string; color: "amber" | "green" | "blue" | "red" }> = {
  PENDING_REVIEW: { label: "待复核", color: "amber" },
  CONFIRMED: { label: "已确认", color: "green" },
  REVISED: { label: "已修订", color: "blue" },
  REJECTED: { label: "已驳回", color: "red" },
};

function FourBlocks({ verified, clues, inferences, missing }: { verified: string[]; clues: string[]; inferences: string[]; missing: string[] }) {
  const blocks = [
    { title: "已验证事实", items: verified, color: "text-green", icon: "BadgeCheck" },
    { title: "公开线索", items: clues, color: "text-blue", icon: "Search" },
    { title: "AI 推断", items: inferences, color: "text-amber", icon: "Lightbulb" },
    { title: "待人工核验", items: missing, color: "text-red", icon: "AlertCircle" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 mt-3">
      {blocks.map((b) => (
        <div key={b.title} className="p-2.5 rounded-lg bg-bg-2/50 border border-line">
          <div className={`flex items-center gap-1.5 text-xs font-semibold ${b.color} mb-1.5`}><Icon name={b.icon} className="w-3.5 h-3.5" />{b.title}</div>
          {b.items.length === 0 ? <div className="text-[10px] text-ink-3">—</div> : (
            <ul className="space-y-1">{b.items.map((it, i) => <li key={i} className="text-[11px] text-ink-2 leading-snug">• {it}</li>)}</ul>
          )}
        </div>
      ))}
    </div>
  );
}

function ReviewActions({ aiOutputId, reviewStatus }: { aiOutputId: string | null; reviewStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  if (!aiOutputId) return null;
  if (reviewStatus !== "PENDING_REVIEW") return <Badge color={REVIEW_BADGE[reviewStatus]?.color || "gray"}>{REVIEW_BADGE[reviewStatus]?.label || reviewStatus}</Badge>;

  async function doReview(action: "confirm" | "revise" | "reject") {
    let comment = "";
    if (action === "reject") {
      comment = window.prompt("请输入驳回原因：") || "";
      if (!comment.trim()) { alert("驳回需填写原因"); return; }
    }
    if (action === "revise") {
      comment = window.prompt("请输入修订说明（可选）：") || "";
    }
    setLoading(action);
    try {
      const res = await fetch(`/api/ai-outputs/${aiOutputId}/review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });
      if (res.ok) router.refresh();
      else { const d = await res.json(); alert(d.message); }
    } finally { setLoading(""); }
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button variant="ghost" disabled={!!loading} onClick={() => doReview("confirm")} className="!py-1 !px-2.5 !text-xs">{loading === "confirm" ? <Icon name="Loader2" className="w-3 h-3 animate-spin" /> : <Icon name="Check" className="w-3 h-3" />}确认</Button>
      <Button variant="ghost" disabled={!!loading} onClick={() => doReview("revise")} className="!py-1 !px-2.5 !text-xs">{loading === "revise" ? <Icon name="Loader2" className="w-3 h-3 animate-spin" /> : <Icon name="Edit3" className="w-3 h-3" />}编辑确认</Button>
      <Button variant="danger" disabled={!!loading} onClick={() => doReview("reject")} className="!py-1 !px-2.5 !text-xs">{loading === "reject" ? <Icon name="Loader2" className="w-3 h-3 animate-spin" /> : <Icon name="X" className="w-3 h-3" />}驳回</Button>
    </div>
  );
}

export function AIReportPanel({
  candidateJobId,
  screeningReports,
  footprintReports,
}: {
  candidateJobId: string;
  screeningReports: Report[];
  footprintReports: Report[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  async function gen(type: "screening" | "footprint") {
    setLoading(type);
    try {
      const res = await fetch(`/api/candidate-jobs/${candidateJobId}/${type}/generate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) alert(data.message || "生成失败");
      else router.refresh();
    } finally { setLoading(""); }
  }

  const sr = screeningReports[0];
  const fr = footprintReports[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">AI 评估</h3>
        <div className="flex gap-2">
          <Button variant="ghost" disabled={!!loading} onClick={() => gen("screening")}>{loading === "screening" ? <Icon name="Loader2" className="w-4 h-4 animate-spin" /> : <Icon name="Sparkles" className="w-4 h-4" />}生成初筛报告</Button>
          <Button variant="ghost" disabled={!!loading} onClick={() => gen("footprint")}>{loading === "footprint" ? <Icon name="Loader2" className="w-4 h-4 animate-spin" /> : <Icon name="Globe" className="w-4 h-4" />}生成公开足迹</Button>
        </div>
      </div>
      <p className="text-[11px] text-ink-3 -mt-2">AI 输出默认「待复核」，未复核内容不作为正式决策依据 · 区分已验证事实/公开线索/AI推断/待核验</p>

      {/* 初筛报告 */}
      {sr && (
        <div className="p-3 rounded-lg bg-card-2/40 border border-line">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">初筛报告</span>
              {sr.matchScore != null && <Badge color="brand">匹配度 {sr.matchScore}</Badge>}
            </div>
            <ReviewActions aiOutputId={sr.aiOutputId} reviewStatus={sr.reviewStatus} />
          </div>
          {sr.recommendation && <p className="text-xs text-ink-2 mt-1">建议：{sr.recommendation}</p>}
          <FourBlocks verified={parseArr(sr.strengths)} clues={[]} inferences={[]} missing={parseArr(sr.missingInfo).concat(parseArr(sr.risks))} />
        </div>
      )}

      {/* 公开足迹报告 */}
      {fr && (
        <div className="p-3 rounded-lg bg-card-2/40 border border-line">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">公开足迹报告</span>
              <Badge color={fr.riskLevel === "RED" ? "red" : fr.riskLevel === "YELLOW" ? "amber" : "green"}>风险 {fr.riskLevel || "GREEN"}</Badge>
            </div>
            <ReviewActions aiOutputId={fr.aiOutputId} reviewStatus={fr.reviewStatus} />
          </div>
          <FourBlocks verified={parseArr(fr.verifiedFacts)} clues={parseArr(fr.publicClues)} inferences={parseArr(fr.inferences)} missing={parseArr(fr.questions)} />
        </div>
      )}

      {!sr && !fr && (
        <div className="text-center py-8 text-sm text-ink-3">暂无 AI 报告，点击上方按钮生成（生成公开足迹需先在 360 档案补充证据）</div>
      )}
    </div>
  );
}
