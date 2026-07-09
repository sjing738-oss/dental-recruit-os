import { PageHeader, Card, CardHeader, Icon, Badge } from "@/components/ui";

// 通用"建设中"占位页 —— P1 阶段菜单可达，后续阶段填充真实功能
export function BuildingPage({
  title,
  desc,
  phase,
  features,
}: {
  title: string;
  desc?: string;
  phase: string;
  features?: string[];
}) {
  return (
    <div>
      <PageHeader
        title={title}
        desc={desc}
        action={<Badge color="amber">{phase} 阶段实现</Badge>}
      />
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber/10 flex items-center justify-center mb-4">
            <Icon name="Construction" className="w-7 h-7 text-amber" />
          </div>
          <h3 className="text-base font-semibold text-ink">该模块将在 {phase} 阶段实现</h3>
          <p className="text-sm text-ink-3 mt-2 max-w-md">
            当前为 P1 项目骨架阶段，已搭建可运行项目、数据库、登录与导航。此模块的页面、数据与业务逻辑将按实施路线逐步落地。
          </p>
          {features && features.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
              {features.map((f) => (
                <span key={f} className="badge bg-card-2 text-ink-2">
                  <Icon name="Check" className="w-3 h-3 mr-1 text-teal" /> {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
