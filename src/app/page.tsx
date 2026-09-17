"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { categoryTotals, monthSummary, useHousehold } from "@/lib/store";
import { monthKey } from "@/lib/dates";
import { formatAbs } from "@/lib/money";
import { monthPoints } from "@/lib/trends";
import { Button, CategoryDot, Money, MonthSwitcher, PageHeader, Progress } from "@/components/ui";
import { TransactionRow } from "@/components/transaction-row";
import { TrendChart } from "@/components/trend-chart";

export default function HomePage() {
  const { meta, accounts, transactions, recurring, ready } = useHousehold();
  const [month, setMonth] = useState(monthKey());
  const summary = useMemo(() => monthSummary(transactions, month), [transactions, month]);
  const categories = useMemo(() => categoryTotals(transactions, month), [transactions, month]);
  const maxSpend = Math.max(...categories.map((item) => Math.abs(item.amountCents)), 1);
  const upcoming = recurring.filter((item) => item.status === "active").slice(0, 5);
  const recent = transactions.filter((txn) => txn.date.startsWith(month)).slice(0, 6);
  const points = useMemo(() => monthPoints(transactions, recurring, 8), [transactions, recurring]);

  if (!ready) {
    return <div className="py-20 text-center text-muted">Opening the household books…</div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow={meta?.name ?? "Household"}
        title="How the month looks"
        subtitle="Spend versus income, plus the bills that keep coming back."
        actions={<MonthSwitcher value={month} onChange={setMonth} />}
      />

      {transactions.length === 0 ? (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-gold/40 bg-[#fff6e3] px-4 py-3 text-sm text-ink sm:flex-row sm:items-center sm:justify-between">
          <p>The books are empty. Import an Amex or Genisys statement to get started.</p>
          <Button href="/accounts" variant="secondary">
            Import statements
          </Button>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <article className="card p-5">
          <div className="mb-1 flex items-end justify-between gap-3">
            <div>
              <p className="text-sm text-muted">Spend vs income</p>
              <div className="mt-1">
                <Money cents={Math.abs(summary.spent)} size="lg" />
              </div>
            </div>
            <p className="text-right text-xs leading-5 text-muted">
              {summary.income > 0 ? `${formatAbs(summary.income)} in pay` : "No pay this month"}
              <br />
              {summary.delta < 0
                ? `${formatAbs(summary.delta)} less than last month`
                : summary.delta > 0
                  ? `${formatAbs(summary.delta)} more than last month`
                  : "Same as last month"}
            </p>
          </div>
          <TrendChart points={points} primaryLabel="Spend" secondaryLabel="Income" />
        </article>
        <article className="card p-5">
          <p className="text-sm text-muted">Left after bills and spending</p>
          <div className="mt-2">
            <Money cents={summary.leftover} signed size="lg" />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            Income minus spending, ignoring transfers. Tap a transaction below to recategorize it.
          </p>
        </article>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Where it went</h2>
            <Link href="/activity" className="text-sm font-semibold text-teal">
              Activity
            </Link>
          </div>
          <div className="space-y-3">
            {categories.length === 0 ? (
              <p className="text-sm text-muted">No spending in this month yet.</p>
            ) : (
              categories.slice(0, 6).map((item) => (
                <div key={item.categoryId}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <CategoryDot color={item.color} />
                      {item.name}
                    </span>
                    <span className="tabular text-muted">{formatAbs(item.amountCents)}</span>
                  </div>
                  <Progress value={(Math.abs(item.amountCents) / maxSpend) * 100} color={item.color} />
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-2xl">Coming back around</h2>
            <Link href="/recurring" className="text-sm font-semibold text-teal">
              Recurring
            </Link>
          </div>
          <div className="divide-y divide-line">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted">Live bills show up here after they hit a few months in a row.</p>
            ) : (
              upcoming.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold">{item.displayName}</p>
                    <p className="text-xs text-muted">Next {item.nextEstimated}</p>
                  </div>
                  <Money cents={item.amountCents} size="sm" />
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="card mt-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl">Recent activity</h2>
          <div className="flex max-w-[50%] flex-wrap justify-end gap-2 text-xs text-muted">
            {accounts.map((account) => (
              <span key={account.id} className="rounded-full bg-paper-2 px-2 py-1">
                {account.name}
              </span>
            ))}
          </div>
        </div>
        <div className="divide-y divide-line">
          {recent.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              account={accounts.find((account) => account.id === transaction.accountId)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
