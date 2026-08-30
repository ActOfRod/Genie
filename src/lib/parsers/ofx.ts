import { dollarsToCents } from "../money";
import { parseLooseDate } from "../dates";
import { displayMerchant } from "../categorize";
import type { ParseResult } from "../types";

function decodeOfx(text: string) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

function tagValue(block: string, tag: string) {
  const closed = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  if (closed) return decodeOfx(closed[1].trim());
  const open = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, "i"));
  return open ? decodeOfx(open[1].trim()) : "";
}

export function isOfx(text: string) {
  return /OFXHEADER|<OFX|<STMTTRN|<CREDITCARDMSGSRSV1|<BANKMSGSRSV1/i.test(text);
}

export function parseOfx(text: string): ParseResult {
  const blocks = text.match(/<STMTTRN>[\s\S]*?(?:<\/STMTTRN>|(?=<STMTTRN>)|(?=<LEDGERBAL)|(?=<AVAILBAL)|(?=<\/BANKTRANLIST))/gi) ?? [];
  const warnings: string[] = [];
  const transactions = [];

  for (const block of blocks) {
    const dateRaw = tagValue(block, "DTPOSTED") || tagValue(block, "DTUSER");
    const date = parseLooseDate(dateRaw);
    const amountRaw = tagValue(block, "TRNAMT");
    const name = tagValue(block, "NAME") || tagValue(block, "PAYEE");
    const memo = tagValue(block, "MEMO");
    const fitid = tagValue(block, "FITID");
    const description = [name, memo].filter(Boolean).join(" — ");

    if (!date || !amountRaw) {
      warnings.push(`Skipped an OFX row missing date or amount (${description || "no description"}).`);
      continue;
    }

    transactions.push({
      date,
      description: description || "Genisys transaction",
      merchant: displayMerchant(name || description),
      amountCents: dollarsToCents(amountRaw),
      externalId: fitid || undefined,
    });
  }

  if (transactions.length === 0) {
    warnings.push("No transactions were found in this OFX/QFX file.");
  }

  return {
    source: "genisys",
    format: "OFX/QFX",
    transactions,
    warnings,
  };
}