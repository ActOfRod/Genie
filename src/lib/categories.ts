import type { Category, CategoryGroup } from "./types";

export const CATEGORIES: Category[] = [
  { id: "income", name: "Income", group: "income", color: "#0F6B5C" },
  { id: "groceries", name: "Groceries", group: "food", color: "#3F7D4E" },
  { id: "dining", name: "Dining", group: "food", color: "#C45C26" },
  { id: "coffee", name: "Coffee", group: "food", color: "#8A5A32" },
  { id: "housing", name: "Housing", group: "housing", color: "#4C6A7A" },
  { id: "utilities", name: "Utilities", group: "bills", color: "#2F6F8F" },
  { id: "internet", name: "Internet & phone", group: "bills", color: "#3D5A80" },
  { id: "insurance", name: "Insurance", group: "bills", color: "#5C4E8A" },
  { id: "subscriptions", name: "Subscriptions", group: "bills", color: "#7A4E7A" },
  { id: "gas", name: "Gas", group: "transport", color: "#B45309" },
  { id: "auto", name: "Auto", group: "transport", color: "#92400E" },
  { id: "transit", name: "Transit", group: "transport", color: "#78716C" },
  { id: "shopping", name: "Shopping", group: "lifestyle", color: "#A16207" },
  { id: "entertainment", name: "Entertainment", group: "lifestyle", color: "#BE185D" },
  { id: "health", name: "Health", group: "health", color: "#0F766E" },
  { id: "personal", name: "Personal care", group: "lifestyle", color: "#9F1239" },
  { id: "kids", name: "Kids & family", group: "lifestyle", color: "#C2410C" },
  { id: "travel", name: "Travel", group: "lifestyle", color: "#1D4ED8" },
  { id: "gifts", name: "Gifts & donations", group: "lifestyle", color: "#A21CAF" },
  { id: "fees", name: "Fees & interest", group: "other", color: "#7F1D1D" },
  { id: "transfer", name: "Transfers", group: "transfer", color: "#57534E" },
  { id: "uncategorized", name: "Uncategorized", group: "other", color: "#A8A29E" },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category]),
) as Record<string, Category>;

export function categoryName(id: string) {
  return CATEGORY_BY_ID[id]?.name ?? "Uncategorized";
}

export function categoryColor(id: string) {
  return CATEGORY_BY_ID[id]?.color ?? "#A8A29E";
}

export function isTransferLike(categoryId: string) {
  return categoryId === "transfer";
}

export function isIncome(categoryId: string) {
  return categoryId === "income";
}

export const GROUP_LABELS: Record<CategoryGroup, string> = {
  income: "Income",
  housing: "Home",
  food: "Food",
  transport: "Getting around",
  bills: "Bills",
  lifestyle: "Lifestyle",
  health: "Health",
  transfer: "Transfers",
  other: "Other",
};