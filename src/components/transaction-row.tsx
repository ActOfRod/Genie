"use client";

import { useState } from "react";
import { formatShortDate } from "@/lib/dates";
import type { Account, Transaction } from "@/lib/types";
import { CategoryChip } from "./category-picker";
import { TransactionSheet } from "./transaction-sheet";
import { Money } from "./ui";

export function TransactionRow({
  transaction,
  account,
}: {
  transaction: Transaction;
  account?: Account;
  editable?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid w-full grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left hover:bg-paper-2/40"
      >
        <div className="text-xs font-medium text-muted">{formatShortDate(transaction.date)}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{transaction.merchant}</p>
          <div className="mt-1 flex items-center gap-2">
            <CategoryChip categoryId={transaction.categoryId} />
            {transaction.notes ? <span className="truncate text-[11px] text-muted">{transaction.notes}</span> : null}
          </div>
        </div>
        <Money cents={transaction.amountCents} signed size="sm" />
      </button>
      {open ? <TransactionSheet transaction={transaction} account={account} onClose={() => setOpen(false)} /> : null}
    </>
  );
}