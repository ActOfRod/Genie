"use client";

import { CATEGORIES, categoryColor, categoryName } from "@/lib/categories";
import { formatShortDate } from "@/lib/dates";
import type { Account, Transaction } from "@/lib/types";
import { updateTransactionCategory } from "@/lib/store";
import { CategoryDot, Money } from "./ui";

export function TransactionRow({
  transaction,
  account,
  editable = true,
}: {
  transaction: Transaction;
  account?: Account;
  editable?: boolean;
}) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 px-4 py-3 md:grid-cols-[5rem_minmax(0,1fr)_11rem_auto]">
      <div className="text-xs font-medium text-muted">{formatShortDate(transaction.date)}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{transaction.merchant}</p>
        <p className="truncate text-xs text-muted">
          {account?.name ?? "Account"}
          {transaction.description !== transaction.merchant ? ` · ${transaction.description}` : ""}
        </p>
        <div className="mt-1 md:hidden">
          {editable ? (
            <select
              className="max-w-full rounded-full border border-line bg-card px-2 py-1 text-xs text-muted"
              value={transaction.categoryId}
              onChange={(event) => void updateTransactionCategory(transaction.id, event.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs text-muted">
              <CategoryDot color={categoryColor(transaction.categoryId)} />
              {categoryName(transaction.categoryId)}
            </span>
          )}
        </div>
      </div>
      <div className="hidden md:block">
        {editable ? (
          <select
            className="w-full rounded-full border border-transparent bg-transparent px-2 py-1 text-xs text-muted hover:border-line"
            value={transaction.categoryId}
            onChange={(event) => void updateTransactionCategory(transaction.id, event.target.value)}
          >
            {CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="inline-flex items-center gap-2 text-xs text-muted">
            <CategoryDot color={categoryColor(transaction.categoryId)} />
            {categoryName(transaction.categoryId)}
          </span>
        )}
      </div>
      <Money cents={transaction.amountCents} signed size="sm" />
    </div>
  );
}