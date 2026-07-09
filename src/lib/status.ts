// 纯状态机常量与函数（不依赖 prisma，可在客户端使用）

export const STATUS_LABELS: Record<string, string> = {
  LEAD_DISCOVERED: "待确认线索",
  POOLED: "已入池",
  SCREENING: "初筛中",
  SCREEN_PASS: "初筛通过",
  FOOTPRINT_REVIEW: "公开资料评估",
  ASSESSMENT: "动态测评",
  INTERVIEW_1: "一面",
  INTERVIEW_2: "二面",
  FINAL_INTERVIEW: "终面",
  DECISION: "决策中",
  OFFER: "Offer 中",
  ACCEPTED: "已接受",
  PRE_ONBOARD: "待入职",
  HIRED: "已入职",
  TALENT_POOL: "人才库",
  REJECTED: "已淘汰",
};

export const STATUS_COLORS: Record<string, string> = {
  LEAD_DISCOVERED: "gray", POOLED: "blue", SCREENING: "teal", SCREEN_PASS: "teal",
  FOOTPRINT_REVIEW: "purple", ASSESSMENT: "amber", INTERVIEW_1: "purple", INTERVIEW_2: "purple",
  FINAL_INTERVIEW: "purple", DECISION: "brand", OFFER: "green", ACCEPTED: "green",
  PRE_ONBOARD: "blue", HIRED: "green", TALENT_POOL: "blue", REJECTED: "red",
};

// 合法状态迁移：from → [allowed to]
const TRANSITIONS: Record<string, string[]> = {
  LEAD_DISCOVERED: ["POOLED", "TALENT_POOL", "REJECTED"],
  POOLED: ["SCREENING", "TALENT_POOL", "REJECTED"],
  SCREENING: ["SCREEN_PASS", "REJECTED"],
  SCREEN_PASS: ["FOOTPRINT_REVIEW", "ASSESSMENT", "INTERVIEW_1", "REJECTED"],
  FOOTPRINT_REVIEW: ["ASSESSMENT", "INTERVIEW_1", "REJECTED"],
  ASSESSMENT: ["INTERVIEW_1", "REJECTED"],
  INTERVIEW_1: ["INTERVIEW_2", "REJECTED"],
  INTERVIEW_2: ["FINAL_INTERVIEW", "REJECTED"],
  FINAL_INTERVIEW: ["DECISION", "REJECTED"],
  DECISION: ["OFFER", "TALENT_POOL", "REJECTED"],
  OFFER: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["PRE_ONBOARD"],
  PRE_ONBOARD: ["HIRED"],
  HIRED: [],
  TALENT_POOL: ["POOLED"],
  REJECTED: ["TALENT_POOL"],
};

export function canTransition(from: string, to: string): boolean {
  return (TRANSITIONS[from] || []).includes(to);
}

export function nextStatuses(from: string): { status: string; label: string; color: string }[] {
  return (TRANSITIONS[from] || []).map((s) => ({ status: s, label: STATUS_LABELS[s] || s, color: STATUS_COLORS[s] || "gray" }));
}

export function isDoctorCategory(category: string): boolean {
  return !!category && category.startsWith("doctor_");
}

// 招聘流程顺序（用于状态时间轴展示）
export const STATUS_FLOW_ORDER = [
  "LEAD_DISCOVERED", "POOLED", "SCREENING", "SCREEN_PASS", "FOOTPRINT_REVIEW",
  "ASSESSMENT", "INTERVIEW_1", "INTERVIEW_2", "FINAL_INTERVIEW", "DECISION",
  "OFFER", "ACCEPTED", "PRE_ONBOARD", "HIRED",
];
