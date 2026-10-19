import { describe, expect, it } from "vitest";
import { parsePdfStatementLines } from "./pdf-statement";

const TODAY = new Date(2026, 9, 19);

describe("parsePdfStatementLines", () => {
  it("reads an Amex statement PDF with year-less dates and wrapped lines", () => {
    const lines = [
      "American Express Blue Cash Preferred",
      "Closing Date 09/21/26",
      "New Balance $1,234.56",
      "Payments and Credits",
      "09/08/26* AUTOPAY PAYMENT RECEIVED - THANK YOU -$1,850.00",
      "New Charges",
      "08/22/26 MEIJER #184 AUBURN HILLS MI $87.43",
      "800-555-1212",
      "09/06 NETFLIX.COM LOS GATOS CA",
      "$15.49",
      "12/30 HOLIDAY STORE $1,020.00",
      "Total New Charges $1,122.92",
    ];
    const result = parsePdfStatementLines(lines, "statement.pdf", TODAY);
    expect(result.source).toBe("amex");
    expect(result.format).toBe("American Express PDF");
    expect(result.warnings).toEqual([]);
    expect(result.transactions.map((txn) => [txn.date, txn.description, txn.amountCents])).toEqual([
      ["2026-09-08", "AUTOPAY PAYMENT RECEIVED - THANK YOU", 185000],
      ["2026-08-22", "MEIJER #184 AUBURN HILLS MI", -8743],
      ["2026-09-06", "NETFLIX.COM LOS GATOS CA", -1549],
      ["2025-12-30", "HOLIDAY STORE", -102000],
    ]);
  });

  it("handles month-name dates, post dates, and CR credits", () => {
    const lines = [
      "Amex activity",
      "Oct 3, 2026 STARBUCKS STORE 1234 6.45",
      "10/04/26 10/05/26 RETURN AMAZON MKTPLACE 25.00 CR",
    ];
    const result = parsePdfStatementLines(lines, "activity.pdf", TODAY);
    expect(result.transactions.map((txn) => [txn.date, txn.description, txn.amountCents])).toEqual([
      ["2026-10-03", "STARBUCKS STORE 1234", -645],
      ["2026-10-04", "RETURN AMAZON MKTPLACE", 2500],
    ]);
  });

  it("warns when nothing can be read", () => {
    expect(parsePdfStatementLines([], "scan.pdf", TODAY).warnings[0]).toMatch(/no selectable text/);
    expect(parsePdfStatementLines(["Hello world"], "x.pdf", TODAY).warnings[0]).toMatch(/Could not find/);
  });

  it("flags sign assumptions for non-Amex PDFs", () => {
    const result = parsePdfStatementLines(["01/02/2026 COFFEE SHOP 4.00"], "card.pdf", TODAY);
    expect(result.source).toBe("generic");
    expect(result.transactions[0].amountCents).toBe(-400);
    expect(result.warnings[0]).toMatch(/Double-check/);
  });
});
