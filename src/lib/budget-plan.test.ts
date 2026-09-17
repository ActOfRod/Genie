import { describe, expect, it } from "vitest";
import { answerAffordability, suggestBudgets } from "./budget-plan";
import type { Transaction } from "./types";

function txn(partial: Partial<Transaction> & Pick<Transaction, "date" | "amountCents" | "categoryId">): Transaction {
  return {
    id: partial.id ?? `${partial.date}-${partial.categoryId}-${partial.amountCents}`,
    accountId: "genisys",
    description: partial.description ?? partial.categoryId,
    merchant: partial.merchant ?? partial.categoryId,
    source: "import",
    excluded: false,
    createdAt: partial.date,
    ...partial,
  };
}

describe("suggestBudgets", () => {
  const rows = [
    txn({ date: "2026-07-05", amountCents: 400000, categoryId: "income" }),
    txn({ date: "2026-08-05", amountCents: 400000, categoryId: "income" }),
    txn({ date: "2026-09-05", amountCents: 400000, categoryId: "income" }),
    txn({ date: "2026-07-10", amountCents: -20000, categoryId: "dining" }),
    txn({ date: "2026-08-10", amountCents: -20000, categoryId: "dining" }),
    txn({ date: "2026-09-10", amountCents: -20000, categoryId: "dining" }),
    txn({ date: "2026-07-12", amountCents: -150000, categoryId: "housing" }),
    txn({ date: "2026-08-12", amountCents: -150000, categoryId: "housing" }),
    txn({ date: "2026-09-12", amountCents: -150000, categoryId: "housing" }),
  ];
  const asOf = new Date("2026-09-17T12:00:00");

  it("builds caps from recent spending and leaves savings on save-more", () => {
    const plan = suggestBudgets(rows, "save-more", asOf);
    const dining = plan.suggestions.find((row) => row.categoryId === "dining");
    const housing = plan.suggestions.find((row) => row.categoryId === "housing");
    expect(housing?.monthlyCents).toBe(150000);
    expect(dining?.monthlyCents).toBe(16000);
    expect(plan.savingsCents).toBeGreaterThan(0);
    expect(plan.totalBudgetCents + plan.savingsCents).toBeLessThanOrEqual(plan.incomeCents);
  });

  it("gives dining more room when the preference is go-out-more", () => {
    const save = suggestBudgets(rows, "save-more", asOf);
    const goOut = suggestBudgets(rows, "go-out-more", asOf);
    const saveDining = save.suggestions.find((row) => row.categoryId === "dining")?.monthlyCents ?? 0;
    const goDining = goOut.suggestions.find((row) => row.categoryId === "dining")?.monthlyCents ?? 0;
    expect(goDining).toBeGreaterThan(saveDining);
  });
});

describe("answerAffordability", () => {
  const context = {
    leftoverCents: 30000,
    typicalLeftoverCents: 40000,
    incomeCents: 400000,
    budgets: [{ id: "1", categoryId: "dining", monthlyCents: 20000 }],
    spentByCategory: new Map([["dining", -5000]]),
  };

  it("says yes when leftover covers the amount", () => {
    expect(answerAffordability("Can we afford $80?", context)).toContain("Yes");
  });

  it("checks the matching category budget", () => {
    const answer = answerAffordability("Can we afford $200 for dinner?", context);
    expect(answer).toContain("Dining");
  });

  it("asks for a dollar amount when none is given", () => {
    expect(answerAffordability("Can we afford this?", context)).toContain("dollar amount");
  });
});
