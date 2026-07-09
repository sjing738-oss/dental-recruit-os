"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select, Badge, Icon } from "@/components/ui";
import { shortDate } from "@/lib/utils";

const DECISION: Record<string, { label: string; color: "green" | "amber" | "blue" | "red" | "purple" }> = {
  recommend: { label: "推荐录用", color: "green" }, cautious: { label: "谨慎录用", color: "amber" },
  hold: { label: "暂缓", color: "blue" }, reject: { label: "淘汰", color: "red" }, transfer: { label: "调岗", color: "purple" },
};
const TIER_LABEL: Record<string, string> = { conservative: "保守稳妥", standard: "标准推荐", aggressive: "争取成交" };

interface Decision { id: string; decision: string; summary: string | null; riskControl: string | null; probationFocus: string | null; approvedAt: string | null; aiOutputId: string | null }
interface OfferOption { id: string; tier: string; salaryFixed: number | null; variableDesc: string | null; benefits: string | null; negotiationScript: string | null }
interface OfferPlan { id: string; planStatus: string; approvalStatus: string; acceptedAt: string | null; options: OfferOption[] }
interface OnboardingTask { id: string; title: string; status: string; candidateVisible: boolean }
interface OnboardingPlan { id: string; startDate: string | null; day30Goal: string | null; day60Goal: string | null; day90Goal: string | null; riskWatch: string | null; planStatus: string; tasks: OnboardingTask[] }

export function DecisionOfferPanel({
  candidateJobId, decision, offerPlan, onboardingPlan, canApprove,
}: {
  candidateJobId: string; decision: Decision | null; offerPlan: OfferPlan | null; onboardingPlan: OnboardingPlan | null; canApprove: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [decisionChoice, setDecisionChoice] = useState("cautious");

  async function call(url: string, key: string, body?: object) {
    setLoading(key);
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json();
      if (!res.ok) alert(data.message);
      else router.refresh();
    } finally { setLoading(""); }
  }

  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold">决策 · Offer · 入职承接</h3>

      {/* 决策 */}
      <div className="p-3 rounded-lg bg-bg-2/50 border border-line">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-ink">雇佣决策</span>
          {decision?.approvedAt ? <Badge color={DECISION[decision.decision]?.color || "gray"}>{DECISION[decision.decision]?.label}</Badge> : decision ? <Badge color="amber">待确认</Badge> : null}
        </div>
        {decision ? (
          <div className="space-y-1.5 text-xs">
            <div className="text-ink-2">{decision.summary}</div>
            {decision.riskControl && <div className="text-ink-3">风险控制：{decision.riskControl}</div>}
            {decision.probationFocus && <div className="text-ink-3">试用期观察：{decision.probationFocus}</div>}
            {!decision.approvedAt && (
              <div className="flex items-center gap-2 mt-2">
                <Select value={decisionChoice} onChange={(e) => setDecisionChoice(e.target.value)} className="!w-32 !py-1">
                  {Object.entries(DECISION).map(([v, d]) => <option key={v} value={v}>{d.label}</option>)}
                </Select>
                <Button disabled={loading === "confirm"} onClick={() => call(`/api/candidate-jobs/${candidateJobId}/decision/confirm`, "confirm", { decision: decisionChoice })} className="!py-1 !text-xs">{loading === "confirm" ? <Icon name="Loader2" className="w-3 h-3 animate-spin" /> : <Icon name="Check" className="w-3 h-3" />}确认决策</Button>
              </div>
            )}
          </div>
        ) : (
          <Button variant="ghost" disabled={loading === "decision"} onClick={() => call(`/api/candidate-jobs/${candidateJobId}/decision/generate`, "decision")} className="!py-1 !text-xs">{loading === "decision" ? <Icon name="Loader2" className="w-3 h-3 animate-spin" /> : <Icon name="Sparkles" className="w-3 h-3" />}生成决策报告</Button>
        )}
      </div>

      {/* Offer */}
      <div className="p-3 rounded-lg bg-bg-2/50 border border-line">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-ink">Offer 方案</span>
          {offerPlan && <Badge color={offerPlan.approvalStatus === "APPROVED" ? "green" : offerPlan.acceptedAt ? "green" : "amber"}>{offerPlan.approvalStatus === "APPROVED" ? "已审批" : offerPlan.planStatus === "ACCEPTED" ? "已接受" : "待审批"}</Badge>}
        </div>
        {!offerPlan ? (
          <Button variant="ghost" disabled={loading === "offer"} onClick={() => call(`/api/candidate-jobs/${candidateJobId}/offer/generate`, "offer")} className="!py-1 !text-xs">{loading === "offer" ? <Icon name="Loader2" className="w-3 h-3 animate-spin" /> : <Icon name="FileText" className="w-3 h-3" />}生成三档 Offer</Button>
        ) : (
          <div className="space-y-2">
            {offerPlan.options.map((o) => (
              <div key={o.id} className="text-xs p-2 rounded bg-bg/40">
                <div className="flex justify-between"><span className="text-ink font-medium">{TIER_LABEL[o.tier] || o.tier}</span><span className="text-brand">{o.salaryFixed}元/月</span></div>
                <div className="text-ink-3 mt-0.5">{o.variableDesc} · {o.benefits}</div>
                <div className="text-ink-3 italic mt-0.5">话术：{o.negotiationScript}</div>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-2">
              {offerPlan.approvalStatus !== "APPROVED" && canApprove && (
                <Button disabled={loading === "approve"} onClick={() => call(`/api/offers/${offerPlan.id}/approve`, "approve")} className="!py-1 !text-xs">{loading === "approve" ? <Icon name="Loader2" className="w-3 h-3 animate-spin" /> : <Icon name="ShieldCheck" className="w-3 h-3" />}审批通过</Button>
              )}
              {offerPlan.approvalStatus === "APPROVED" && offerPlan.planStatus !== "ACCEPTED" && (
                <Button disabled={loading === "accept"} onClick={() => call(`/api/offers/${offerPlan.id}/accept`, "accept")} className="!py-1 !text-xs">{loading === "accept" ? <Icon name="Loader2" className="w-3 h-3 animate-spin" /> : <Icon name="CheckCircle2" className="w-3 h-3" />}标记候选人接受</Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 入职承接 */}
      {onboardingPlan && (
        <div className="p-3 rounded-lg bg-bg-2/50 border border-line">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-ink">入职承接 · 30/60/90 天计划</span>
            <Badge color="green">{onboardingPlan.planStatus === "COMPLETED" ? "已完成" : "进行中"}</Badge>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="text-ink-3">入职日期：{shortDate(onboardingPlan.startDate)}</div>
            <div className="text-ink-2"><span className="text-ink-3">30天：</span>{onboardingPlan.day30Goal}</div>
            <div className="text-ink-2"><span className="text-ink-3">60天：</span>{onboardingPlan.day60Goal}</div>
            <div className="text-ink-2"><span className="text-ink-3">90天：</span>{onboardingPlan.day90Goal}</div>
            {onboardingPlan.riskWatch && <div className="text-amber"><Icon name="AlertTriangle" className="w-3 h-3 inline" /> 试用期观察：{onboardingPlan.riskWatch}</div>}
            <div className="mt-2">
              <div className="text-ink-3 mb-1">入职资料清单：</div>
              <div className="flex flex-wrap gap-1.5">
                {onboardingPlan.tasks.map((t) => (
                  <span key={t.id} className="badge bg-bg/40 text-ink-2"><Icon name={t.status === "COMPLETED" ? "Check" : "Circle"} className="w-3 h-3 inline mr-1" />{t.title}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
