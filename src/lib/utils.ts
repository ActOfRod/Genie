import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function normalizeMerchant(value: string) {
  return value
    .toUpperCase()
    .replace(/[#*]/g, " ")
    .replace(/\b(POS|ACH|DEBIT|CREDIT|VISA|MC|PURCHASE|WITHDRAWAL|WEB|PMT|PYMT|PAYMENT)\b/g, " ")
    .replace(/\d{3,}/g, " ")
    .replace(/[^A-Z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}