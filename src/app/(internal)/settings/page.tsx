import { prisma } from "@/lib/prisma";
import { PageHeader, Card, Badge, Icon } from "@/components/ui";
import { ROLE_NAMES } from "@/lib/constants";
import { shortDate } from "@/lib/utils";

const SCOPE_LABEL: Record<string, string> = { ALL: "全部", REGION: "本区域", CLINIC: "本门诊", OWNED: "本人", ASSIGNED: "分配" };

export default async function SettingsPage() {
  const [users, roles] = await Promise.all([
    prisma.user.findMany({ include: { role: true, org: true }, orderBy: { createdAt: "asc" } }),
    prisma.role.findMany({ include: { _count: { select: { users: true, permissions: true } } }, orderBy: { code: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="系统设置" desc="用户、角色、权限与组织配置中心" />

      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3"><Icon name="Users" className="w-4 h-4 text-brand" /><h3 className="text-base font-semibold">用户管理 <span className="text-ink-3 text-sm">({users.length})</span></h3></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr><th className="th">姓名</th><th className="th">邮箱</th><th className="th">角色</th><th className="th">数据范围</th><th className="th">组织</th><th className="th">状态</th><th className="th">最近登录</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-card-2/40">
                  <td className="td"><span className="text-ink font-medium">{u.name}</span></td>
                  <td className="td text-xs">{u.email}</td>
                  <td className="td"><Badge color="blue">{ROLE_NAMES[u.role.code] || u.role.code}</Badge></td>
                  <td className="td text-xs">{SCOPE_LABEL[u.role.dataScope] || u.role.dataScope}</td>
                  <td className="td text-xs">{u.org?.name || "—"}</td>
                  <td className="td"><Badge color={u.status === "ACTIVE" ? "green" : "gray"}>{u.status === "ACTIVE" ? "启用" : "停用"}</Badge></td>
                  <td className="td text-xs text-ink-3">{u.lastLoginAt ? shortDate(u.lastLoginAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3"><Icon name="Shield" className="w-4 h-4 text-brand" /><h3 className="text-base font-semibold">角色与权限 <span className="text-ink-3 text-sm">({roles.length})</span></h3></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.map((r) => (
            <div key={r.id} className="p-3 rounded-lg bg-bg-2/50 border border-line">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-ink">{ROLE_NAMES[r.code] || r.name}</span>
                <Badge color={r.enabled ? "green" : "gray"}>{r.enabled ? "启用" : "停用"}</Badge>
              </div>
              <div className="text-xs text-ink-3">数据范围：{SCOPE_LABEL[r.dataScope] || r.dataScope}</div>
              <div className="text-xs text-ink-3 mt-1">权限点 {r._count.permissions} · 用户 {r._count.users}</div>
            </div>
          ))}
        </div>
      </Card>
      <p className="text-[11px] text-ink-3 mt-4 text-center">权限矩阵：菜单/动作/字段/数据范围 · 不同角色登录看到不同菜单与数据</p>
    </div>
  );
}
