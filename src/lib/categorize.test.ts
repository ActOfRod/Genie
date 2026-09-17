import { describe, expect, it } from "vitest";
import { guessCategory } from "./categorize";

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
    expect(guessCategory("STEAM PURCHASE")).toBe("entertainment");
    expect(guessCategory("WILD BILL'S TOBACCO")).toBe("nicotine");
    expect(guessCategory("SUMMER VACATION RESORT")).toBe("vacation");
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
