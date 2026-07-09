"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Icon } from "@/components/ui";

const demoAccounts = [
  { email: "admin@example.com", label: "系统管理员", color: "text-brand" },
  { email: "group_hr@example.com", label: "集团HR负责人", color: "text-purple" },
  { email: "region_hr@example.com", label: "区域HR", color: "text-blue" },
  { email: "recruiter@example.com", label: "招聘HR", color: "text-teal" },
  { email: "medical@example.com", label: "医疗负责人", color: "text-green" },
  { email: "interviewer@example.com", label: "面试官", color: "text-amber" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "登录失败");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  function fill(acc: { email: string }) {
    setEmail(acc.email);
    setPassword("123456");
    setError("");
  }

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] bg-gradient-to-br from-bg2 via-card to-bg border-r border-line p-12 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-brand/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-10 w-72 h-72 bg-purple/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand to-brand-2 flex items-center justify-center">
            <Icon name="Stethoscope" className="w-6 h-6 text-[#06121a]" />
          </div>
          <div>
            <div className="text-base font-bold">Dental Talent Acquisition OS</div>
            <div className="text-xs text-ink-3 tracking-wide">dental_recruit_os · 口腔医疗招聘全流程智能工作台</div>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight mb-3">
            从岗位需求到入职承接的<br />
            <span className="bg-gradient-to-r from-brand to-brand-2 bg-clip-text text-transparent">AI 招聘全流程闭环</span>
          </h1>
          <p className="text-sm text-ink-2 mb-8 leading-relaxed">
            将人才雷达、公开足迹评估、动态测评、面试协同、Offer 优化与入职融入，工程化为可审计、可复盘的业务系统。
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "ShieldCheck", t: "证据链优先", d: "AI 辅助·人做决定" },
              { icon: "Workflow", t: "状态机驱动", d: "全流程留痕审计" },
              { icon: "Lock", t: "权限最小化", d: "候选人端隔离" },
              { icon: "LineChart", t: "数据看板", d: "真实统计下钻" },
            ].map((f) => (
              <div key={f.t} className="flex items-start gap-2.5 p-3 rounded-lg bg-card-2/50 border border-line">
                <Icon name={f.icon} className="w-4 h-4 text-brand mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-ink">{f.t}</div>
                  <div className="text-[10px] text-ink-3">{f.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-[11px] text-ink-3">基于 PRD v2.0 商用级详尽版 · WorkBuddy 全栈生成</div>
      </div>

      {/* 右侧登录表单 */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand to-brand-2 flex items-center justify-center">
              <Icon name="Stethoscope" className="w-5 h-5 text-[#06121a]" />
            </div>
            <span className="font-bold">Dental Talent OS</span>
          </div>
          <h2 className="text-xl font-bold mb-1">登录工作台</h2>
          <p className="text-sm text-ink-3 mb-6">使用内部账号登录招聘工作台</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>邮箱</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div>
              <Label>密码</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-xs text-red bg-red/10 border border-red/25 rounded-lg px-3 py-2">
                <Icon name="AlertCircle" className="w-3.5 h-3.5" />
                {error}
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Icon name="Loader2" className="w-4 h-4 animate-spin" /> 登录中...
                </>
              ) : (
                <>
                  <Icon name="LogIn" className="w-4 h-4" /> 登录
                </>
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 h-px bg-line" />
              <span className="text-[11px] text-ink-3">演示账号（密码均为 123456，点击填充）</span>
              <div className="flex-1 h-px bg-line" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fill(acc)}
                  className="text-left p-2.5 rounded-lg border border-line hover:border-brand/40 hover:bg-card-2 transition-colors"
                >
                  <div className={`text-xs font-semibold ${acc.color}`}>{acc.label}</div>
                  <div className="text-[10px] text-ink-3 truncate">{acc.email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
