"use client";

import { useMemo, useState } from "react";
import { categoryColor, categoryName } from "@/lib/categories";
import { formatShortDate, inDateFilter, type RecurringDateFilter } from "@/lib/dates";
import { formatAbs } from "@/lib/money";
import { setRecurringNickname, setRecurringStatus, useHousehold } from "@/lib/store";
import { monthPoints } from "@/lib/trends";
import { Button, CategoryDot, Money, PageHeader } from "@/components/ui";
import { TrendChart } from "@/components/trend-chart";
import type { RecurringCadence, RecurringCharge } from "@/lib/types";
import { cn } from "@/lib/utils";

const CADENCE_FILTERS: { id: Exclude<RecurringCadence, "weekly">; label: string }[] = [
  { id: "monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "semiannual", label: "Every 6 Months" },
  { id: "yearly", label: "Yearly" },
];

const DATE_FILTERS: { id: RecurringDateFilter; label: string }[] = [
  { id: "all", label: "All dates" },
  { id: "month", label: "This month" },
  { id: "three-months", label: "Last 3 months" },
  { id: "year", label: "This year" },
];

const CADENCE_LABEL: Record<RecurringCadence, string> = {
  weekly: "weekly",
  monthly: "monthly",
  quarterly: "quarterly",
  semiannual: "every 6 months",
  yearly: "yearly",
};

export default function RecurringPage() {
  const { recurring, transactions, ready } = useHousehold();
  const [showHidden, setShowHidden] = useState(false);
  const [cadenceFilter, setCadenceFilter] = useState<(typeof CADENCE_FILTERS)[number]["id"]>("monthly");
  const [dateFilter, setDateFilter] = useState<RecurringDateFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const active = recurring.filter((item) => item.status === "active");
  const visible = active.filter(
    (item) => item.cadence === cadenceFilter && inDateFilter(item.lastSeen, dateFilter),
  );
  const monthly = active
    .filter((item) => item.cadence === "monthly")
    .reduce((sum, item) => sum + item.amountCents, 0);
  const hidden = recurring.filter((item) => item.status !== "active");
  const points = useMemo(() => monthPoints(transactions, recurring, 8), [transactions, recurring]);
  const filterLabel = CADENCE_FILTERS.find((item) => item.id === cadenceFilter)?.label.toLowerCase() ?? "monthly";

  function startNickname(item: RecurringCharge) {
    setEditingId(item.id);
    setNicknameDraft(item.nickname ?? item.displayName);
  }

  async function saveNickname(item: RecurringCharge) {
    await setRecurringNickname(item.id, item.merchant, nicknameDraft);
    setEditingId(null);
  }

  if (!ready) return <div className="py-20 text-center text-muted">Looking for repeating charges…</div>;

  return (
    <div>
      <PageHeader
        eyebrow="Subscriptions and bills"
        title="Recurring"
        subtitle="Only charges that still come back. If a loan or subscription stopped, it drops off this list."
      />

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <article className="card p-5">
          <p className="text-sm text-muted">Bills vs spend</p>
          <div className="mt-1">
            <Money cents={Math.abs(monthly)} size="lg" />
          </div>
          <p className="mb-2 text-xs text-muted">Estimated monthly bills versus total spending</p>
          <TrendChart
            points={points}
            primary="recurring"
            secondary="spend"
            primaryLabel="Bills"
            secondaryLabel="Spend"
          />
        </article>
        <article className="card p-5">
          <p className="text-sm text-muted">Live repeating charges</p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl">{active.length}</p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Genie hides anything that missed more than a cycle. Mark a leftover as not a bill if it is a transfer or a one-off.
          </p>
        </article>
      </section>

      <div className="mt-4 space-y-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {CADENCE_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCadenceFilter(item.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-2 text-sm",
                cadenceFilter === item.id ? "border-teal bg-teal-soft text-teal-dark" : "border-line bg-card text-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {DATE_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setDateFilter(item.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-2 text-sm",
                dateFilter === item.id ? "border-teal bg-teal-soft text-teal-dark" : "border-line bg-card text-muted",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <section className="card mt-3 overflow-hidden">
        {active.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">No live repeating charges. Import a couple of recent months, or restore something from Hidden.</p>
        ) : visible.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">
            No {filterLabel} repeating charges{dateFilter === "all" ? "" : " in that date range"}.
          </p>
        ) : (
          visible.map((item) => (
            <div key={item.id} className="border-b border-line px-4 py-4 last:border-b-0 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">{item.displayName}</p>
                  {item.nickname && item.merchant !== item.displayName ? (
                    <p className="text-xs text-muted">Bank name: {item.merchant}</p>
                  ) : null}
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CategoryDot color={categoryColor(item.categoryId)} />
                      {categoryName(item.categoryId)}
                    </span>
                    <span>{CADENCE_LABEL[item.cadence]}</span>
                    <span>last {formatShortDate(item.lastSeen)}</span>
                    <span>next {formatShortDate(item.nextEstimated)}</span>
                  </p>
                </div>
                <span className="tabular text-sm font-semibold">{formatAbs(item.amountCents)}</span>
              </div>
              {editingId === item.id ? (
                <form
                  className="mt-3 flex flex-col gap-2 sm:flex-row"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveNickname(item);
                  }}
                >
                  <input
                    className="field"
                    value={nicknameDraft}
                    onChange={(event) => setNicknameDraft(event.target.value)}
                    placeholder="Nickname"
                    autoFocus
                    aria-label="Nickname"
                  />
                  <div className="flex gap-2">
                    <Button type="submit">Save</Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={() => void setRecurringStatus(item.id, item.merchant, "ignored")}>
                    Not a bill
                  </Button>
                  <Button variant="ghost" onClick={() => void setRecurringStatus(item.id, item.merchant, "cancelled")}>
                    Cancelled
                  </Button>
                  <Button variant="ghost" onClick={() => startNickname(item)}>
                    Nickname
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </section>

      {hidden.length ? (
        <section className="mt-6">
          <button
            type="button"
            className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted"
            onClick={() => setShowHidden((open) => !open)}
          >
            Hidden · {hidden.length} {showHidden ? "▾" : "▸"}
          </button>
          {showHidden ? (
            <div className="card divide-y divide-line overflow-hidden">
              {hidden.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 truncate text-muted">
                    {item.displayName} · {item.status}
                  </span>
                  <Button variant="ghost" onClick={() => void setRecurringStatus(item.id, item.merchant, "active")}>
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
