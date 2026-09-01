"use client";

import { format } from "date-fns";
import { ImportPanel } from "@/components/import-panel";
import { Button, PageHeader } from "@/components/ui";
import { removeAccount, useHousehold } from "@/lib/store";

export default function AccountsPage() {
  const { accounts, transactions, ready } = useHousehold();

  if (!ready) return <div className="py-20 text-center text-muted">Loading accounts…</div>;

  return (
    <div>
      <PageHeader
        eyebrow="Amex and Genisys"
        title="Accounts"
        subtitle="Add the cards and credit union accounts you actually use, then keep them current with a file download."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        {accounts.length === 0 ? (
          <p className="text-sm text-muted">No accounts yet. Create one below and import a statement.</p>
        ) : (
          accounts.map((account) => {
            const count = transactions.filter((txn) => txn.accountId === account.id).length;
            return (
              <article key={account.id} className="card p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {account.institution === "amex" ? "American Express" : account.institution === "genisys" ? "Genisys CU" : "Other"}
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl">{account.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {account.type}
                  {account.mask ? ` · ••${account.mask}` : ""} · {count} transactions
                </p>
                <p className="mt-3 text-xs text-muted">
                  {account.lastImportedAt
                    ? `Last import ${format(new Date(account.lastImportedAt), "MMM d, yyyy")}`
                    : "No imports yet"}
                </p>
                <div className="mt-4">
                  <Button variant="ghost" onClick={() => void removeAccount(account.id)}>
                    Remove
                  </Button>
                </div>
              </article>
            );
          })
        )}
      </section>

      <ImportPanel accounts={accounts} />
    </div>
  );
}