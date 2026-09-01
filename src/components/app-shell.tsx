"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Landmark,
  Receipt,
  Repeat,
  Settings,
  Sparkles,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/activity", label: "Activity", icon: Receipt },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/accounts", label: "Accounts", icon: Landmark },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line px-4 py-6 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-2xl bg-teal text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>
            <span className="block font-[family-name:var(--font-display)] text-xl leading-none">
              Genie
            </span>
            <span className="text-xs text-muted">Household money</span>
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition",
                  active ? "bg-teal-soft text-teal-dark" : "text-muted hover:bg-white/60 hover:text-ink",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/settings"
          className={cn(
            "mt-auto flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium",
            pathname.startsWith("/settings") ? "bg-teal-soft text-teal-dark" : "text-muted hover:bg-white/60",
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
        <div className="flex items-center justify-between px-4 pt-4 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-2xl bg-teal text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg">Genie</span>
          </Link>
          <Link href="/settings" className="rounded-full p-2 text-muted">
            <Settings className="h-5 w-5" />
          </Link>
        </div>
        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-[color:var(--card)]/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-6xl grid-cols-5">
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-medium",
                  active ? "text-teal-dark" : "text-muted",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}