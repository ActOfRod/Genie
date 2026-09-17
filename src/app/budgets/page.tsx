"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { monthKey } from "@/lib/dates";
import { formatAbs } from "@/lib/money";
import { categoryTotals, setBudget, useHousehold } from "@/lib/store";
import { CategoryPicker } from "@/components/category-picker";
import { Button, CategoryDot, MonthSwitcher, PageHeader, Progress } from "@/components/ui";

export default function BudgetsPage() {
  const { budgets, transactions, ready } = useHousehold();
  const [month, setMonth] = useState(monthKey());
  const [draftId, setDraftId] = useState("dining");
  const [draftAmount, setDraftAmount] = useState("250");
  const spent = useMemo(() => categoryTotals(transactions, month), [transactions, month]);

  if (!ready) return <div className="py-20 text-center text-muted">Loading budgets…</div>;

  const rows = budgets.map((budget) => {
    const used = Math.abs(spent.find((item) => item.categoryId === budget.categoryId)?.amountCents ?? 0);
    const category = CATEGORIES.find((item) => item.id === budget.categoryId);
    return {
      ...budget,
      used,
      remaining: budget.monthlyCents - used,
      pct: budget.monthlyCents ? (used / budget.monthlyCents) * 100 : 0,
      name: category?.name ?? budget.categoryId,
      color: category?.color ?? "#A8A29E",
    };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Gentle limits"
        title="Budgets"
        subtitle="Pick a monthly number for the categories that tend to run away. Genie only counts spending, not transfers."
        actions={<MonthSwitcher value={month} onChange={setMonth} />}
      />

      <section className="card mb-5 p-5">
        <h2 className="mb-3 text-sm font-semibold">Add or update a budget</h2>
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            const dollars = Number(draftAmount);
            if (!Number.isFinite(dollars) || dollars < 0) return;
            void setBudget(draftId, Math.round(dollars * 100));
          }}
        >
          <CategoryPicker
            value={draftId}
            onChange={setDraftId}
            label="Budget category"
            excludeIds={["transfer", "income"]}
          />
          <input
            className="field"
            inputMode="decimal"
            value={draftAmount}
            onChange={(event) => setDraftAmount(event.target.value)}
            placeholder="Monthly amount"
          />
          <Button type="submit">Save</Button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {rows.length === 0 ? (
          <p className="text-sm text-muted">No budgets yet. Start with groceries or dining.</p>
        ) : (
          rows.map((row) => (
            <article key={row.id} className="card p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-2 font-semibold">
                    <CategoryDot color={row.color} />
                    {row.name}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatAbs(row.used)} of {formatAbs(row.monthlyCents)}
                  </p>
                </div>
                <span className={row.remaining < 0 ? "text-sm font-semibold text-rose" : "text-sm text-muted"}>
                  {row.remaining < 0 ? `${formatAbs(row.remaining)} over` : `${formatAbs(row.remaining)} left`}
                </span>
              </div>
              <Progress value={row.pct} color={row.pct > 100 ? "var(--rose)" : row.color} />
            </article>
          ))
        )}
      </section>
    </div>
  );
}