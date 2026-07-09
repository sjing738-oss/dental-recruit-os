"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMenuForRole, ROLE_NAMES } from "@/lib/constants";
import { Icon } from "./ui";
import { cn } from "@/lib/utils";

export function Sidebar({ roleCode, userName }: { roleCode: string; userName: string }) {
  const pathname = usePathname();
  const menu = getMenuForRole(roleCode);
  const roleName = ROLE_NAMES[roleCode] || roleCode;

  return (
    <aside className="w-60 shrink-0 bg-bg-2 border-r border-line flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-line">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-brand-2 flex items-center justify-center">
          <Icon name="Stethoscope" className="w-5 h-5 text-[#06121a]" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-ink">Dental Talent OS</div>
          <div className="text-[10px] text-ink-3 tracking-wide">dental_recruit_os</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        {menu.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors",
                active ? "bg-brand/12 text-brand" : "text-ink-2 hover:bg-card-2 hover:text-ink"
              )}
            >
              <Icon name={item.icon} className={cn("w-4 h-4", active && "text-brand")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-purple/20 text-purple flex items-center justify-center text-xs font-bold">
            {userName.slice(0, 1)}
          </div>
          <div className="leading-tight flex-1 min-w-0">
            <div className="text-sm text-ink truncate">{userName}</div>
            <div className="text-[10px] text-ink-3">{roleName}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
