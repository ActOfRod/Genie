"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { detectRecurring } from "./subscriptions";
import { fingerprint, parseStatement } from "./parsers";
import { guessCategory } from "./categorize";
import { inMonth, monthBounds, monthKey, previousMonthKey } from "./dates";
import { CATEGORIES, isTransferLike } from "./categories";
import type {
  Account,
  Budget,
  Institution,
  RecurringStatus,
  Transaction,
} from "./types";

interface HouseholdRow {
  id: string;
  name: string;
}

interface OverrideRow {
  merchant_key: string;
  merchant: string;
  status: RecurringStatus;
}

interface StoreState {
  household: HouseholdRow | null;
  accounts: Account[];
  transactions: Transaction[];
  budgets: Budget[];
  overrides: OverrideRow[];
  ready: boolean;
  error: string | null;
}

const EMPTY: StoreState = {
  household: null,
  accounts: [],
  transactions: [],
  budgets: [],
  overrides: [],
  ready: false,
  error: null,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapAccount(row: any): Account {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    type: row.type,
    mask: row.mask ?? undefined,
    lastImportedAt: row.last_imported_at ?? undefined,
    createdAt: row.created_at,
  };
}

function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    date: row.date,
    description: row.description,
    merchant: row.merchant,
    amountCents: Number(row.amount_cents),
    categoryId: row.category_id,
    notes: row.notes ?? undefined,
    externalId: row.external_id ?? undefined,
    source: row.source,
    excluded: row.excluded,
    createdAt: row.created_at,
  };
}

function mapBudget(row: any): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    monthlyCents: Number(row.monthly_cents),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface StoreApi {
  state: StoreState;
  refresh: () => Promise<void>;
  householdId: () => string;
}

const StoreContext = createContext<StoreApi | null>(null);

let activeStore: StoreApi | null = null;

function requireStore(): StoreApi {
  if (!activeStore) throw new Error("Genie store is not ready yet.");
  return activeStore;
}

export function GenieProvider({
  session,
  children,
}: {
  session: Session;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<StoreState>(EMPTY);
  const householdRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const { data: households, error: hhError } = await supabase
      .from("households")
      .select("id, name")
      .limit(1);

    if (hhError) {
      setState((prev) => ({ ...prev, ready: true, error: hhError.message }));
      return;
    }

    const household = households?.[0] ?? null;
    if (!household) {
      setState({ ...EMPTY, ready: true, error: "This login is not part of a household yet." });
      return;
    }
    householdRef.current = household.id;

    const [accounts, transactions, budgets, overrides] = await Promise.all([
      supabase.from("accounts").select("*").order("created_at"),
      supabase.from("transactions").select("*").order("date", { ascending: false }).limit(20000),
      supabase.from("budgets").select("*"),
      supabase.from("recurring_overrides").select("*"),
    ]);

    const firstError = accounts.error ?? transactions.error ?? budgets.error ?? overrides.error;
    if (firstError) {
      setState((prev) => ({ ...prev, ready: true, error: firstError.message }));
      return;
    }

    setState({
      household,
      accounts: (accounts.data ?? []).map(mapAccount),
      transactions: (transactions.data ?? []).map(mapTransaction),
      budgets: (budgets.data ?? []).map(mapBudget),
      overrides: (overrides.data ?? []) as OverrideRow[],
      ready: true,
      error: null,
    });
  }, []);

  // Initial load, plus keep both devices in sync: refetch when the database
  // changes or the tab refocuses.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleRefresh = (delayMs = 400) => {
      clearTimeout(timer);
      timer = setTimeout(() => void refresh(), delayMs);
    };

    scheduleRefresh(0);

    const channel = supabase
      .channel("household-sync")
      .on("postgres_changes", { event: "*", schema: "public" }, () => scheduleRefresh())
      .subscribe();

    const onFocus = () => scheduleRefresh();
    window.addEventListener("focus", onFocus);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [refresh, session.user.id]);

  const api = useMemo<StoreApi>(
    () => ({
      state,
      refresh,
      householdId: () => {
        const id = householdRef.current;
        if (!id) throw new Error("No household loaded yet.");
        return id;
      },
    }),
    [state, refresh],
  );

  useEffect(() => {
    activeStore = api;
    return () => {
      if (activeStore === api) activeStore = null;
    };
  }, [api]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useHousehold() {
  const store = useContext(StoreContext);
  const state = store?.state ?? EMPTY;

  const recurring = useMemo(() => {
    const statusByKey = new Map(state.overrides.map((row) => [row.merchant_key, row.status]));
    const statusByMerchant = new Map(state.overrides.map((row) => [row.merchant.toLowerCase(), row.status]));
    return detectRecurring(state.transactions).map((item) => ({
      ...item,
      status: statusByKey.get(item.id) ?? statusByMerchant.get(item.merchant.toLowerCase()) ?? "active",
    }));
  }, [state.transactions, state.overrides]);

  return {
    meta: state.household ? { name: state.household.name } : undefined,
    accounts: state.accounts,
    transactions: state.transactions,
    budgets: state.budgets,
    recurring,
    ready: state.ready,
    error: state.error,
  };
}

async function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function renameHousehold(name: string) {
  const store = requireStore();
  const { error } = await supabase
    .from("households")
    .update({ name })
    .eq("id", store.householdId());
  await throwIfError(error);
  await store.refresh();
}

export async function addAccount(input: {
  name: string;
  institution: Institution;
  type: Account["type"];
  mask?: string;
}) {
  const store = requireStore();
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      household_id: store.householdId(),
      name: input.name,
      institution: input.institution,
      type: input.type,
      mask: input.mask ?? null,
    })
    .select()
    .single();
  await throwIfError(error);
  await store.refresh();
  return mapAccount(data);
}

export async function removeAccount(accountId: string) {
  const store = requireStore();
  const { error } = await supabase.from("accounts").delete().eq("id", accountId);
  await throwIfError(error);
  await store.refresh();
}

const IMPORT_CHUNK = 500;

export async function importParsed(accountId: string, fileText: string, filename: string) {
  const store = requireStore();
  const parsed = parseStatement(fileText, filename);
  const existing = store.state.transactions.filter((txn) => txn.accountId === accountId);
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

  const rows: Array<Record<string, unknown>> = [];
  let skipped = 0;
  for (const row of parsed.transactions) {
    const keys = fingerprint(accountId, row);
    if (keys.some((key) => seen.has(key))) {
      skipped += 1;
      continue;
    }
    for (const key of keys) seen.add(key);
    rows.push({
      household_id: store.householdId(),
      account_id: accountId,
      date: row.date,
      description: row.description,
      merchant: row.merchant,
      amount_cents: row.amountCents,
      category_id: row.categoryHint ?? guessCategory(row.description),
      external_id: row.externalId ?? null,
      source: "import",
    });
  }

  for (let i = 0; i < rows.length; i += IMPORT_CHUNK) {
    const { error } = await supabase.from("transactions").insert(rows.slice(i, i + IMPORT_CHUNK));
    await throwIfError(error);
  }

  const { error: accountError } = await supabase
    .from("accounts")
    .update({ last_imported_at: new Date().toISOString() })
    .eq("id", accountId);
  await throwIfError(accountError);

  await store.refresh();
  return { parsed, imported: rows.length, skipped };
}

export async function updateTransactionCategory(id: string, categoryId: string) {
  await updateTransaction(id, { categoryId });
}

export async function updateTransaction(id: string, patch: { categoryId?: string; notes?: string }) {
  const store = requireStore();
  const body: Record<string, unknown> = {};
  if (patch.categoryId !== undefined) body.category_id = patch.categoryId;
  if (patch.notes !== undefined) body.notes = patch.notes;
  const { error } = await supabase.from("transactions").update(body).eq("id", id);
  await throwIfError(error);
  await store.refresh();
}

const CATEGORY_UPDATE_CHUNK = 200;

export async function recategorizeTransactions(mode: "uncategorized" | "rules") {
  const store = requireStore();
  const byCategory = new Map<string, string[]>();

  for (const txn of store.state.transactions) {
    const next = guessCategory(txn.description);
    if (next === "uncategorized" || next === txn.categoryId) continue;
    if (mode === "uncategorized" && txn.categoryId !== "uncategorized") continue;
    const ids = byCategory.get(next) ?? [];
    ids.push(txn.id);
    byCategory.set(next, ids);
  }

  let updated = 0;
  for (const [categoryId, ids] of byCategory) {
    for (let i = 0; i < ids.length; i += CATEGORY_UPDATE_CHUNK) {
      const slice = ids.slice(i, i + CATEGORY_UPDATE_CHUNK);
      const { error } = await supabase.from("transactions").update({ category_id: categoryId }).in("id", slice);
      await throwIfError(error);
      updated += slice.length;
    }
  }

  await store.refresh();
  return { updated };
}

export async function setBudget(categoryId: string, monthlyCents: number) {
  const store = requireStore();
  const { error } = await supabase
    .from("budgets")
    .upsert(
      { household_id: store.householdId(), category_id: categoryId, monthly_cents: monthlyCents },
      { onConflict: "household_id,category_id" },
    );
  await throwIfError(error);
  await store.refresh();
}

export async function setRecurringStatus(id: string, merchant: string, status: RecurringStatus) {
  const store = requireStore();
  const { error } = await supabase.from("recurring_overrides").upsert(
    {
      household_id: store.householdId(),
      merchant_key: id,
      merchant,
      status,
    },
    { onConflict: "household_id,merchant_key" },
  );
  await throwIfError(error);
  await store.refresh();
}

export async function wipeHousehold() {
  const store = requireStore();
  const householdId = store.householdId();
  for (const table of ["transactions", "accounts", "budgets", "recurring_overrides"]) {
    const { error } = await supabase.from(table).delete().eq("household_id", householdId);
    await throwIfError(error);
  }
  await store.refresh();
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function exportBackup() {
  const store = requireStore();
  const { household, accounts, transactions, budgets, overrides } = store.state;
  return JSON.stringify(
    {
      version: 2,
      exportedAt: new Date().toISOString(),
      meta: { name: household?.name ?? "Our household" },
      accounts,
      transactions,
      budgets,
      recurring: overrides.map((row) => ({ merchant: row.merchant, status: row.status })),
    },
    null,
    2,
  );
}

export async function importBackup(json: string) {
  const store = requireStore();
  const householdId = store.householdId();
  const data = JSON.parse(json) as {
    meta?: { name?: string };
    accounts?: Account[];
    transactions?: Transaction[];
    budgets?: Array<{ categoryId: string; monthlyCents: number }>;
    recurring?: Array<{ merchant: string; status?: RecurringStatus }>;
  };

  await wipeHousehold();

  const accountIdMap = new Map<string, string>();
  for (const account of data.accounts ?? []) {
    const { data: inserted, error } = await supabase
      .from("accounts")
      .insert({
        household_id: householdId,
        name: account.name,
        institution: account.institution ?? "other",
        type: account.type ?? "checking",
        mask: account.mask ?? null,
        last_imported_at: account.lastImportedAt ?? null,
      })
      .select("id")
      .single();
    await throwIfError(error);
    accountIdMap.set(account.id, inserted!.id);
  }

  const txRows = (data.transactions ?? [])
    .filter((txn) => accountIdMap.has(txn.accountId))
    .map((txn) => ({
      household_id: householdId,
      account_id: accountIdMap.get(txn.accountId),
      date: txn.date,
      description: txn.description,
      merchant: txn.merchant,
      amount_cents: txn.amountCents,
      category_id: txn.categoryId ?? "uncategorized",
      notes: txn.notes ?? null,
      external_id: txn.externalId ?? null,
      source: txn.source ?? "import",
      excluded: Boolean(txn.excluded),
    }));
  for (let i = 0; i < txRows.length; i += IMPORT_CHUNK) {
    const { error } = await supabase.from("transactions").insert(txRows.slice(i, i + IMPORT_CHUNK));
    await throwIfError(error);
  }

  for (const budget of data.budgets ?? []) {
    if (!budget.categoryId || typeof budget.monthlyCents !== "number") continue;
    const { error } = await supabase.from("budgets").upsert(
      {
        household_id: householdId,
        category_id: budget.categoryId,
        monthly_cents: budget.monthlyCents,
      },
      { onConflict: "household_id,category_id" },
    );
    await throwIfError(error);
  }

  for (const row of data.recurring ?? []) {
    if (!row.merchant || !row.status || row.status === "active") continue;
    const { error } = await supabase.from("recurring_overrides").upsert(
      {
        household_id: householdId,
        merchant_key: row.merchant.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        merchant: row.merchant,
        status: row.status,
      },
      { onConflict: "household_id,merchant_key" },
    );
    await throwIfError(error);
  }

  if (data.meta?.name) {
    await renameHousehold(data.meta.name);
    return;
  }
  await store.refresh();
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