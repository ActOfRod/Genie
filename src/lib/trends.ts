import { format, parseISO } from "date-fns";
import { isTransferLike } from "./categories";
import { inMonth, monthKey, previousMonthKey } from "./dates";
import { recurringMerchantKey } from "./subscriptions";
import type { RecurringCharge, Transaction } from "./types";

function spendIn(transactions: Transaction[], month: string) {
  return transactions
    .filter((txn) => inMonth(txn.date, month) && !txn.excluded && !isTransferLike(txn.categoryId) && txn.amountCents < 0)
    .reduce((sum, txn) => sum + txn.amountCents, 0);
}

function incomeIn(transactions: Transaction[], month: string) {
  return transactions
    .filter((txn) => inMonth(txn.date, month) && !txn.excluded && txn.categoryId === "income")
    .reduce((sum, txn) => sum + txn.amountCents, 0);
}

export interface MonthPoint {
  month: string;
  label: string;
  spend: number;
  income: number;
  recurring: number;
}

export function monthPoints(transactions: Transaction[], recurring: RecurringCharge[] = [], count = 8): MonthPoint[] {
  const keys: string[] = [];
  let key = monthKey();
  for (let i = 0; i < count; i += 1) {
    keys.unshift(key);
    key = previousMonthKey(key);
  }

  const recurringKeys = new Set(recurring.filter((item) => item.status === "active").map((item) => item.id));

  return keys.map((month) => {
    let recurringSpend = 0;
    for (const txn of transactions) {
      if (!txn.date.startsWith(month) || txn.excluded || txn.amountCents >= 0) continue;
      const id = recurringMerchantKey(txn.description, txn.merchant).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (recurringKeys.has(id)) recurringSpend += txn.amountCents;
    }
    return {
      month,
      label: format(parseISO(`${month}-01`), "MMM"),
      spend: Math.abs(spendIn(transactions, month)),
      income: Math.max(0, incomeIn(transactions, month)),
      recurring: Math.abs(recurringSpend),
    };
  });
}
