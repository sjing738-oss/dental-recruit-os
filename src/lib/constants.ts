// 角色码、权限码、菜单定义 —— 对应 PRD 3.1 角色矩阵 与 6.1 一级导航

export const ROLE_CODES = {
  ADMIN: "admin",
  GROUP_HR: "group_hr",
  REGION_HR: "region_hr",
  RECRUITER: "recruiter",
  MEDICAL: "medical",
  CLINIC_MANAGER: "clinic_manager",
  INTERVIEWER: "interviewer",
} as const;

export const ROLE_NAMES: Record<string, string> = {
  admin: "系统管理员",
  group_hr: "集团HR负责人",
  region_hr: "区域HR",
  recruiter: "招聘HR",
  medical: "医疗负责人",
  clinic_manager: "门诊负责人",
  interviewer: "面试官",
};

// 权限码（菜单 + 动作）
export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  JOBS_VIEW: "jobs.view",
  JOBS_CREATE: "jobs.create",
  TALENT_RADAR_VIEW: "talent_radar.view",
  CANDIDATES_VIEW: "candidates.view",
  CANDIDATES_CREATE: "candidates.create",
  CANDIDATES_TRANSITION: "candidates.transition",
  ASSESSMENT_VIEW: "assessment.view",
  INTERVIEW_VIEW: "interview.view",
  INTERVIEWER_TASKS_VIEW: "interviewer_tasks.view",
  DECISION_VIEW: "decision.view",
  OFFER_VIEW: "offer.view",
  OFFER_APPROVE: "offer.approve",
  ONBOARDING_VIEW: "onboarding.view",
  TALENT_POOL_VIEW: "talent_pool.view",
  ANALYTICS_VIEW: "analytics.view",
  COMPLIANCE_VIEW: "compliance.view",
  AUDIT_VIEW: "audit.view",
  SETTINGS_VIEW: "settings.view",
  AI_GENERATE: "ai.generate",
  SALARY_VIEW: "salary.view",
} as const;

// 菜单定义：每个角色可见的菜单
export interface MenuItem {
  label: string;
  href: string;
  icon: string;
  permission: string;
}

export const MENU: MenuItem[] = [
  { label: "招聘驾驶舱", href: "/dashboard", icon: "LayoutDashboard", permission: PERMISSIONS.DASHBOARD_VIEW },
  { label: "岗位需求", href: "/jobs", icon: "Briefcase", permission: PERMISSIONS.JOBS_VIEW },
  { label: "人才雷达", href: "/talent-radar", icon: "Radar", permission: PERMISSIONS.TALENT_RADAR_VIEW },
  { label: "候选人管理", href: "/candidates", icon: "Users", permission: PERMISSIONS.CANDIDATES_VIEW },
  { label: "面试任务", href: "/interviewer/tasks", icon: "ClipboardList", permission: PERMISSIONS.INTERVIEWER_TASKS_VIEW },
  { label: "入职承接", href: "/onboarding", icon: "UserPlus", permission: PERMISSIONS.ONBOARDING_VIEW },
  { label: "人才库", href: "/talent-pool", icon: "Database", permission: PERMISSIONS.TALENT_POOL_VIEW },
  { label: "数据看板", href: "/analytics", icon: "BarChart3", permission: PERMISSIONS.ANALYTICS_VIEW },
  { label: "合规复核", href: "/compliance", icon: "ShieldCheck", permission: PERMISSIONS.COMPLIANCE_VIEW },
  { label: "审计日志", href: "/audit", icon: "ScrollText", permission: PERMISSIONS.AUDIT_VIEW },
  { label: "系统设置", href: "/settings", icon: "Settings", permission: PERMISSIONS.SETTINGS_VIEW },
];

// 角色 → 权限码集合（P1 简化版：按角色直接授予菜单权限）
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: Object.values(PERMISSIONS),
  group_hr: [
    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.JOBS_VIEW, PERMISSIONS.TALENT_RADAR_VIEW,
    PERMISSIONS.CANDIDATES_VIEW, PERMISSIONS.ASSESSMENT_VIEW, PERMISSIONS.INTERVIEW_VIEW,
    PERMISSIONS.DECISION_VIEW, PERMISSIONS.OFFER_VIEW, PERMISSIONS.OFFER_APPROVE,
    PERMISSIONS.ONBOARDING_VIEW, PERMISSIONS.TALENT_POOL_VIEW, PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.COMPLIANCE_VIEW, PERMISSIONS.AUDIT_VIEW, PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.AI_GENERATE, PERMISSIONS.SALARY_VIEW,
  ],
  region_hr: [
    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.JOBS_VIEW, PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.TALENT_RADAR_VIEW, PERMISSIONS.CANDIDATES_VIEW, PERMISSIONS.CANDIDATES_CREATE,
    PERMISSIONS.CANDIDATES_TRANSITION, PERMISSIONS.ASSESSMENT_VIEW, PERMISSIONS.INTERVIEW_VIEW,
    PERMISSIONS.DECISION_VIEW, PERMISSIONS.OFFER_VIEW, PERMISSIONS.ONBOARDING_VIEW,
    PERMISSIONS.TALENT_POOL_VIEW, PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.COMPLIANCE_VIEW,
    PERMISSIONS.AI_GENERATE,
  ],
  recruiter: [
    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.JOBS_VIEW, PERMISSIONS.JOBS_CREATE,
    PERMISSIONS.TALENT_RADAR_VIEW, PERMISSIONS.CANDIDATES_VIEW, PERMISSIONS.CANDIDATES_CREATE,
    PERMISSIONS.CANDIDATES_TRANSITION, PERMISSIONS.ASSESSMENT_VIEW, PERMISSIONS.INTERVIEW_VIEW,
    PERMISSIONS.ONBOARDING_VIEW, PERMISSIONS.AI_GENERATE,
  ],
  medical: [
    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.CANDIDATES_VIEW, PERMISSIONS.ASSESSMENT_VIEW,
    PERMISSIONS.INTERVIEW_VIEW, PERMISSIONS.INTERVIEWER_TASKS_VIEW, PERMISSIONS.COMPLIANCE_VIEW,
    PERMISSIONS.AI_GENERATE,
  ],
  clinic_manager: [
    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.CANDIDATES_VIEW, PERMISSIONS.INTERVIEWER_TASKS_VIEW,
    PERMISSIONS.ONBOARDING_VIEW,
  ],
  interviewer: [
    PERMISSIONS.DASHBOARD_VIEW, PERMISSIONS.INTERVIEWER_TASKS_VIEW,
  ],
};

export function hasPermission(roleCode: string, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[roleCode] || [];
  return perms.includes(permission);
}

export function getMenuForRole(roleCode: string): MenuItem[] {
  return MENU.filter((m) => hasPermission(roleCode, m.permission));
}
