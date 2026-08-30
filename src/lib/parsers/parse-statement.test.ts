import { describe, expect, it } from "vitest";
import { parseStatement } from "./index";
import { parseCsv } from "./csv";
import { parseOfx } from "./ofx";
import { guessCategory } from "../categorize";
import { detectRecurring } from "../subscriptions";
import type { Transaction } from "../types";

const AMEX_CSV = `Date,Description,Card Member,Account #,Amount,Extended Details,Appears On Your Statement As,Address,City/State,Zip Code,Country,Reference,Category
08/22/2026,MEIJER #184 AUBURN HILLS,NATE T,-1008,87.43,MEIJER #184,MEIJER #184,123 MAIN,AUBURN HILLS/MI,48326,UNITED STATES,ABC123,Merchandise & Supplies-Groceries
08/08/2026,PAYMENT THANK YOU,NATE T,-1008,-1850.00,PAYMENT THANK YOU,PAYMENT THANK YOU,,,,,XYZ999,Payments and Credits
08/06/2026,NETFLIX.COM,NATE T,-1008,15.49,NETFLIX.COM,NETFLIX.COM,,,,,NET15,Entertainment
`;

const GENISYS_CSV = `Account Number,Post Date,Description,Debit,Credit,Balance
XXXX4421,08/01/2026,ACME CORP PAYROLL,,4820.33,12000.00
XXXX4421,08/03/2026,MORTGAGE PAYMENT - ROCKET MTG,2140.00,,9860.33
XXXX4421,08/08/2026,AMEX EPAYMENT ACH PMT,1850.00,,8010.33
`;

const GENISYS_OFX = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260801120000
<TRNAMT>4820.33
<FITID>PAY20260801
<NAME>ACME CORP PAYROLL
<MEMO>DIRECT DEPOSIT
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260808
<TRNAMT>-1850.00
<FITID>AMEX20260808
<NAME>AMEX EPAYMENT
<MEMO>ACH PMT
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

describe("CSV parser", () => {
  it("reads quoted fields and finds headers after junk rows", () => {
    const table = parseCsv('Account Summary\n"Date","Description","Amount"\n"08/01/2026","Coffee, Inc",6.45\n');
    expect(table.headers).toEqual(["date", "description", "amount"]);
    expect(table.rows[0][1]).toBe("Coffee, Inc");
  });
});

describe("AMEX CSV", () => {
  it("detects Amex, flips charge signs, and keeps payments as income-to-card", () => {
    const result = parseStatement(AMEX_CSV, "amex-activity.csv");
    expect(result.source).toBe("amex");
    expect(result.transactions).toHaveLength(3);

    const meijer = result.transactions.find((txn) => txn.description.includes("MEIJER"));
    const payment = result.transactions.find((txn) => txn.description.includes("PAYMENT"));
    expect(meijer?.amountCents).toBe(-8743);
    expect(payment?.amountCents).toBe(185000);
    expect(meijer?.categoryHint).toBe("groceries");
  });
});

describe("Genisys CSV and OFX", () => {
  it("reads debit/credit columns from a credit union export", () => {
    const result = parseStatement(GENISYS_CSV, "genisys-checking.csv");
    expect(result.source).toBe("genisys");
    const pay = result.transactions.find((txn) => txn.description.includes("PAYROLL"));
    const mortgage = result.transactions.find((txn) => txn.description.includes("MORTGAGE"));
    expect(pay?.amountCents).toBe(482033);
    expect(mortgage?.amountCents).toBe(-214000);
  });

  it("parses QFX/OFX from Genisys Web Connect", () => {
    const result = parseOfx(GENISYS_OFX);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].amountCents).toBe(482033);
    expect(result.transactions[1].externalId).toBe("AMEX20260808");
    expect(parseStatement(GENISYS_OFX, "history.qfx").source).toBe("genisys");
  });
});

describe("categorize and subscriptions", () => {
  it("maps common merchants", () => {
    expect(guessCategory("MEIJER #184 AUBURN HILLS")).toBe("groceries");
    expect(guessCategory("AMEX EPAYMENT ACH PMT")).toBe("transfer");
    expect(guessCategory("NETFLIX.COM")).toBe("subscriptions");
  });

  it("detects monthly recurring charges", () => {
    const transactions: Transaction[] = ["2026-05-06", "2026-06-06", "2026-07-06", "2026-08-06"].map(
      (date, index) => ({
        id: String(index),
        accountId: "amex",
        date,
        description: "NETFLIX.COM",
        merchant: "NETFLIX.COM",
        amountCents: -1549,
        categoryId: "subscriptions",
        source: "seed",
        excluded: false,
        createdAt: date,
      }),
    );
    const found = detectRecurring(transactions);
    expect(found).toHaveLength(1);
    expect(found[0].cadence).toBe("monthly");
    expect(found[0].count).toBe(4);
  });
});