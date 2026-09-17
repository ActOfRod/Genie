"use client";

import { useMemo, useState } from "react";
import { monthKey } from "@/lib/dates";
import { useHousehold } from "@/lib/store";
import { CategoryPicker } from "@/components/category-picker";
import { MonthSwitcher, PageHeader } from "@/components/ui";
import { TransactionRow } from "@/components/transaction-row";

export default function ActivityPage() {
  const { accounts, transactions, ready } = useHousehold();
  const [month, setMonth] = useState(monthKey());
  const [query, setQuery] = useState("");
  const [accountId, setAccountId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return transactions.filter((txn) => {
      if (month !== "all" && !txn.date.startsWith(month)) return false;
      if (accountId !== "all" && txn.accountId !== accountId) return false;
      if (categoryId !== "all" && txn.categoryId !== categoryId) return false;
      if (!needle) return true;
      return `${txn.merchant} ${txn.description}`.toLowerCase().includes(needle);
    });
  }, [transactions, month, query, accountId, categoryId]);

  if (!ready) return <div className="py-20 text-center text-muted">Loading activity…</div>;

  return (
    <div>
      <PageHeader
        eyebrow="Every dollar"
        title="Activity"
        subtitle="Tap a row for details, a category, and a note. Built for a phone thumb."
        actions={<MonthSwitcher value={month} onChange={setMonth} />}
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <input
          className="field"
          placeholder="Search merchants"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setAccountId("all")}
            className={`shrink-0 rounded-full border px-3 py-2 text-sm ${accountId === "all" ? "border-teal bg-teal-soft text-teal-dark" : "border-line bg-card text-muted"}`}
          >
            All accounts
          </button>
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              onClick={() => setAccountId(account.id)}
              className={`shrink-0 rounded-full border px-3 py-2 text-sm ${accountId === account.id ? "border-teal bg-teal-soft text-teal-dark" : "border-line bg-card text-muted"}`}
            >
              {account.name}
            </button>
          ))}
        </div>
        <CategoryPicker allowAll value={categoryId} onChange={setCategoryId} label="Filter category" />
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3 text-sm text-muted">
          {rows.length} transaction{rows.length === 1 ? "" : "s"}
        </div>
        <div className="divide-y divide-line">
          {rows.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted">Nothing matches those filters.</p>
          ) : (
            rows.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                account={accounts.find((account) => account.id === transaction.accountId)}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}