"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthKey, monthLabel, shiftMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">{eyebrow}</p> : null}
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-ink">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function MonthSwitcher({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const current = monthKey();
  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-card px-2 py-1">
      <button type="button" className="rounded-full p-1.5 hover:bg-paper-2" onClick={() => onChange(shiftMonth(value, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-36 text-center text-sm font-semibold">{monthLabel(value)}</span>
      <button
        type="button"
        className="rounded-full p-1.5 hover:bg-paper-2 disabled:opacity-30"
        onClick={() => onChange(shiftMonth(value, 1))}
        disabled={value >= current}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Money({
  cents,
  signed = false,
  size = "md",
  tone,
}: {
  cents: number;
  signed?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  tone?: "good" | "bad" | "neutral";
}) {
  const resolved = tone ?? (signed ? (cents > 0 ? "good" : cents < 0 ? "bad" : "neutral") : "neutral");
  return (
    <span
      className={cn(
        "tabular inline-block",
        size === "sm" && "text-sm",
        size === "md" && "text-base",
        size === "lg" && "text-2xl font-semibold",
        size === "xl" && "font-[family-name:var(--font-display)] text-5xl tracking-tight",
        resolved === "good" && "text-teal",
        resolved === "bad" && "text-rose",
      )}
    >
      {formatMoney(cents, { signed })}
    </span>
  );
}

export function CategoryDot({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />;
}

export function Progress({ value, color }: { value: number; color?: string }) {
  const width = Math.min(100, Math.max(0, value));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-paper-2">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${width}%`, background: color ?? "var(--teal)" }}
      />
    </div>
  );
}

export function Button({
  children,
  onClick,
  href,
  variant = "primary",
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const className = cn(
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
    variant === "primary" && "bg-teal text-white hover:bg-teal-dark",
    variant === "secondary" && "border border-line bg-card text-ink hover:bg-paper-2",
    variant === "ghost" && "text-muted hover:bg-paper-2 hover:text-ink",
    disabled && "opacity-50",
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
}