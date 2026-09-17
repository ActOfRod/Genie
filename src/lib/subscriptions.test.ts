import { describe, expect, it } from "vitest";
import { detectRecurring, recurringMerchantKey } from "./subscriptions";
import type { Transaction } from "./types";

function txn(partial: Partial<Transaction> & Pick<Transaction, "date" | "description" | "amountCents">): Transaction {
  return {
    id: partial.id ?? partial.date + partial.description,
    accountId: "genisys",
    merchant: partial.merchant ?? partial.description.slice(0, 18),
    categoryId: partial.categoryId ?? "uncategorized",
    source: "import",
    excluded: false,
    createdAt: partial.date,
    ...partial,
  };
}

describe("recurringMerchantKey", () => {
  it("collapses bank prefixes so the same bill groups together", () => {
    expect(recurringMerchantKey("ACH Withdrawal MIDWEST LOAN")).toBe("MIDWEST LOAN");
    expect(recurringMerchantKey("MIDWEST LOAN/MTG PMT//WEB/NA")).toBe("MIDWEST LOAN");
    expect(recurringMerchantKey("ACH Withdrawal CAPITAL ONE AUTO")).toBe("CAPITAL ONE");
  });
});

describe("detectRecurring", () => {
  it("keeps a live monthly bill and uses the latest amount", () => {
    const rows = [
      txn({ date: "2026-06-01", description: "ACH Withdrawal MIDWEST LOAN", amountCents: -163400, categoryId: "housing" }),
      txn({ date: "2026-07-01", description: "MIDWEST LOAN/MTG PMT", amountCents: -239897, categoryId: "housing" }),
      txn({ date: "2026-08-01", description: "ACH Withdrawal MIDWEST LOAN", amountCents: -239897, categoryId: "housing" }),
      txn({ date: "2026-09-01", description: "ACH Withdrawal MIDWEST LOAN", amountCents: -239897, categoryId: "housing" }),
    ];
    const found = detectRecurring(rows, new Date("2026-09-16"));
    expect(found).toHaveLength(1);
    expect(found[0].displayName).toBe("Midwest Loan");
    expect(found[0].categoryId).toBe("housing");
    expect(found[0].amountCents).toBe(-239897);
  });

  it("treats a quarterly phone bill as quarterly, not yearly", () => {
    const rows = [
      txn({ date: "2025-09-15", description: "MINT MOBILE", amountCents: -4500, categoryId: "internet" }),
      txn({ date: "2025-12-15", description: "MINT MOBILE", amountCents: -4500, categoryId: "internet" }),
      txn({ date: "2026-03-15", description: "MINT MOBILE", amountCents: -4500, categoryId: "internet" }),
      txn({ date: "2026-06-15", description: "MINT MOBILE", amountCents: -4500, categoryId: "internet" }),
      txn({ date: "2026-09-15", description: "MINT MOBILE", amountCents: -4500, categoryId: "internet" }),
    ];
    const found = detectRecurring(rows, new Date("2026-09-16"));
    expect(found).toHaveLength(1);
    expect(found[0].cadence).toBe("quarterly");
  });

  it("detects a twice-a-year bill", () => {
    const rows = [
      txn({ date: "2025-03-01", description: "CAR INSURANCE", amountCents: -62000, categoryId: "insurance" }),
      txn({ date: "2025-09-01", description: "CAR INSURANCE", amountCents: -62000, categoryId: "insurance" }),
      txn({ date: "2026-03-01", description: "CAR INSURANCE", amountCents: -62000, categoryId: "insurance" }),
      txn({ date: "2026-09-01", description: "CAR INSURANCE", amountCents: -62000, categoryId: "insurance" }),
    ];
    const found = detectRecurring(rows, new Date("2026-09-16"));
    expect(found).toHaveLength(1);
    expect(found[0].cadence).toBe("semiannual");
  });

  it("drops charges that have not come back", () => {
    const rows = [
      txn({ date: "2025-03-07", description: "HUNTINGTON BANKS", amountCents: -51971 }),
      txn({ date: "2025-04-07", description: "HUNTINGTON BANKS", amountCents: -51971 }),
      txn({ date: "2025-05-07", description: "HUNTINGTON BANKS", amountCents: -51971 }),
      txn({ date: "2025-06-07", description: "HUNTINGTON BANKS", amountCents: -51971 }),
      txn({ date: "2025-07-15", description: "HUNTINGTON BANKS", amountCents: -51971 }),
    ];
    expect(detectRecurring(rows, new Date("2026-09-16"))).toHaveLength(0);
  });
});
