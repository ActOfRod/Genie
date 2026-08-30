import {
  addMonths,
  addWeeks,
  addYears,
  endOfMonth,
  format,
  isValid,
  parse,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";

export function toISODate(value: Date) {
  return format(value, "yyyy-MM-dd");
}

export function parseLooseDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = parseISO(trimmed);
  if (isValid(iso) && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return toISODate(iso);
  }

  const formats = [
    "MM/dd/yyyy",
    "M/d/yyyy",
    "MM/dd/yy",
    "M/d/yy",
    "yyyyMMdd",
    "yyyyMMddHHmmss",
    "MMM d yyyy",
    "MMMM d yyyy",
  ];

  for (const fmt of formats) {
    const parsed = parse(trimmed.slice(0, fmt.length + 6), fmt, new Date());
    if (isValid(parsed)) return toISODate(parsed);
  }

  if (/^\d{8}/.test(trimmed)) {
    const parsed = parse(trimmed.slice(0, 8), "yyyyMMdd", new Date());
    if (isValid(parsed)) return toISODate(parsed);
  }

  return null;
}

export function monthKey(date = new Date()) {
  return format(date, "yyyy-MM");
}

export function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return format(new Date(year, month - 1, 1), "MMMM yyyy");
}

export function monthBounds(key: string) {
  const [year, month] = key.split("-").map(Number);
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return { start: toISODate(start), end: toISODate(end) };
}

export function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number);
  return monthKey(addMonths(new Date(year, month - 1, 1), delta));
}

export function previousMonthKey(key: string) {
  return shiftMonth(key, -1);
}

export function inMonth(date: string, key: string) {
  return date.startsWith(key);
}

export function estimateNext(lastSeen: string, cadence: "weekly" | "monthly" | "yearly") {
  const date = parseISO(lastSeen);
  if (cadence === "weekly") return toISODate(addWeeks(date, 1));
  if (cadence === "yearly") return toISODate(addYears(date, 1));
  return toISODate(addMonths(date, 1));
}

export function monthsAgo(date: Date, months: number) {
  return toISODate(subMonths(date, months));
}

export function formatShortDate(value: string) {
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  return format(parsed, "MMM d");
}

export function formatLongDate(value: string) {
  const parsed = parseISO(value);
  if (!isValid(parsed)) return value;
  return format(parsed, "EEE, MMM d");
}