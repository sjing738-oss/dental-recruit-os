"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./ui";

export function Topbar({ title }: { title?: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="h-16 border-b border-line bg-bg-2/60 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="text-sm font-medium text-ink-2">{title || "工作台"}</div>
      <div className="flex items-center gap-2">
        <button className="btn-ghost !px-2.5 !py-1.5" title="搜索">
          <Icon name="Search" className="w-4 h-4" />
        </button>
        <button className="btn-ghost !px-2.5 !py-1.5" title="通知">
          <Icon name="Bell" className="w-4 h-4" />
        </button>
        <button onClick={handleLogout} className="btn-ghost !px-2.5 !py-1.5" title="退出登录">
          <Icon name="LogOut" className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
