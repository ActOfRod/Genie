export type Institution = "amex" | "genisys" | "other";
export type AccountType = "credit" | "checking" | "savings" | "loan";
export type TransactionSource = "import" | "manual" | "seed";
export type RecurringStatus = "active" | "ignored" | "cancelled";
export type RecurringCadence = "weekly" | "monthly" | "yearly";

export type CategoryGroup =
  | "income"
  | "housing"
  | "food"
  | "transport"
  | "bills"
  | "lifestyle"
  | "health"
  | "transfer"
  | "other";

export interface Account {
  id: string;
  name: string;
  institution: Institution;
  type: AccountType;
  mask?: string;
  lastImportedAt?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  group: CategoryGroup;
  color: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  merchant: string;
  amountCents: number;
  categoryId: string;
  notes?: string;
  externalId?: string;
  source: TransactionSource;
  excluded: boolean;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyCents: number;
}

export interface HouseholdMeta {
  id: string;
  name: string;
  seeded: boolean;
  createdAt: string;
}

export interface ParsedTransaction {
  date: string;
  description: string;
  merchant: string;
  amountCents: number;
  externalId?: string;
  categoryHint?: string;
}

export interface ParseResult {
  source: Institution | "generic";
  format: string;
  transactions: ParsedTransaction[];
  warnings: string[];
}

export interface RecurringCharge {
  id: string;
  merchant: string;
  displayName: string;
  amountCents: number;
  cadence: RecurringCadence;
  categoryId: string;
  lastSeen: string;
  nextEstimated: string;
  status: RecurringStatus;
  count: number;
}