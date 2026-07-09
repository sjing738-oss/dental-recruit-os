// 统一 AI 服务入口 —— 对应 PRD 5.2 aiService.generate(scene, payload, options) + 11.x Prompt Contract
// 首版 Mock，所有调用先存 AIOutput（pending_review）再返回，可替换真实 Provider

import { prisma } from "./prisma";
import { logAudit } from "./audit";

export interface AISceneOutput {
  summary: string;
  verified_facts: string[];
  public_clues: string[];
  inferences: string[];
  risks: string[];
  missing_info: string[];
  recommended_next_actions: string[];
  confidence: "high" | "medium" | "low";
  human_review_required: boolean;
  matchScore?: number;
  risk_level?: string;
}

interface CandidateLite {
  name: string;
  specialty?: string | null;
  currentOrg?: string | null;
  city?: string | null;
}
interface JobLite {
  title: string;
  category: string;
}

// Mock 生成器 —— 按场景产出结构化输出（区分已验证事实/公开线索/AI推断/待核验）
function mockGenerate(scene: string, candidate: CandidateLite, job?: JobLite | null): AISceneOutput {
  const name = candidate.name;
  const sp = candidate.specialty || "口腔医生";
  const org = candidate.currentOrg || "某口腔机构";

  if (scene === "screening_report") {
    const isDoctor = job?.category?.startsWith("doctor_");
    return {
      summary: `${name}（${sp}）与「${job?.title || "岗位"}」初步匹配度较高，专业方向对口，但关键资质与病例材料需补充核验。`,
      verified_facts: [
        `候选人当前任职于${org}`,
        `专业方向：${sp}`,
        `期望工作地：${candidate.city || "未明确"}`,
      ],
      public_clues: [
        "公开资料显示参与行业学术活动",
        "专业平台有病例展示记录",
      ],
      inferences: [
        "推断具备本岗位所需的专业基础",
        "推断有团队协作与门诊运营经验",
      ],
      risks: [
        isDoctor ? "执业资质与注册范围需人工核验" : "岗位资质需核验",
        "既往医疗纠纷记录待查",
        "薪酬期望与带宽匹配度需确认",
      ],
      missing_info: [
        "执业证书编号及注册范围",
        "学历与职称证明",
        "近3年代表性病例清单",
      ],
      recommended_next_actions: [
        "补充执业资质材料并人工核验",
        "进入公开足迹评估",
        "安排动态能力测评",
      ],
      confidence: "medium",
      human_review_required: true,
      matchScore: 76,
    };
  }

  if (scene === "public_footprint_report") {
    return {
      summary: `基于公开资料对${name}的专业足迹进行结构化分析，区分已验证事实与推断，关键结论需人工核验。`,
      verified_facts: [
        `行业协会会员身份（待官方核验）`,
        `专业平台公开病例展示`,
      ],
      public_clues: [
        "学术会议演讲与分享记录",
        "同行评价整体正面",
        "专业社交媒体活跃度中等",
      ],
      inferences: [
        `在${sp}领域具备一定专业影响力`,
        "患者沟通能力较强（基于公开反馈推断）",
      ],
      risks: [
        "公开资料有限，部分推断需谨慎采信",
        "未发现明显医疗合规风险线索，但需官方核验",
      ],
      missing_info: [
        "官方执业注册信息",
        "学术成果原文与署名",
        "患者评价样本量",
      ],
      recommended_next_actions: [
        "人工核验执业资质与注册范围",
        "补充学术成果证据并标记可信度",
        "进入动态测评验证实战能力",
      ],
      confidence: "low",
      human_review_required: true,
      risk_level: "GREEN",
    };
  }

  return {
    summary: "AI 辅助分析",
    verified_facts: [], public_clues: [], inferences: [], risks: [], missing_info: [],
    recommended_next_actions: [], confidence: "low", human_review_required: true,
  };
}

// 统一入口：生成 → 存 AIOutput(pending_review) → 返回
export async function generate(
  scene: string,
  payload: { targetType: string; targetId: string; candidate: CandidateLite; job?: JobLite | null },
  userId: string
) {
  const output = mockGenerate(scene, payload.candidate, payload.job);

  const aiOutput = await prisma.aIOutput.create({
    data: {
      scene,
      targetType: payload.targetType,
      targetId: payload.targetId,
      inputSummary: JSON.stringify({ candidateName: payload.candidate.name, jobTitle: payload.job?.title }).slice(0, 500),
      outputJson: JSON.stringify(output),
      outputText: output.summary,
      provider: "mock",
      model: "mock-v1",
      status: "PENDING_REVIEW",
      createdById: userId,
    },
  });

  await logAudit({
    actorId: userId,
    action: "ai.generate",
    objectType: "ai_output",
    objectId: aiOutput.id,
    after: { scene, confidence: output.confidence },
  });

  return { aiOutputId: aiOutput.id, output };
}
