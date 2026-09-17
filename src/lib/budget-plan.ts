import { CATEGORIES } from "./categories";
import { inMonth, monthKey, previousMonthKey } from "./dates";
import { dollarsToCents, formatAbs } from "./money";
import type { Budget, Transaction } from "./types";

export type BudgetPreference = "save-more" | "balanced" | "go-out-more";

export const BUDGET_PREFERENCES: { id: BudgetPreference; label: string; blurb: string }[] = [
  { id: "save-more", label: "We want to save more", blurb: "Trim eating out, shopping, and fun so more income is left over." },
  { id: "balanced", label: "Keep it balanced", blurb: "Use what you actually spend, rounded into gentle monthly caps." },
  { id: "go-out-more", label: "We want to go out more", blurb: "Give dining, coffee, and entertainment more room." },
];

const SKIP = new Set(["income", "transfer"]);
const DISCRETIONARY = new Set([
  "dining",
  "coffee",
  "shopping",
  "entertainment",
  "nicotine",
  "personal",
  "vacation",
  "travel",
  "gifts",
]);
const GO_OUT = new Set(["dining", "coffee", "entertainment"]);

const CATEGORY_HINTS: Array<{ categoryId: string; pattern: RegExp }> = [
  { categoryId: "dining", pattern: /\b(dinner|lunch|brunch|restaurant|eat out|eating out|takeout|doordash)\b/i },
  { categoryId: "coffee", pattern: /\b(coffee|starbucks|latte)\b/i },
  { categoryId: "groceries", pattern: /\b(grocer|costco|meijer|whole foods)\b/i },
  { categoryId: "shopping", pattern: /\b(amazon|shopping|clothes|target)\b/i },
  { categoryId: "entertainment", pattern: /\b(concert|movie|tickets|game)\b/i },
  { categoryId: "vacation", pattern: /\b(vacation|trip|getaway)\b/i },
  { categoryId: "travel", pattern: /\b(flight|hotel|airbnb)\b/i },
  { categoryId: "pets", pattern: /\b(vet|pet|dog|cat)\b/i },
];

export interface BudgetSuggestion {
  categoryId: string;
  name: string;
  color: string;
  monthlyCents: number;
  averageCents: number;
}

export interface BudgetPlan {
  preference: BudgetPreference;
  incomeCents: number;
  savingsCents: number;
  totalBudgetCents: number;
  suggestions: BudgetSuggestion[];
}

export interface AffordabilityContext {
  leftoverCents: number;
  typicalLeftoverCents: number;
  incomeCents: number;
  budgets: Budget[];
  spentByCategory: Map<string, number>;
}

function recentMonthKeys(count: number, asOf: Date) {
  const keys: string[] = [];
  let key = monthKey(asOf);
  for (let i = 0; i < count; i += 1) {
    keys.push(key);
    key = previousMonthKey(key);
  }
  return keys;
}

function averageIncome(transactions: Transaction[], months: string[]) {
  const total = months.reduce((sum, month) => {
    return (
      sum +
      transactions
        .filter((txn) => inMonth(txn.date, month) && !txn.excluded && txn.categoryId === "income")
        .reduce((inner, txn) => inner + txn.amountCents, 0)
    );
  }, 0);
  return Math.round(total / months.length);
}

function averageSpendByCategory(transactions: Transaction[], months: string[]) {
  const totals = new Map<string, number>();
  for (const txn of transactions) {
    if (txn.excluded || txn.amountCents >= 0 || SKIP.has(txn.categoryId)) continue;
    if (!months.some((month) => inMonth(txn.date, month))) continue;
    totals.set(txn.categoryId, (totals.get(txn.categoryId) ?? 0) + Math.abs(txn.amountCents));
  }
  const averages = new Map<string, number>();
  for (const [categoryId, total] of totals) {
    averages.set(categoryId, Math.round(total / months.length));
  }
  return averages;
}

function multiplier(categoryId: string, preference: BudgetPreference) {
  if (preference === "save-more") return DISCRETIONARY.has(categoryId) ? 0.8 : 1;
  if (preference === "go-out-more") {
    if (GO_OUT.has(categoryId)) return 1.25;
    if (categoryId === "shopping") return 0.9;
    return 1;
  }
  return 1;
}

function savingsRate(preference: BudgetPreference) {
  if (preference === "save-more") return 0.2;
  if (preference === "go-out-more") return 0.05;
  return 0.1;
}

function niceCents(cents: number) {
  if (cents <= 0) return 0;
  if (cents < 1000) return Math.max(100, Math.round(cents / 100) * 100);
  return Math.round(cents / 500) * 500;
}

export function suggestBudgets(
  transactions: Transaction[],
  preference: BudgetPreference,
  asOf = new Date(),
): BudgetPlan {
  const months = recentMonthKeys(3, asOf);
  const incomeCents = Math.max(0, averageIncome(transactions, months));
  const averages = averageSpendByCategory(transactions, months);

  const suggestions: BudgetSuggestion[] = CATEGORIES.filter((category) => !SKIP.has(category.id))
    .map((category) => {
      const averageCents = averages.get(category.id) ?? 0;
      return {
        categoryId: category.id,
        name: category.name,
        color: category.color,
        averageCents,
        monthlyCents: niceCents(Math.round(averageCents * multiplier(category.id, preference))),
      };
    })
    .filter((row) => row.monthlyCents > 0)
    .sort((a, b) => b.monthlyCents - a.monthlyCents);

  let savingsCents = niceCents(Math.round(incomeCents * savingsRate(preference)));
  let totalBudgetCents = suggestions.reduce((sum, row) => sum + row.monthlyCents, 0);

  if (incomeCents > 0 && totalBudgetCents + savingsCents > incomeCents) {
    const fixed = suggestions
      .filter((row) => !DISCRETIONARY.has(row.categoryId))
      .reduce((sum, row) => sum + row.monthlyCents, 0);
    const room = Math.max(0, incomeCents - savingsCents - fixed);
    const discretionary = suggestions.filter((row) => DISCRETIONARY.has(row.categoryId));
    const discTotal = discretionary.reduce((sum, row) => sum + row.monthlyCents, 0);
    if (discTotal > 0) {
      const scale = room / discTotal;
      for (const row of discretionary) {
        row.monthlyCents = niceCents(row.monthlyCents * scale);
      }
    }
    totalBudgetCents = suggestions.reduce((sum, row) => sum + row.monthlyCents, 0);
    if (totalBudgetCents + savingsCents > incomeCents) {
      savingsCents = Math.max(0, incomeCents - totalBudgetCents);
    }
  }

  return {
    preference,
    incomeCents,
    savingsCents,
    totalBudgetCents,
    suggestions: suggestions.filter((row) => row.monthlyCents > 0),
  };
}

export function parseAffordAmountCents(question: string) {
  const match = question.replace(/,/g, "").match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  if (!match) return null;
  const cents = dollarsToCents(match[1]);
  return cents > 0 ? cents : null;
}

export function guessAffordCategory(question: string) {
  for (const hint of CATEGORY_HINTS) {
    if (hint.pattern.test(question)) return hint.categoryId;
  }
  return null;
}

export function answerAffordability(question: string, context: AffordabilityContext) {
  const trimmed = question.trim();
  if (!trimmed) return "Ask with a dollar amount — like “Can we afford $80 for dinner?”";

  const amount = parseAffordAmountCents(trimmed);
  if (amount == null) {
    return "Add a dollar amount so Genie can check the books. Try “Can we afford $120?”";
  }

  const categoryId = guessAffordCategory(trimmed);
  const category = categoryId ? CATEGORIES.find((item) => item.id === categoryId) : undefined;
  const budget = categoryId ? context.budgets.find((item) => item.categoryId === categoryId) : undefined;
  const spent = categoryId ? Math.abs(context.spentByCategory.get(categoryId) ?? 0) : 0;
  const remaining = budget ? budget.monthlyCents - spent : null;
  const leftover = context.leftoverCents;
  const typical = context.typicalLeftoverCents;
  const leftoverLabel =
    leftover >= 0 ? `${formatAbs(leftover)} left this month` : `${formatAbs(leftover)} over this month`;

  if (remaining != null && remaining < amount) {
    return `Not from the ${category?.name ?? "category"} budget — ${formatAbs(Math.max(0, remaining))} left there this month. ${
      leftover >= amount
        ? `You still have ${formatAbs(leftover)} leftover overall, so it would come out of somewhere else.`
        : `This month is already tight (${leftoverLabel}).`
    }`;
  }

  if (leftover >= amount) {
    const extra = remaining != null ? ` The ${category?.name} budget still has ${formatAbs(remaining)}.` : "";
    return `Yes. ${formatAbs(amount)} fits — ${formatAbs(leftover)} left this month after spending.${extra}`;
  }

  if (typical >= amount) {
    return `Not this month (${leftoverLabel}), but you usually finish with about ${formatAbs(typical)}. Wait, or trim something else first.`;
  }

  if (context.incomeCents > 0 && amount > context.incomeCents) {
    return `That’s more than a typical month of pay (${formatAbs(context.incomeCents)}). Not unless something else gives.`;
  }

  return `Stretch. ${formatAbs(amount)} is more than the ${leftoverLabel}, and you don’t usually have that much leftover.`;
}
