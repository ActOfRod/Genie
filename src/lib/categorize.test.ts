import { describe, expect, it } from "vitest";
import { categoryForTransaction, guessCategory, merchantCategoryKey } from "./categorize";

describe("guessCategory", () => {
  it("maps household merchants from the cheat sheet", () => {
    expect(guessCategory("KSG TEMP/DIR DEP")).toBe("income");
    expect(guessCategory("MIDWEST LOAN/MTG PMT")).toBe("housing");
    expect(guessCategory("CAPITAL ONE AUTO ACH")).toBe("auto");
    expect(guessCategory("Withdrawal Transfer to L:0140")).toBe("auto");
    expect(guessCategory("Withdrawal Transfer to L:2099")).toBe("transfer");
    expect(guessCategory("APPLECARD GSBANK/PAYMENT")).toBe("transfer");
    expect(guessCategory("WELLS FARGO CARD PAYMENT")).toBe("transfer");
    expect(guessCategory("AFFIRM *PAYMENT")).toBe("transfer");
    expect(guessCategory("ELGA CREDIT UNION")).toBe("transfer");
    expect(guessCategory("SQUARE CASH")).toBe("transfer");
    expect(guessCategory("CONSUMERS ENERGY")).toBe("utilities");
    expect(guessCategory("MINT MOBILE")).toBe("internet");
    expect(guessCategory("GOOGLE ONE")).toBe("subscriptions");
    expect(guessCategory("GOOGLE *Workspace_ando")).toBe("subscriptions");
    expect(guessCategory("GOOGLE GSUITE")).toBe("subscriptions");
    expect(guessCategory("GODADDY.COM")).toBe("subscriptions");
    expect(guessCategory("AMAZON PRIME")).toBe("subscriptions");
    expect(guessCategory("PLANET FITNESS")).toBe("subscriptions");
    expect(guessCategory("MEIJER GAS AUBURN HILLS")).toBe("gas");
    expect(guessCategory("MEIJER #184 AUBURN HILLS")).toBe("groceries");
    expect(guessCategory("MARKET@WORK")).toBe("dining");
    expect(guessCategory("THE BROKEN YOLK")).toBe("dining");
    expect(guessCategory("FAMILY DOLLAR")).toBe("shopping");
    expect(guessCategory("THE HOME DEPOT 002862 FLINT MI")).toBe("repairs");
    expect(guessCategory("LOWE'S #2305 ROCHESTER HIL MI")).toBe("repairs");
    expect(guessCategory("RITE WAY PLUMBING")).toBe("repairs");
    expect(guessCategory("STEAM PURCHASE")).toBe("entertainment");
    expect(guessCategory("WILD BILL'S TOBACCO")).toBe("nicotine");
    expect(guessCategory("VACATION")).toBe("travel");
    expect(guessCategory("RIVER CHURCH TITHE")).toBe("gifts");
    expect(guessCategory("ORION ANIMAL HOSPITAL")).toBe("pets");
    expect(guessCategory("HILLS SCIENCE DIET")).toBe("pets");
    expect(guessCategory("CHEWY.COM")).toBe("pets");
  });

  it("lets a description rule beat an Amex category hint", () => {
    expect(guessCategory("APPLE.COM/BILL", "Merchandise & Supplies-Internet Purchase")).toBe(
      "subscriptions",
    );
    expect(guessCategory("NETFLIX.COM", "Entertainment")).toBe("subscriptions");
    expect(guessCategory("MEIJER #184 AUBURN HILLS", "Merchandise & Supplies-Groceries")).toBe(
      "groceries",
    );
  });

  it("falls back to the Amex hint when no merchant rule matches", () => {
    expect(guessCategory("SOME LOCAL SHOP", "Merchandise & Supplies-Internet Purchase")).toBe(
      "shopping",
    );
  });
});

describe("merchantCategoryKey", () => {
  it("treats Walmart spellings and store numbers as one merchant", () => {
    const samples = [
      "WAL-MART SUPERCENTERGRAND BLANC         MI",
      "WAL-MART SUPERCENTER 3726 3726 GRAND BLANC MI",
      "DEBIT PURCHASE WALMART.COM 8009666546 BENTONVILLE AR",
      "POS PURCHASE Wal-Mart Super Center GRAND BLANC MI",
      "POS PURCHASE WAL-MART #3726 GRAND BLANC MI",
    ];
    expect(new Set(samples.map((sample) => merchantCategoryKey(sample)))).toEqual(new Set(["WALMART"]));
  });

  it("keeps Meijer gas separate from Meijer groceries", () => {
    expect(merchantCategoryKey("DEBIT PURCHASE MEIJER INC #197 Q01 OXFORD MI")).toBe("MEIJER");
    expect(merchantCategoryKey("MEIJER GAS AUBURN HILLS MI")).toBe("MEIJER GAS");
    expect(merchantCategoryKey("DEBIT PURCHASE THE BROKEN YOLK LLC ORION MI")).toBe("BROKEN YOLK");
    expect(merchantCategoryKey("POS PURCHASE NST THE HOME DEPOT 002862 FLINT MI")).toBe("HOME DEPOT");
    expect(merchantCategoryKey("POS PURCHASE LOWE'S #2305 ROCHESTER HIL MI")).toBe("LOWES");
  });

  it("does not learn a merchant from transfers", () => {
    expect(merchantCategoryKey("Mobile banking Deposit Transfer from Nina Marie Thompson S:1000 : Walmart")).toBe(
      null,
    );
    expect(merchantCategoryKey("allowance REMOTE BANKING")).toBe(null);
  });

  it("prefers a category the household already taught for that merchant", () => {
    const learned = new Map([["WALMART", "shopping"]]);
    expect(
      categoryForTransaction("DEBIT PURCHASE WALMART.COM 8009666546 BENTONVILLE AR", "WAL", undefined, learned),
    ).toBe("shopping");
    expect(categoryForTransaction("DEBIT PURCHASE MEIJER INC #197 OXFORD MI", "MEIJER")).toBe("groceries");
  });
});
