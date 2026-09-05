"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDb } from "./db";
import { buildSampleHousehold } from "./seed";
import { detectRecurring } from "./subscriptions";
import { fingerprint, parseStatement } from "./parsers";
import { guessCategory } from "./categorize";
import { uid } from "./utils";
import { inMonth, monthBounds, monthKey, previousMonthKey } from "./dates";
import { CATEGORIES, isTransferLike } from "./categories";
import type { Account, Budget, HouseholdMeta, Institution, RecurringCharge, RecurringStatus, Transaction } from "./types";

const META_ID = "household";

export function useHousehold() {
  const meta = useLiveQuery<HouseholdMeta | undefined>(() =>
    typeof indexedDB === "undefined" ? Promise.resolve(undefined) : getDb().meta.get(META_ID),
  );
  const accounts = useLiveQuery<Account[]>(() =>
    typeof indexedDB === "undefined" ? Promise.resolve([] as Account[]) : getDb().accounts.toArray(),
  );
  const transactionRows = useLiveQuery<Transaction[]>(() =>
    typeof indexedDB === "undefined"
      ? Promise.resolve([] as Transaction[])
      : getDb().transactions.orderBy("date").reverse().toArray(),
  );
  const budgets = useLiveQuery<Budget[]>(() =>
    typeof indexedDB === "undefined" ? Promise.resolve([] as Budget[]) : getDb().budgets.toArray(),
  );
  const overrides = useLiveQuery<RecurringCharge[]>(() =>
    typeof indexedDB === "undefined" ? Promise.resolve([] as RecurringCharge[]) : getDb().recurring.toArray(),
  );
  const ready = meta !== undefined;
  const transactions = transactionRows ?? [];

  const recurring = useMemo(() => {
    const statusByMerchant = new Map(
      (overrides ?? []).map((item) => [item.merchant.toLowerCase(), item.status]),
    );
    return detectRecurring(transactionRows ?? []).map((item) => ({
      ...item,
      status: statusByMerchant.get(item.merchant.toLowerCase()) ?? "active",
    }));
  }, [transactionRows, overrides]);

  return {
    meta,
    accounts: accounts ?? [],
    transactions,
    budgets: budgets ?? [],
    recurring,
    ready,
  };
}

export async function ensureHousehold() {
  const existing = await getDb().meta.get(META_ID);
  if (existing) return existing;
  const sample = buildSampleHousehold();
  const recurring = detectRecurring(sample.transactions);
  await getDb().transaction("rw", getDb().meta, getDb().accounts, getDb().transactions, getDb().budgets, getDb().recurring, async () => {
    await getDb().meta.put({
      id: META_ID,
      name: "Our household",
      seeded: true,
      createdAt: new Date().toISOString(),
    });
    await getDb().accounts.bulkAdd(sample.accounts);
    await getDb().transactions.bulkAdd(sample.transactions);
    await getDb().budgets.bulkAdd(sample.budgets);
    await getDb().recurring.bulkAdd(recurring);
  });
  return getDb().meta.get(META_ID);
}

export async function resetHousehold(mode: "sample" | "empty") {
  await getDb().transaction("rw", getDb().meta, getDb().accounts, getDb().transactions, getDb().budgets, getDb().recurring, async () => {
    await Promise.all([
      getDb().meta.clear(),
      getDb().accounts.clear(),
      getDb().transactions.clear(),
      getDb().budgets.clear(),
      getDb().recurring.clear(),
    ]);
  });

  if (mode === "sample") {
    await ensureHousehold();
    return;
  }

  await getDb().meta.put({
    id: META_ID,
    name: "Our household",
    seeded: false,
    createdAt: new Date().toISOString(),
  });
}

export async function renameHousehold(name: string) {
  const meta = await getDb().meta.get(META_ID);
  if (!meta) return;
  await getDb().meta.put({ ...meta, name });
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
  await getDb().accounts.add(account);
  return account;
}

export async function removeAccount(accountId: string) {
  await getDb().transaction("rw", getDb().accounts, getDb().transactions, getDb().recurring, async () => {
    await getDb().accounts.delete(accountId);
    await getDb().transactions.where("accountId").equals(accountId).delete();
  });
}

export async function importParsed(accountId: string, fileText: string, filename: string) {
  const parsed = parseStatement(fileText, filename);
  const existing = await getDb().transactions.where("accountId").equals(accountId).toArray();
  const seen = new Set(
    existing.flatMap((txn) =>
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
    const keys = fingerprint(accountId, row);
    if (keys.some((key) => seen.has(key))) {
      skipped += 1;
      continue;
    }
    for (const key of keys) seen.add(key);
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

  await getDb().transaction("rw", getDb().transactions, getDb().accounts, async () => {
    if (toAdd.length) await getDb().transactions.bulkAdd(toAdd);
    const account = await getDb().accounts.get(accountId);
    if (account) {
      await getDb().accounts.put({ ...account, lastImportedAt: new Date().toISOString() });
    }
  });
  return {
    parsed,
    imported: toAdd.length,
    skipped,
  };
}

export async function updateTransactionCategory(id: string, categoryId: string) {
  await getDb().transactions.update(id, { categoryId });
}

export async function setBudget(categoryId: string, monthlyCents: number) {
  const existing = await getDb().budgets.where("categoryId").equals(categoryId).first();
  if (existing) {
    await getDb().budgets.put({ ...existing, monthlyCents });
    return;
  }
  await getDb().budgets.add({ id: uid(), categoryId, monthlyCents });
}

export async function setRecurringStatus(id: string, merchant: string, status: RecurringStatus) {
  const existing = await getDb().recurring.get(id);
  if (existing) {
    await getDb().recurring.update(id, { status });
    return;
  }
  await getDb().recurring.put({
    id,
    merchant,
    displayName: merchant,
    amountCents: 0,
    cadence: "monthly",
    categoryId: "subscriptions",
    lastSeen: "",
    nextEstimated: "",
    status,
    count: 0,
  });
}

export async function exportBackup() {
  const [meta, accounts, transactions, budgets, recurring] = await Promise.all([
    getDb().meta.get(META_ID),
    getDb().accounts.toArray(),
    getDb().transactions.toArray(),
    getDb().budgets.toArray(),
    getDb().recurring.toArray(),
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

  await getDb().transaction("rw", getDb().meta, getDb().accounts, getDb().transactions, getDb().budgets, getDb().recurring, async () => {
    await Promise.all([
      getDb().meta.clear(),
      getDb().accounts.clear(),
      getDb().transactions.clear(),
      getDb().budgets.clear(),
      getDb().recurring.clear(),
    ]);
    await getDb().meta.put({
      id: META_ID,
      name: data.meta?.name ?? "Our household",
      seeded: Boolean(data.meta?.seeded),
      createdAt: new Date().toISOString(),
    });
    if (data.accounts?.length) await getDb().accounts.bulkAdd(data.accounts);
    if (data.transactions?.length) await getDb().transactions.bulkAdd(data.transactions);
    if (data.budgets?.length) await getDb().budgets.bulkAdd(data.budgets);
    if (data.recurring?.length) await getDb().recurring.bulkAdd(data.recurring);
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