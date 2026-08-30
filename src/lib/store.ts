"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./db";
import { buildSampleHousehold } from "./seed";
import { detectRecurring } from "./subscriptions";
import { fingerprint, parseStatement } from "./parsers";
import { guessCategory } from "./categorize";
import { uid } from "./utils";
import { inMonth, monthBounds, monthKey, previousMonthKey } from "./dates";
import { CATEGORIES, isTransferLike } from "./categories";
import type { Account, Institution, Transaction } from "./types";

const META_ID = "household";

export function useHousehold() {
  const meta = useLiveQuery(() => db.meta.get(META_ID));
  const accounts = useLiveQuery(() => db.accounts.toArray()) ?? [];
  const transactions = useLiveQuery(() => db.transactions.orderBy("date").reverse().toArray()) ?? [];
  const budgets = useLiveQuery(() => db.budgets.toArray()) ?? [];
  const recurring = useLiveQuery(() => db.recurring.toArray()) ?? [];
  const ready = meta !== undefined && accounts !== undefined;

  return { meta, accounts, transactions, budgets, recurring, ready };
}

export async function ensureHousehold() {
  const existing = await db.meta.get(META_ID);
  if (existing) return existing;
  const sample = buildSampleHousehold();
  const recurring = detectRecurring(sample.transactions);
  await db.transaction("rw", db.meta, db.accounts, db.transactions, db.budgets, db.recurring, async () => {
    await db.meta.put({
      id: META_ID,
      name: "Our household",
      seeded: true,
      createdAt: new Date().toISOString(),
    });
    await db.accounts.bulkAdd(sample.accounts);
    await db.transactions.bulkAdd(sample.transactions);
    await db.budgets.bulkAdd(sample.budgets);
    await db.recurring.bulkAdd(recurring);
  });
  return db.meta.get(META_ID);
}

export async function resetHousehold(mode: "sample" | "empty") {
  await db.transaction("rw", db.meta, db.accounts, db.transactions, db.budgets, db.recurring, async () => {
    await Promise.all([
      db.meta.clear(),
      db.accounts.clear(),
      db.transactions.clear(),
      db.budgets.clear(),
      db.recurring.clear(),
    ]);
  });

  if (mode === "sample") {
    await ensureHousehold();
    return;
  }

  await db.meta.put({
    id: META_ID,
    name: "Our household",
    seeded: false,
    createdAt: new Date().toISOString(),
  });
}

export async function renameHousehold(name: string) {
  const meta = await db.meta.get(META_ID);
  if (!meta) return;
  await db.meta.put({ ...meta, name });
}

export async function addAccount(input: {
  name: string;
  institution: Institution;
  type: Account["type"];
  mask?: string;
}) {
  const account: Account = {
    id: uid(),
    name: input.name,
    institution: input.institution,
    type: input.type,
    mask: input.mask,
    createdAt: new Date().toISOString(),
  };
  await db.accounts.add(account);
  return account;
}

export async function removeAccount(accountId: string) {
  await db.transaction("rw", db.accounts, db.transactions, db.recurring, async () => {
    await db.accounts.delete(accountId);
    await db.transactions.where("accountId").equals(accountId).delete();
  });
  await refreshRecurring();
}

export async function importParsed(accountId: string, fileText: string, filename: string) {
  const parsed = parseStatement(fileText, filename);
  const existing = await db.transactions.where("accountId").equals(accountId).toArray();
  const seen = new Set(
    existing.map((txn) =>
      fingerprint(accountId, {
        date: txn.date,
        description: txn.description,
        merchant: txn.merchant,
        amountCents: txn.amountCents,
        externalId: txn.externalId,
      }),
    ),
  );

  const toAdd: Transaction[] = [];
  let skipped = 0;
  for (const row of parsed.transactions) {
    const key = fingerprint(accountId, row);
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    toAdd.push({
      id: uid(),
      accountId,
      date: row.date,
      description: row.description,
      merchant: row.merchant,
      amountCents: row.amountCents,
      categoryId: row.categoryHint ?? guessCategory(row.description),
      externalId: row.externalId,
      source: "import",
      excluded: false,
      createdAt: new Date().toISOString(),
    });
  }

  await db.transaction("rw", db.transactions, db.accounts, async () => {
    if (toAdd.length) await db.transactions.bulkAdd(toAdd);
    const account = await db.accounts.get(accountId);
    if (account) {
      await db.accounts.put({ ...account, lastImportedAt: new Date().toISOString() });
    }
  });
  await refreshRecurring();

  return {
    parsed,
    imported: toAdd.length,
    skipped,
  };
}

export async function updateTransactionCategory(id: string, categoryId: string) {
  await db.transactions.update(id, { categoryId });
  await refreshRecurring();
}

export async function setBudget(categoryId: string, monthlyCents: number) {
  const existing = await db.budgets.where("categoryId").equals(categoryId).first();
  if (existing) {
    await db.budgets.put({ ...existing, monthlyCents });
    return;
  }
  await db.budgets.add({ id: uid(), categoryId, monthlyCents });
}

export async function setRecurringStatus(id: string, status: "active" | "ignored" | "cancelled") {
  await db.recurring.update(id, { status });
}

export async function refreshRecurring() {
  const transactions = await db.transactions.toArray();
  const detected = detectRecurring(transactions);
  const existing = await db.recurring.toArray();
  const statusByMerchant = new Map(existing.map((item) => [item.merchant.toLowerCase(), item.status]));

  await db.transaction("rw", db.recurring, async () => {
    await db.recurring.clear();
    await db.recurring.bulkAdd(
      detected.map((item) => ({
        ...item,
        status: statusByMerchant.get(item.merchant.toLowerCase()) ?? "active",
      })),
    );
  });
}

export async function exportBackup() {
  const [meta, accounts, transactions, budgets, recurring] = await Promise.all([
    db.meta.get(META_ID),
    db.accounts.toArray(),
    db.transactions.toArray(),
    db.budgets.toArray(),
    db.recurring.toArray(),
  ]);
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), meta, accounts, transactions, budgets, recurring }, null, 2);
}

export async function importBackup(json: string) {
  const data = JSON.parse(json) as {
    meta?: { name?: string; seeded?: boolean };
    accounts?: Account[];
    transactions?: Transaction[];
    budgets?: { id: string; categoryId: string; monthlyCents: number }[];
    recurring?: Awaited<ReturnType<typeof detectRecurring>>;
  };

  await db.transaction("rw", db.meta, db.accounts, db.transactions, db.budgets, db.recurring, async () => {
    await Promise.all([
      db.meta.clear(),
      db.accounts.clear(),
      db.transactions.clear(),
      db.budgets.clear(),
      db.recurring.clear(),
    ]);
    await db.meta.put({
      id: META_ID,
      name: data.meta?.name ?? "Our household",
      seeded: Boolean(data.meta?.seeded),
      createdAt: new Date().toISOString(),
    });
    if (data.accounts?.length) await db.accounts.bulkAdd(data.accounts);
    if (data.transactions?.length) await db.transactions.bulkAdd(data.transactions);
    if (data.budgets?.length) await db.budgets.bulkAdd(data.budgets);
    if (data.recurring?.length) await db.recurring.bulkAdd(data.recurring);
  });
}

export function spendingInMonth(transactions: Transaction[], key: string) {
  return transactions
    .filter((txn) => inMonth(txn.date, key) && !txn.excluded && !isTransferLike(txn.categoryId) && txn.amountCents < 0)
    .reduce((sum, txn) => sum + txn.amountCents, 0);
}

export function incomeInMonth(transactions: Transaction[], key: string) {
  return transactions
    .filter((txn) => inMonth(txn.date, key) && !txn.excluded && txn.categoryId === "income")
    .reduce((sum, txn) => sum + txn.amountCents, 0);
}

export function categoryTotals(transactions: Transaction[], key: string) {
  const totals = new Map<string, number>();
  for (const txn of transactions) {
    if (!inMonth(txn.date, key) || txn.excluded || isTransferLike(txn.categoryId) || txn.amountCents >= 0) {
      continue;
    }
    totals.set(txn.categoryId, (totals.get(txn.categoryId) ?? 0) + txn.amountCents);
  }
  return [...totals.entries()]
    .map(([categoryId, amountCents]) => ({
      categoryId,
      amountCents,
      name: CATEGORIES.find((category) => category.id === categoryId)?.name ?? categoryId,
      color: CATEGORIES.find((category) => category.id === categoryId)?.color ?? "#A8A29E",
    }))
    .sort((a, b) => a.amountCents - b.amountCents);
}

export function monthSummary(transactions: Transaction[], key = monthKey()) {
  const spent = spendingInMonth(transactions, key);
  const income = incomeInMonth(transactions, key);
  const prev = spendingInMonth(transactions, previousMonthKey(key));
  const { start, end } = monthBounds(key);
  return { key, start, end, spent, income, leftover: income + spent, prev, delta: spent - prev };
}