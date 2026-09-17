"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, GROUP_LABELS, categoryColor, categoryName } from "@/lib/categories";
import type { CategoryGroup } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CategoryDot } from "./ui";

const GROUPS: CategoryGroup[] = [
  "food",
  "bills",
  "housing",
  "transport",
  "lifestyle",
  "health",
  "income",
  "transfer",
  "other",
];

export function CategoryChip({
  categoryId,
  onClick,
  className,
}: {
  categoryId: string;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full bg-paper-2 px-2.5 py-1 text-xs font-medium text-ink",
        onClick && "hover:bg-paper-2/80",
        className,
      )}
    >
      <CategoryDot color={categoryColor(categoryId)} />
      <span className="truncate">{categoryName(categoryId)}</span>
    </Tag>
  );
}

export function CategoryPicker({
  value,
  onChange,
  allowAll = false,
  excludeIds = [],
  label = "Category",
}: {
  value: string;
  onChange: (id: string) => void;
  allowAll?: boolean;
  excludeIds?: string[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const currentName = value === "all" ? "All categories" : categoryName(value);
  const currentColor = value === "all" ? "#A8A29E" : categoryColor(value);

  const grouped = useMemo(
    () =>
      GROUPS.map((group) => ({
        group,
        label: GROUP_LABELS[group],
        items: CATEGORIES.filter((category) => category.group === group && !excludeIds.includes(category.id)),
      })).filter((section) => section.items.length > 0),
    [excludeIds],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="field flex min-h-11 items-center gap-2 text-left"
        aria-label={label}
      >
        <CategoryDot color={currentColor} />
        <span className="flex-1 truncate text-sm font-medium">{currentName}</span>
        <span className="text-xs text-muted">Change</span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-card p-4 pb-8 shadow-2xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[min(28rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
            <p className="mb-3 text-sm font-semibold">{label}</p>
            <div className="space-y-4">
              {allowAll ? (
                <button
                  type="button"
                  onClick={() => {
                    onChange("all");
                    setOpen(false);
                  }}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-sm",
                    value === "all"
                      ? "border-teal bg-teal-soft text-teal-dark"
                      : "border-line bg-white text-ink hover:border-teal/40",
                  )}
                >
                  <CategoryDot color="#A8A29E" />
                  All categories
                </button>
              ) : null}
              {grouped.map((section) => (
                <div key={section.group}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{section.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {section.items.map((category) => {
                      const selected = category.id === value;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            onChange(category.id);
                            setOpen(false);
                          }}
                          className={cn(
                            "inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-sm",
                            selected
                              ? "border-teal bg-teal-soft text-teal-dark"
                              : "border-line bg-white text-ink hover:border-teal/40",
                          )}
                        >
                          <CategoryDot color={category.color} />
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
