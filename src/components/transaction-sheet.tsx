"use client";

import { useEffect, useState } from "react";
import { formatLongDate } from "@/lib/dates";
import { updateTransaction } from "@/lib/store";
import type { Account, Transaction } from "@/lib/types";
import { CategoryPicker } from "./category-picker";
import { Money } from "./ui";

export function TransactionSheet({
  transaction,
  account,
  onClose,
}: {
  transaction: Transaction;
  account?: Account;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState(transaction.notes ?? "");
  const [saving, setSaving] = useState(false);
  const dirty = notes !== (transaction.notes ?? "");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  async function saveNotes() {
    setSaving(true);
    try {
      await updateTransaction(transaction.id, { notes: notes.trim() || "" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close details" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-card p-5 pb-10 shadow-2xl sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[min(32rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl sm:pb-5">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{formatLongDate(transaction.date)}</p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl leading-tight">{transaction.merchant}</h2>
            <p className="mt-1 text-sm text-muted">{account?.name ?? "Account"}</p>
          </div>
          <Money cents={transaction.amountCents} signed size="lg" />
        </div>

        {transaction.description !== transaction.merchant ? (
          <p className="mt-4 rounded-2xl bg-paper-2/70 px-3 py-2 text-sm leading-6 text-muted">{transaction.description}</p>
        ) : null}

        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold">Category</p>
            <CategoryPicker
              value={transaction.categoryId}
              onChange={(categoryId) => void updateTransaction(transaction.id, { categoryId })}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">Clarification</p>
            <textarea
              className="field min-h-24 resize-y"
              placeholder="What was this? Vet visit, dog food, split with Nina…"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" className="rounded-full px-4 py-2 text-sm font-semibold text-muted" onClick={onClose}>
                Close
              </button>
              <button
                type="button"
                className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                disabled={!dirty || saving}
                onClick={() => void saveNotes()}
              >
                {saving ? "Saving…" : "Save note"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
