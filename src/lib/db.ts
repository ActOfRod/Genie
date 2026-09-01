import Dexie, { type Table } from "dexie";
import type { Account, Budget, HouseholdMeta, RecurringCharge, Transaction } from "./types";

export class GenieDB extends Dexie {
  accounts!: Table<Account, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  recurring!: Table<RecurringCharge, string>;
  meta!: Table<HouseholdMeta, string>;

  constructor() {
    super("genie-household");
    this.version(1).stores({
      accounts: "id, institution, type",
      transactions: "id, accountId, date, categoryId, merchant, amountCents, [accountId+date]",
      budgets: "id, categoryId",
      recurring: "id, merchant, status, nextEstimated",
      meta: "id",
    });
  }
}

export const db = new GenieDB();