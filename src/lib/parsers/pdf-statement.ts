import { isValid, parse } from "date-fns";
import { displayMerchant, guessCategory } from "../categorize";
import { toISODate } from "../dates";
import type { ParseResult, ParsedTransaction } from "../types";

const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";

// A transaction line starts with a date: 08/22/26, 08/22/2026, 08/22, Aug 22, 2026, Aug 22.
const LEADING_DATE = new RegExp(
  `^(\\d{1,2}/\\d{1,2}(?:/\\d{2,4})?|(?:${MONTHS})[a-z]*\\.?\\s+\\d{1,2}(?:,?\\s+\\d{4})?)\\*?\\s+`,
  "i",
);

// A transaction line ends with an amount: 87.43, $87.43, -$1,850.00, $1,850.00 CR, ($12.00).
const TRAILING_AMOUNT = /(\(?-?\$?-?(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2}\)?)(\s*(?:CR|DR))?\s*[^\w$().-]*$/i;

const SUMMARY_LINE =
  /^(new balance|previous balance|minimum payment|payment due|closing date|opening date|statement (period|closing)|available credit|credit limit|total (fees|interest|charges|payments|credits|new charges|balance)|interest charge|account ending)/i;

interface PartialDate {
  month: number;
  day: number;
  year?: number;
}

function readDate(token: string): PartialDate | null {
  const cleaned = token.replace(/\*$/, "").replace(/\./g, "").replace(/,/g, "").trim();
  const numeric = cleaned.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (numeric) {
    const month = Number(numeric[1]);
    const day = Number(numeric[2]);
    let year = numeric[3] ? Number(numeric[3]) : undefined;
    if (year !== undefined && year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { month, day, year };
  }

  const named = cleaned.match(/^([a-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?$/i);
  if (named) {
    const parsed = parse(`${named[1].slice(0, 3)} ${named[2]} 2000`, "MMM d yyyy", new Date(2000, 0, 1));
    if (!isValid(parsed)) return null;
    return {
      month: parsed.getMonth() + 1,
      day: Number(named[2]),
      year: named[3] ? Number(named[3]) : undefined,
    };
  }
  return null;
}

function toIso(date: PartialDate, anchor: Date): string | null {
  let year = date.year ?? anchor.getFullYear();
  // Statements without years: anything after the anchor month belongs to last year.
  if (date.year === undefined && date.month > anchor.getMonth() + 1) year -= 1;
  const value = new Date(year, date.month - 1, date.day);
  if (!isValid(value) || value.getMonth() !== date.month - 1) return null;
  return toISODate(value);
}

function readAmountCents(raw: string, suffix: string | undefined): number | null {
  const negative = /-/.test(raw) || /^\(.*\)$/.test(raw.trim()) || /cr/i.test(suffix ?? "");
  const digits = raw.replace(/[^\d.]/g, "");
  if (!digits) return null;
  const cents = Math.round(Number(digits) * 100);
  if (!Number.isFinite(cents)) return null;
  return negative ? -cents : cents;
}

/** Find the statement closing date so year-less dates (08/22) land in the right year. */
function findAnchorDate(lines: string[], today: Date): Date {
  const patterns = [
    /closing date[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /\d{1,2}\/\d{1,2}\/\d{2,4}\s*(?:-|–|to|through)\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /statement date[:\s]+(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  ];
  for (const pattern of patterns) {
    for (const line of lines) {
      const match = line.match(pattern);
      if (!match) continue;
      const date = readDate(match[1]);
      if (date?.year) return new Date(date.year, date.month - 1, date.day);
    }
  }
  return today;
}

function looksLikeAmexPdf(lines: string[], filename: string) {
  const sample = `${filename}\n${lines.slice(0, 200).join("\n")}`.toLowerCase();
  return /american express|\bamex\b|americanexpress\.com/.test(sample);
}

/**
 * Parse transactions out of the text lines of a PDF statement (e.g. Amex mobile exports).
 * Credit-card convention: positive amounts are charges, negative/CR amounts are payments and credits.
 */
export function parsePdfStatementLines(lines: string[], filename = "", today = new Date()): ParseResult {
  const cleaned = lines.map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const anchor = findAnchorDate(cleaned, today);
  const amex = looksLikeAmexPdf(cleaned, filename);
  const transactions: ParsedTransaction[] = [];

  for (let i = 0; i < cleaned.length; i += 1) {
    const line = cleaned[i];
    const dateMatch = line.match(LEADING_DATE);
    if (!dateMatch) continue;
    const date = readDate(dateMatch[1]);
    if (!date) continue;

    // Some statements print a transaction date and a post date; drop the second.
    let rest = line.slice(dateMatch[0].length);
    const secondDate = rest.match(LEADING_DATE);
    if (secondDate && readDate(secondDate[1])) rest = rest.slice(secondDate[0].length);

    // Descriptions sometimes wrap so the amount lands on a following line.
    let amountMatch = rest.match(TRAILING_AMOUNT);
    let consumed = 0;
    while (!amountMatch && consumed < 2 && i + consumed + 1 < cleaned.length) {
      const next = cleaned[i + consumed + 1];
      if (LEADING_DATE.test(next)) break;
      rest = `${rest} ${next}`;
      consumed += 1;
      amountMatch = rest.match(TRAILING_AMOUNT);
    }
    if (!amountMatch || amountMatch.index === undefined) continue;

    const description = rest.slice(0, amountMatch.index).replace(/\s+\$?$/, "").trim();
    if (!description || !/[a-z]/i.test(description) || SUMMARY_LINE.test(description)) continue;

    const amount = readAmountCents(amountMatch[1], amountMatch[2]);
    const iso = toIso(date, anchor);
    if (amount === null || amount === 0 || !iso) continue;

    i += consumed;
    transactions.push({
      date: iso,
      description,
      merchant: displayMerchant(description),
      // Statement shows charges as positive; Genie stores spending as negative.
      amountCents: -amount,
      categoryHint: guessCategory(description),
    });
  }

  const warnings: string[] = [];
  if (cleaned.length === 0) {
    warnings.push("This PDF has no selectable text (it may be a scanned image), so Genie cannot read it.");
  } else if (transactions.length === 0) {
    warnings.push("Could not find any transactions in this PDF. Lines need a date at the start and an amount at the end.");
  } else if (!amex) {
    warnings.push("Read this PDF as a credit card statement (charges positive, payments negative). Double-check the signs before importing.");
  }

  return {
    source: amex ? "amex" : "generic",
    format: amex ? "American Express PDF" : "PDF statement",
    transactions,
    warnings,
  };
}
