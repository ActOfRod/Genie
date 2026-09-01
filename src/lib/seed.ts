import { addDays, format, startOfMonth, subMonths } from "date-fns";
import { guessCategory, displayMerchant } from "./categorize";
import { uid } from "./utils";
import type { Account, Budget, Transaction } from "./types";

const TODAY = new Date(2026, 7, 30);

function iso(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function txn(
  accountId: string,
  date: Date,
  description: string,
  dollars: number,
  categoryId?: string,
): Transaction {
  return {
    id: uid(),
    accountId,
    date: iso(date),
    description,
    merchant: displayMerchant(description),
    amountCents: Math.round(dollars * 100),
    categoryId: categoryId ?? guessCategory(description),
    source: "seed",
    excluded: false,
    createdAt: new Date().toISOString(),
  };
}

function monthlyAround(base: Date, day: number, months: number) {
  return Array.from({ length: months }, (_, i) => {
    const month = startOfMonth(subMonths(base, months - 1 - i));
    return addDays(month, day - 1);
  });
}

export function buildSampleHousehold() {
  const createdAt = new Date().toISOString();
  const amex: Account = {
    id: uid(),
    name: "Amex Gold",
    institution: "amex",
    type: "credit",
    mask: "1008",
    lastImportedAt: createdAt,
    createdAt,
  };
  const checking: Account = {
    id: uid(),
    name: "Genisys Checking",
    institution: "genisys",
    type: "checking",
    mask: "4421",
    lastImportedAt: createdAt,
    createdAt,
  };
  const savings: Account = {
    id: uid(),
    name: "Genisys Savings",
    institution: "genisys",
    type: "savings",
    mask: "7780",
    lastImportedAt: createdAt,
    createdAt,
  };

  const transactions: Transaction[] = [];

  for (const date of monthlyAround(TODAY, 1, 4)) {
    transactions.push(txn(checking.id, date, "ACME CORP PAYROLL", 4820.33, "income"));
  }
  for (const date of monthlyAround(TODAY, 15, 3)) {
    transactions.push(txn(checking.id, date, "ACME CORP PAYROLL", 4820.33, "income"));
  }
  for (const date of monthlyAround(TODAY, 3, 4)) {
    transactions.push(txn(checking.id, date, "MORTGAGE PAYMENT - ROCKET MTG", -2140.0, "housing"));
  }
  for (const date of monthlyAround(TODAY, 5, 4)) {
    transactions.push(txn(checking.id, date, "DTE ENERGY", -148.22, "utilities"));
    transactions.push(txn(checking.id, date, "XFINITY INTERNET", -89.99, "internet"));
    transactions.push(txn(checking.id, date, "GEICO AUTO", -142.18, "insurance"));
  }
  for (const date of monthlyAround(TODAY, 8, 4)) {
    transactions.push(txn(checking.id, date, "AMEX EPAYMENT ACH PMT", -1850.0, "transfer"));
    transactions.push(txn(amex.id, date, "PAYMENT THANK YOU", 1850.0, "transfer"));
  }
  for (const date of monthlyAround(TODAY, 12, 4)) {
    transactions.push(txn(checking.id, date, "TRANSFER TO GENISYS SAVINGS", -400.0, "transfer"));
    transactions.push(txn(savings.id, date, "TRANSFER FROM CHECKING", 400.0, "transfer"));
  }

  const subscriptions = [
    { day: 6, desc: "NETFLIX.COM", amount: -15.49 },
    { day: 7, desc: "SPOTIFY USA", amount: -16.99 },
    { day: 9, desc: "GOOGLE *YOUTUBE MEMBERSHIP", amount: -13.99 },
    { day: 11, desc: "APPLE.COM/BILL ICLOUD", amount: -2.99 },
    { day: 14, desc: "PLANET FITNESS", amount: -24.99 },
    { day: 18, desc: "NYTIMES DIGITAL", amount: -17.0 },
    { day: 21, desc: "AMAZON PRIME", amount: -14.99 },
  ];
  for (const sub of subscriptions) {
    for (const date of monthlyAround(TODAY, sub.day, 4)) {
      transactions.push(txn(amex.id, date, sub.desc, sub.amount, "subscriptions"));
    }
  }

  const extras: Array<[Date, string, number, string, string]> = [
    [new Date(2026, 7, 2), amex.id, -128.44, "MEIJER #184 AUBURN HILLS", "groceries"],
    [new Date(2026, 7, 4), amex.id, -64.12, "COSTCO WHSE #1234", "groceries"],
    [new Date(2026, 7, 6), amex.id, -42.8, "CHIPOTLE 2841", "dining"],
    [new Date(2026, 7, 7), amex.id, -6.45, "STARBUCKS STORE 11832", "coffee"],
    [new Date(2026, 7, 8), amex.id, -54.2, "SHELL OIL 575428", "gas"],
    [new Date(2026, 7, 9), amex.id, -86.19, "AMAZON.COM*MK4L9", "shopping"],
    [new Date(2026, 7, 11), amex.id, -38.0, "SWEETWATER TAVERN", "dining"],
    [new Date(2026, 7, 13), amex.id, -22.5, "CVS/PHARMACY #8122", "health"],
    [new Date(2026, 7, 16), amex.id, -19.48, "UBER TRIP HELP.UBER.COM", "transit"],
    [new Date(2026, 7, 17), amex.id, -112.3, "TARGET T- 000184", "shopping"],
    [new Date(2026, 7, 19), amex.id, -47.6, "HOME DEPOT #2731", "shopping"],
    [new Date(2026, 7, 20), checking.id, -60.0, "AUBURN HILLS WATER", "utilities"],
    [new Date(2026, 7, 22), amex.id, -73.15, "MEIJER #184 AUBURN HILLS", "groceries"],
    [new Date(2026, 7, 23), amex.id, -28.9, "PANERA BREAD #6021", "dining"],
    [new Date(2026, 7, 25), amex.id, -9.75, "BIGGBY COFFEE", "coffee"],
    [new Date(2026, 7, 26), amex.id, -156.0, "GREAT WOLF LODGE", "travel"],
    [new Date(2026, 7, 27), amex.id, -31.4, "REGAL CINEMAS", "entertainment"],
    [new Date(2026, 7, 28), amex.id, -18.99, "AUDIBLE", "subscriptions"],
    [new Date(2026, 6, 3), amex.id, -141.2, "MEIJER #184 AUBURN HILLS", "groceries"],
    [new Date(2026, 6, 9), amex.id, -71.08, "COSTCO WHSE #1234", "groceries"],
    [new Date(2026, 6, 12), amex.id, -48.3, "HOPCAT ROYAL OAK", "dining"],
    [new Date(2026, 6, 15), amex.id, -52.1, "BP#1234567 AUBURN HILLS", "gas"],
    [new Date(2026, 6, 19), amex.id, -94.55, "AMAZON.COM*7H2KQ", "shopping"],
    [new Date(2026, 6, 24), amex.id, -26.0, "ULTA BEAUTY", "personal"],
    [new Date(2026, 6, 28), checking.id, -75.0, "STONY CREEK METROPARK", "entertainment"],
    [new Date(2026, 5, 6), amex.id, -119.87, "KROGER 614", "groceries"],
    [new Date(2026, 5, 10), amex.id, -210.0, "IKEA CANTON", "shopping"],
    [new Date(2026, 5, 18), amex.id, -63.4, "OLIVE GARDEN", "dining"],
    [new Date(2026, 5, 22), amex.id, -49.99, "DELTA AIR 006", "travel"],
  ];

  for (const [date, accountId, dollars, description, categoryId] of extras) {
    transactions.push(txn(accountId, date, description, dollars, categoryId));
  }

  const budgets: Budget[] = [
    { id: uid(), categoryId: "groceries", monthlyCents: 70000 },
    { id: uid(), categoryId: "dining", monthlyCents: 25000 },
    { id: uid(), categoryId: "shopping", monthlyCents: 20000 },
    { id: uid(), categoryId: "gas", monthlyCents: 16000 },
    { id: uid(), categoryId: "subscriptions", monthlyCents: 12000 },
    { id: uid(), categoryId: "entertainment", monthlyCents: 8000 },
  ];

  return { accounts: [checking, savings, amex], transactions, budgets };
}