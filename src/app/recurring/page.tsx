"use client";

import { categoryName } from "@/lib/categories";
import { formatAbs } from "@/lib/money";
import { setRecurringStatus, useHousehold } from "@/lib/store";
import { Button, Money, PageHeader } from "@/components/ui";

export default function RecurringPage() {
  const { recurring, ready } = useHousehold();
  const active = recurring.filter((item) => item.status === "active");
  const monthly = active
    .filter((item) => item.cadence === "monthly")
    .reduce((sum, item) => sum + item.amountCents, 0);
  const hidden = recurring.filter((item) => item.status !== "active");

  if (!ready) return <div className="py-20 text-center text-muted">Looking for repeating charges…</div>;

  return (
    <div>
      <PageHeader
        eyebrow="Subscriptions and bills"
        title="Recurring"
        subtitle="Genie looks for merchants that come back on a rhythm. Mark something ignored if it is not a real bill."
      />

      <section className="card mb-5 p-5">
        <p className="text-sm text-muted">Estimated monthly recurring</p>
        <div className="mt-2">
          <Money cents={Math.abs(monthly)} size="xl" />
        </div>
        <p className="mt-2 text-sm text-muted">{active.length} active charges</p>
      </section>

      <section className="card overflow-hidden">
        {active.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">No repeating charges yet. Import two or three months of history.</p>
        ) : (
          active.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 border-b border-line px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{item.displayName}</p>
                <p className="text-sm text-muted">
                  {categoryName(item.categoryId)} · {item.cadence} · last {item.lastSeen} · next {item.nextEstimated}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="tabular font-semibold">{formatAbs(item.amountCents)}</span>
                <Button variant="secondary" onClick={() => void setRecurringStatus(item.id, item.merchant, "ignored")}>
                  Not a bill
                </Button>
                <Button variant="ghost" onClick={() => void setRecurringStatus(item.id, item.merchant, "cancelled")}>
                  Cancelled
                </Button>
              </div>
            </div>
          ))
        )}
      </section>

      {hidden.length ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted">Hidden</h2>
          <div className="card divide-y divide-line overflow-hidden">
            {hidden.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-muted">
                  {item.displayName} · {item.status}
                </span>
                <Button variant="ghost" onClick={() => void setRecurringStatus(item.id, item.merchant, "active")}>
                  Restore
                </Button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}