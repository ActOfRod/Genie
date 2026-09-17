import { differenceInCalendarDays, parseISO } from "date-fns";
import { estimateNext } from "./dates";
import { titleCase } from "./utils";
import type { RecurringCadence, RecurringCharge, Transaction } from "./types";

const NOISE =
  /\b(ACH|WITHDRAWAL|DEBIT|CREDIT|CARD|PURCHASE|MOBILE|BANKING|WEB|POS|RECURRING|ONLINE|ELECTRONIC|PAYMENT|PAYMT|PMT|PYMT|TRANSFER|TO|FROM|CHECK)\b/g;
const STOP = new Set(["THE", "A", "AN", "AND", "FOR", "INC", "LLC"]);

export function recurringMerchantKey(description: string, merchant = "") {
  const source = `${description} ${merchant}`
    .toUpperCase()
    .replace(/[#*]/g, " ")
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(NOISE, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = source.split(" ").filter((word) => word && !STOP.has(word));
  if (words.length === 0) return (merchant || description).toLowerCase().slice(0, 32);
  return words.slice(0, 2).join(" ");
}

function amountClose(a: number, b: number) {
  const max = Math.max(Math.abs(a), Math.abs(b), 1);
  return Math.abs(a - b) / max <= 0.08 || Math.abs(a - b) <= 150;
}

function cadenceFromGaps(gaps: number[]): RecurringCadence | null {
  if (gaps.length === 0) return null;
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const mid = sortedGaps[Math.floor(sortedGaps.length / 2)];
  if (mid >= 6 && mid <= 10) return "weekly";
  if (mid >= 25 && mid <= 40) return "monthly";
  if (mid >= 350 && mid <= 395) return "yearly";
  return null;
}

export function isLapsed(lastSeen: string, cadence: RecurringCadence, asOf = new Date()) {
  const days = differenceInCalendarDays(asOf, parseISO(lastSeen));
  if (cadence === "weekly") return days > 18;
  if (cadence === "yearly") return days > 400;
  return days > 50;
}

export function detectRecurring(transactions: Transaction[], asOf = new Date()): RecurringCharge[] {
  const groups = new Map<string, Transaction[]>();

  for (const txn of transactions) {
    if (txn.excluded || txn.amountCents >= 0) continue;
    if (txn.categoryId === "transfer" || txn.categoryId === "income") continue;
    const key = recurringMerchantKey(txn.description, txn.merchant);
    if (!key) continue;
    const list = groups.get(key) ?? [];
    list.push(txn);
    groups.set(key, list);
  }

  const recurring: RecurringCharge[] = [];

  for (const [key, list] of groups) {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const window = sorted.slice(-8);
    if (window.length < 2) continue;

    const gaps = [];
    for (let i = 1; i < window.length; i += 1) {
      gaps.push(differenceInCalendarDays(parseISO(window[i].date), parseISO(window[i - 1].date)));
    }

    const cadence = cadenceFromGaps(gaps);
    if (!cadence) continue;

    const last = window[window.length - 1];
    if (isLapsed(last.date, cadence, asOf)) continue;

    const similar = window.filter((txn) => amountClose(txn.amountCents, last.amountCents));
    const amountSource = similar.length >= 2 ? similar : [last];
    const avg = Math.round(amountSource.reduce((sum, txn) => sum + txn.amountCents, 0) / amountSource.length);

    recurring.push({
      id: key.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      merchant: titleCase(key),
      displayName: titleCase(key),
      amountCents: avg,
      cadence,
      categoryId: last.categoryId,
      lastSeen: last.date,
      nextEstimated: estimateNext(last.date, cadence),
      status: "active",
      count: window.length,
    });
  }

  return recurring.sort((a, b) => a.amountCents - b.amountCents);
}