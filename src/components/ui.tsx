import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import * as Icons from "lucide-react";

// ==================== Button ====================
type ButtonVariant = "primary" | "ghost" | "danger" | "subtle";
export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const variants: Record<ButtonVariant, string> = {
    primary: "btn-primary",
    ghost: "btn-ghost",
    danger: "btn-danger",
    subtle: "inline-flex items-center justify-center gap-1.5 bg-card-2 text-ink-2 text-sm px-4 py-2 rounded-lg hover:bg-line/40 transition-colors",
  };
  return (
    <button className={cn(variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

// ==================== Input / Textarea / Label ====================
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("input min-h-[80px] resize-y", className)} {...props} />;
}

export function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={cn("label", className)}>{children}</label>;
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("input cursor-pointer", className)} {...props}>
      {children}
    </select>
  );
}

// ==================== Card ====================
export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {desc && <p className="text-xs text-ink-3 mt-1">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

// ==================== Badge ====================
type BadgeColor = "brand" | "green" | "amber" | "red" | "purple" | "blue" | "teal" | "gray";
export function Badge({ color = "gray", children }: { color?: BadgeColor; children: React.ReactNode }) {
  const colors: Record<BadgeColor, string> = {
    brand: "bg-brand/15 text-brand",
    green: "bg-green/15 text-green",
    amber: "bg-amber/15 text-amber",
    red: "bg-red/15 text-red",
    purple: "bg-purple/15 text-purple",
    blue: "bg-blue/15 text-blue",
    teal: "bg-teal/15 text-teal",
    gray: "bg-line/30 text-ink-2",
  };
  return <span className={cn("badge", colors[color])}>{children}</span>;
}

// ==================== Icon ====================
export function Icon({ name, className }: { name: string; className?: string }) {
  const IconComp = (Icons as unknown as Record<string, LucideIcon>)[name] || Icons.Circle;
  return <IconComp className={cn("w-4 h-4", className)} />;
}

// ==================== EmptyState ====================
export function EmptyState({ icon, title, desc, action }: { icon?: string; title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <Icon name={icon} className="w-10 h-10 text-ink-3 mb-3" />}
      <p className="text-sm font-medium text-ink-2">{title}</p>
      {desc && <p className="text-xs text-ink-3 mt-1 max-w-sm">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ==================== PageHeader ====================
export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        {desc && <p className="text-sm text-ink-3 mt-1">{desc}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
