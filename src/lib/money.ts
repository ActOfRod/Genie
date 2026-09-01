const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const compact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function dollarsToCents(value: number | string) {
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "").replace(/[()]/g, (m) => (m === "(" ? "-" : ""));
    if (!cleaned || cleaned === "-" || cleaned === ".") return 0;
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return 0;
    return Math.round(n * 100);
  }
  return Math.round(value * 100);
}

export function formatMoney(cents: number, opts?: { signed?: boolean; compact?: boolean }) {
  const dollars = cents / 100;
  const formatted = (opts?.compact ? compact : currency).format(Math.abs(dollars));
  if (opts?.signed) {
    if (cents > 0) return `+${formatted}`;
    if (cents < 0) return `-${formatted}`;
  }
  return formatted;
}

export function formatAbs(cents: number) {
  return currency.format(Math.abs(cents) / 100);
}

export function sumCents(values: number[]) {
  return values.reduce((sum, n) => sum + n, 0);
}