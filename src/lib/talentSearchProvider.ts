// 人才搜索 Provider（Adapter 模式，首版 Mock，后续可替换真实搜索）
// 对应 PRD 5.2 talentSearchProvider.run(task) + 7.3 自动人才雷达

import type { TalentSearchTask } from "@prisma/client";

export interface SearchResult {
  name: string;
  currentOrg: string;
  specialty: string;
  sourceUrl: string;
  reason: string;
  credibility: "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";
  contactPriority: string;
}

// Mock 人才线索池 —— 模拟公开专业足迹发现
const POOL: Omit<SearchResult, "sourceUrl">[] = [
  { name: "陈嘉文", currentOrg: "上海某三甲口腔医院", specialty: "正畸医生", reason: "中华口腔医学会正畸专委会委员，多次学术会议演讲", credibility: "HIGH", contactPriority: "high" },
  { name: "林书豪", currentOrg: "某连锁口腔集团", specialty: "种植医生", reason: "种植病例分享活跃，ITI 会员，复杂种植经验", credibility: "HIGH", contactPriority: "high" },
  { name: "黄美玲", currentOrg: "南京某口腔诊所", specialty: "正畸医生", reason: "隐适美认证医师，正畸案例展示丰富", credibility: "MEDIUM", contactPriority: "medium" },
  { name: "赵伟康", currentOrg: "苏州某综合医院口腔科", specialty: "种植医生", reason: "All-on-4 病例经验，行业活动参与度高", credibility: "MEDIUM", contactPriority: "medium" },
  { name: "周慧敏", currentOrg: "某口腔连锁机构", specialty: "儿牙医生", reason: "儿童口腔行为管理经验，家长口碑好", credibility: "MEDIUM", contactPriority: "medium" },
  { name: "吴志强", currentOrg: "无锡某口腔门诊", specialty: "修复医生", reason: "前牙美学修复案例多，数字化设计经验", credibility: "MEDIUM", contactPriority: "medium" },
  { name: "孙雅琴", currentOrg: "某私立口腔机构", specialty: "牙周医生", reason: "牙周手术治疗经验，学术发表记录", credibility: "MEDIUM", contactPriority: "low" },
  { name: "郑国华", currentOrg: "某医疗集团", specialty: "门诊经理", reason: "连锁门诊运营经验，团队管理背景", credibility: "LOW", contactPriority: "medium" },
  { name: "马晓燕", currentOrg: "某三甲医院", specialty: "护士长", reason: "口腔四手操作培训经验，感控管理", credibility: "MEDIUM", contactPriority: "medium" },
  { name: "钱俊杰", currentOrg: "某口腔连锁", specialty: "正畸医生", reason: "舌侧正畸认证，复杂病例承接", credibility: "MEDIUM", contactPriority: "high" },
  { name: "冯丽华", currentOrg: "杭州某口腔医院", specialty: "种植医生", reason: "穿颧种植经验，学术影响力", credibility: "HIGH", contactPriority: "high" },
  { name: "许文博", currentOrg: "某门诊", specialty: "全科医生", reason: "全科综合能力强，转化意识好", credibility: "LOW", contactPriority: "low" },
];

export async function runSearch(task: TalentSearchTask): Promise<SearchResult[]> {
  // 模拟网络延迟
  await new Promise((r) => setTimeout(r, 600));

  let results = [...POOL];

  // 按专业方向过滤
  if (task.specialty) {
    const sp = task.specialty;
    results = results.filter((r) => r.specialty.includes(sp) || sp.includes(r.specialty));
  }

  // 关键词过滤
  if (task.keywords) {
    const kw = task.keywords.toLowerCase();
    results = results.filter((r) => r.name.toLowerCase().includes(kw) || r.currentOrg.toLowerCase().includes(kw) || r.specialty.toLowerCase().includes(kw));
  }

  // 不足时补充随机线索
  if (results.length < 5) {
    results = [...results, ...POOL.filter((p) => !results.includes(p)).slice(0, 5 - results.length)];
  }

  // 截取目标数量
  const count = Math.min(task.targetCount || 10, results.length);
  return results.slice(0, count).map((r) => ({
    ...r,
    sourceUrl: `https://example.com/profile/${encodeURIComponent(r.name)}`,
  }));
}

// 生成搜索策略（Mock，P5 可接入 AI）
export function generateStrategy(task: TalentSearchTask): string {
  return JSON.stringify({
    keywords: [task.specialty, task.city, "口腔"].filter(Boolean).join(" "),
    channels: ["学术会议名录", "行业协会会员", "公开病例平台", "专业社交媒体"],
    targetProfile: `${task.city || "全国"} · ${task.specialty || "口腔医疗"} · ${task.level || "中高级"}`,
    exclude: ["无公开专业足迹", "近期已联系"],
  });
}
