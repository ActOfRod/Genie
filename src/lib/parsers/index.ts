import { dollarsToCents } from "../money";
import { parseLooseDate } from "../dates";
import { displayMerchant, guessCategory } from "../categorize";
import type { ParseResult, ParsedTransaction } from "../types";
import { columnIndex, parseCsv } from "./csv";
import { isOfx, parseOfx } from "./ofx";

function looksLikeAmex(headers: string[], filename: string) {
  const joined = `${headers.join("|")}|${filename}`.toLowerCase();
  return (
    joined.includes("appears on your statement as") ||
    joined.includes("card member") ||
    joined.includes("extended details") ||
    /\bamex\b|american express/.test(joined)
  );
}

function looksLikeGenisys(headers: string[], filename: string) {
  const joined = `${headers.join("|")}|${filename}`.toLowerCase();
  return (
    joined.includes("genisys") ||
    (headers.includes("debit") && headers.includes("credit")) ||
    joined.includes("post date") ||
    joined.includes("check number")
  );
}

function readAmount(row: string[], headers: string[]): number | null {
  const amountIdx = columnIndex(headers, ["amount", "transaction amount", "amt"]);
  const debitIdx = columnIndex(headers, ["debit", "withdrawal", "withdrawals"]);
  const creditIdx = columnIndex(headers, ["credit", "deposit", "deposits"]);

  if (amountIdx >= 0 && row[amountIdx]) {
    return dollarsToCents(row[amountIdx]);
  }

  const debit = debitIdx >= 0 && row[debitIdx] ? dollarsToCents(row[debitIdx]) : 0;
  const credit = creditIdx >= 0 && row[creditIdx] ? dollarsToCents(row[creditIdx]) : 0;
  if (debit && credit) return credit - debit;
  if (debit) return -Math.abs(debit);
  if (credit) return Math.abs(credit);
  return null;
}

function toParsed(
  row: string[],
  headers: string[],
  opts: { flipCharges?: boolean },
): ParsedTransaction | null {
  const dateIdx = columnIndex(headers, [
    "date",
    "transaction date",
    "trans date",
    "post date",
    "posted date",
    "trans. date",
  ]);
  const descIdx = columnIndex(headers, [
    "description",
    "payee",
    "name",
    "memo",
    "appears on your statement as",
    "extended details",
  ]);
  const refIdx = columnIndex(headers, ["reference", "ref", "fitid", "transaction id", "check"]);
  const categoryIdx = columnIndex(headers, ["category"]);

  if (dateIdx < 0 || descIdx < 0) return null;
  const date = parseLooseDate(row[dateIdx] ?? "");
  const amount = readAmount(row, headers);
  const description = (row[descIdx] ?? "").trim();
  if (!date || amount === null || !description) return null;

  let amountCents = amount;
  if (opts.flipCharges) {
    // AMEX CSV: charges are usually positive, payments/credits negative.
    amountCents = -amount;
  }

  return {
    date,
    description,
    merchant: displayMerchant(description),
    amountCents,
    externalId: refIdx >= 0 ? row[refIdx] || undefined : undefined,
    categoryHint: categoryIdx >= 0 ? row[categoryIdx] : undefined,
  };
}

export function parseStatement(text: string, filename = ""): ParseResult {
  if (isOfx(text)) {
    const parsed = parseOfx(text);
    return {
      ...parsed,
      transactions: parsed.transactions.map((txn) => ({
        ...txn,
        categoryHint: guessCategory(txn.description),
      })),
    };
  }

  const table = parseCsv(text);
  if (table.headers.length === 0) {
    return {
      source: "generic",
      format: "Unknown",
      transactions: [],
      warnings: ["This file does not look like a CSV or OFX/QFX statement."],
    };
  }

  const amex = looksLikeAmex(table.headers, filename);
  const genisys = !amex && looksLikeGenisys(table.headers, filename);
  const warnings: string[] = [];
  const transactions: ParsedTransaction[] = [];

  for (const row of table.rows) {
    const parsed = toParsed(row, table.headers, { flipCharges: amex });
    if (!parsed) {
      continue;
    }
    transactions.push({
      ...parsed,
      categoryHint: guessCategory(parsed.description, parsed.categoryHint),
    });
  }

  if (transactions.length === 0) {
    warnings.push("Found headers but could not read any transactions. Check that the file has Date, Description, and Amount columns.");
  }

  return {
    source: amex ? "amex" : genisys ? "genisys" : "generic",
    format: amex ? "American Express CSV" : genisys ? "Genisys CSV" : "CSV",
    transactions,
    warnings,
  };
}

export function fingerprint(accountId: string, txn: ParsedTransaction) {
  const desc = txn.description.toLowerCase().replace(/\s+/g, " ").trim();
  const natural = [accountId, txn.date, txn.amountCents, desc].join("|");
  if (txn.externalId) {
    return [`${accountId}|id|${txn.externalId}`, natural];
  }
  return [natural];
}