import { differenceInCalendarDays, parseISO } from "date-fns";
import { estimateNext } from "./dates";
import { uid } from "./utils";
import type { RecurringCharge, RecurringCadence, Transaction } from "./types";

function amountClose(a: number, b: number) {
  const max = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / max <= 0.08 || Math.abs(a - b) <= 150;
}

function cadenceFromGaps(gaps: number[]): RecurringCadence | null {
  if (gaps.length === 0) return null;
  const avg = gaps.reduce((sum, n) => sum + n, 0) / gaps.length;
  if (avg >= 6 && avg <= 10) return "weekly";
  if (avg >= 25 && avg <= 40) return "monthly";
  if (avg >= 350 && avg <= 395) return "yearly";
  return null;
}

export function detectRecurring(transactions: Transaction[]): RecurringCharge[] {
  const groups = new Map<string, Transaction[]>();

  for (const txn of transactions) {
    if (txn.excluded || txn.amountCents >= 0) continue;
    if (txn.categoryId === "transfer" || txn.categoryId === "income") continue;
    const key = `${txn.merchant.toLowerCase()}|${Math.round(Math.abs(txn.amountCents) / 100)}`;
    const list = groups.get(key) ?? [];
    list.push(txn);
    groups.set(key, list);
  }

  const recurring: RecurringCharge[] = [];

  for (const [, list] of groups) {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length < 2) continue;

    const gaps = [];
    for (let i = 1; i < sorted.length; i += 1) {
      gaps.push(differenceInCalendarDays(parseISO(sorted[i].date), parseISO(sorted[i - 1].date)));
    }

    const cadence = cadenceFromGaps(gaps);
    if (!cadence) continue;
    if (!sorted.every((txn) => amountClose(txn.amountCents, sorted[0].amountCents))) continue;

    const last = sorted[sorted.length - 1];
    const avg = Math.round(
      sorted.reduce((sum, txn) => sum + txn.amountCents, 0) / sorted.length,
    );

    recurring.push({
      id: uid(),
      merchant: last.merchant,
      displayName: last.merchant,
      amountCents: avg,
      cadence,
      categoryId: last.categoryId,
      lastSeen: last.date,
      nextEstimated: estimateNext(last.date, cadence),
      status: "active",
      count: sorted.length,
    });
  }

  return recurring.sort((a, b) => a.amountCents - b.amountCents);
}