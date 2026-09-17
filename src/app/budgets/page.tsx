"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { monthKey, previousMonthKey } from "@/lib/dates";
import { formatAbs } from "@/lib/money";
import {
  answerAffordability,
  BUDGET_PREFERENCES,
  suggestBudgets,
  type BudgetPreference,
} from "@/lib/budget-plan";
import { categoryTotals, monthSummary, setBudget, setBudgets, useHousehold } from "@/lib/store";
import { CategoryPicker } from "@/components/category-picker";
import { Button, CategoryDot, MonthSwitcher, PageHeader, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function BudgetsPage() {
  const { budgets, transactions, ready } = useHousehold();
  const [month, setMonth] = useState(monthKey());
  const [draftId, setDraftId] = useState("dining");
  const [draftAmount, setDraftAmount] = useState("250");
  const [preference, setPreference] = useState<BudgetPreference>("balanced");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const spent = useMemo(() => categoryTotals(transactions, month), [transactions, month]);
  const plan = useMemo(() => suggestBudgets(transactions, preference), [transactions, preference]);
  const summary = useMemo(() => monthSummary(transactions, month), [transactions, month]);
  const typicalLeftover = useMemo(() => {
    const keys = [month, previousMonthKey(month), previousMonthKey(previousMonthKey(month))];
    const total = keys.reduce((sum, key) => sum + monthSummary(transactions, key).leftover, 0);
    return Math.round(total / keys.length);
  }, [transactions, month]);

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
        subtitle="Tell Genie how you want the month to feel, or pick a monthly number yourself. Only spending counts, not transfers."
        actions={<MonthSwitcher value={month} onChange={setMonth} />}
      />

      <section className="card mb-5 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Let Genie build it</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Pick how you want the month to feel. Genie uses the last three months of spending — not a
          chatbot — then writes monthly caps you can still edit.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {BUDGET_PREFERENCES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreference(item.id)}
              className={cn(
                "rounded-2xl border px-4 py-3 text-left transition",
                preference === item.id ? "border-teal bg-teal-soft" : "border-line bg-card hover:bg-paper-2",
              )}
            >
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{item.blurb}</p>
            </button>
          ))}
        </div>
        {plan.suggestions.length ? (
          <div className="mt-4 rounded-2xl bg-paper-2/70 px-4 py-3 text-sm">
            <p className="text-muted">
              Aim to leave {formatAbs(plan.savingsCents)} unspent
              {plan.incomeCents ? ` of ${formatAbs(plan.incomeCents)} typical pay` : ""}.
            </p>
            <ul className="mt-2 space-y-1">
              {plan.suggestions.slice(0, 6).map((row) => (
                <li key={row.categoryId} className="flex justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <CategoryDot color={row.color} />
                    {row.name}
                  </span>
                  <span className="tabular">{formatAbs(row.monthlyCents)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Import a few months of spending first.</p>
        )}
        <div className="mt-4">
          <Button
            disabled={!plan.suggestions.length || savingPlan}
            onClick={() => {
              setSavingPlan(true);
              void setBudgets(plan.suggestions.map((row) => ({
                categoryId: row.categoryId,
                monthlyCents: row.monthlyCents,
              }))).finally(() => setSavingPlan(false));
            }}
          >
            {savingPlan ? "Writing budgets…" : "Use this budget"}
          </Button>
        </div>
      </section>

      <section className="card mb-5 p-5">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">Can we afford this?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          Ask with a dollar amount. Genie checks leftover cash and the matching category budget.
        </p>
        <form
          className="mt-4 flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            setAnswer(
              answerAffordability(question, {
                leftoverCents: summary.leftover,
                typicalLeftoverCents: typicalLeftover,
                incomeCents: summary.income || plan.incomeCents,
                budgets,
                spentByCategory: new Map(spent.map((row) => [row.categoryId, row.amountCents])),
              }),
            );
          }}
        >
          <input
            className="field"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Can we afford $80 for dinner?"
          />
          <Button type="submit">Ask Genie</Button>
        </form>
        {answer ? <p className="mt-3 text-sm leading-6">{answer}</p> : null}
      </section>

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