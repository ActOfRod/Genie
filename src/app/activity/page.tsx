"use client";

import { useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { monthKey } from "@/lib/dates";
import { useHousehold } from "@/lib/store";
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
        subtitle="Search, filter, and recategorize. Tap a category on a row to change it."
        actions={<MonthSwitcher value={month} onChange={setMonth} />}
      />

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <input
          className="field"
          placeholder="Search merchants"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select className="field" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
          <option value="all">All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </select>
        <select className="field" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          <option value="all">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
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