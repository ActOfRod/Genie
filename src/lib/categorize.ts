import { CATEGORIES } from "./categories";
import { titleCase } from "./utils";

function haystack(description: string) {
  return description
    .toUpperCase()
    .replace(/[#*]/g, " ")
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// More specific merchants first. Description matches beat Amex category hints.
const RULES: Array<{ categoryId: string; patterns: RegExp[] }> = [
  {
    categoryId: "income",
    patterns: [
      /\b(PAYROLL|DIRECT DEP|DIRECT DEPOSIT|DIR DEP|SALARY|ADP |PAYCHEX|GUSTO|WORKDAY)\b/,
      /\bKSG TEMP\b/,
      /\bINTEREST (PAID|CREDIT|EARNED)\b/,
      /\bDIVIDEND\b/,
    ],
  },
  {
    categoryId: "auto",
    patterns: [
      /\bTRANSFER TO L 0140\b/,
      /\bCAPITAL ONE AUTO\b/,
      /\b(AUTOZONE|O ?REILLY|NAPA |JIFFY LUBE|VALVOLINE|FIRESTONE|DISCOUNT TIRE|CAR WASH|PARKING|TOLLS?)\b/,
    ],
  },
  {
    categoryId: "housing",
    patterns: [
      /\b(RENT|MORTGAGE|HOA |PROPERTY TAX|LANDLORD|APARTMENT)\b/,
      /\bMIDWEST LOAN\b/,
      /\bMTG PMT\b/,
    ],
  },
  {
    categoryId: "transfer",
    patterns: [
      /\bAPPLE ?CARD\b/,
      /\bWELLS FARGO\b/,
      /\bAFFIRM\b/,
      /\bELGA( CREDIT UNION)?\b/,
      /\b(AMEX|AMERICAN EXPRESS).*(EPAYMENT|PAYMENT|ACH)\b/,
      /\bPAYMENT THANK YOU\b/,
      /\bAUTOPAY\b/,
      /\bTRANSFER (TO|FROM)\b/,
      /\bONLINE TRANSFER\b/,
      /\bGENISYS.*(TRANSFER|XFER)\b/,
      /\bCREDIT CARD PAYMENT\b/,
      /\bPAYMENT RECEIVED\b/,
      /\b(VENMO|ZELLE|CASH APP|CASHAPP|SQUARE CASH)\b/,
    ],
  },
  {
    categoryId: "utilities",
    patterns: [/\b(DTE ENERGY|DTE |CONSUMERS ENERGY|WATER|SEWER|WASTE MGMT|REPUBLIC SERVICES|NATURAL GAS)\b/],
  },
  {
    categoryId: "internet",
    patterns: [
      /\bMINT MOBILE\b/,
      /\b(XFINITY|COMCAST|AT&T|ATT |T-MOBILE|VERIZON|SPECTRUM|GOOGLE FI|VISIBLE|US CELLULAR)\b/,
    ],
  },
  {
    categoryId: "subscriptions",
    patterns: [
      /\bAPPLE COM( BILL)?\b/,
      /\bGOOGLE ONE\b/,
      /\bGOOGLE WORKSPACE\b/,
      /\bG ?SUITE\b/,
      /\bGO ?DADDY\b/,
      /\b(NETFLIX|SPOTIFY|HULU|DISNEY PLUS|HBO|ITUNES|ICLOUD|YOUTUBE|AMAZON PRIME|PRIME VIDEO|PARAMOUNT|PEACOCK|NYTIMES|NEW YORK TIMES|WSJ|AUDIBLE|DROPBOX|ADOBE|MICROSOFT|OPENAI|CHATGPT|ANTHROPIC|CURSOR)\b/,
      /\b(PLANET FITNESS|LA FITNESS|ANYTIME FITNESS|YMCA|PELOTON)\b/,
    ],
  },
  {
    categoryId: "gas",
    patterns: [
      /\bMEIJER GAS\b/,
      /\bCOSTCO GAS\b/,
      /\b(SHELL|BP |EXXON|MOBIL|SPEEDWAY|SUNOCO|MARATHON|CIRCLE K|WAWA|SHEETZ)\b/,
    ],
  },
  {
    categoryId: "groceries",
    patterns: [
      /\b(MEIJER|KROGER|COSTCO|SAM S CLUB|SAMS CLUB|WHOLE FOODS|TRADER JOE|ALDI|WALMART|TARGET|PUBLIX|FOOD LION|SPROUTS|H E B|GIANT EAGLE|FRESH THYME)\b/,
      /\bGROCERY\b/,
    ],
  },
  {
    categoryId: "coffee",
    patterns: [/\b(STARBUCKS|DUNKIN|PEET S|BLUE BOTTLE|INTELLIGENTSIA|BIGGBY|TIM HORTON)\b/],
  },
  {
    categoryId: "dining",
    patterns: [
      /\bMARKET( AT)? WORK\b/,
      /\bBROKEN YOLK\b/,
      /\b(CHIPOTLE|MCDONALD|PANERA|SWEETGREEN|SHAKE SHACK|WENDY|TACO BELL|CHICK FIL A|CHICK FIL|POPEYES|SUBWAY|DOMINO|PIZZA|DOORDASH|UBER EATS|GRUBHUB|CAVA|FIVE GUYS|OLIVE GARDEN|APPLEBEE|CHILI S|OUTBACK)\b/,
      /\b(RESTAURANT|REST |GRILL|BISTRO|TAQUERIA|SUSHI|RAMEN|BAR |BREWING|BREWERY)\b/,
    ],
  },
  {
    categoryId: "insurance",
    patterns: [/\b(GEICO|STATE FARM|PROGRESSIVE|ALLSTATE|USAA|FARMERS INS|LIBERTY MUTUAL|AUTO OWNERS|AAA )\b/],
  },
  {
    categoryId: "repairs",
    patterns: [
      /\b(HOME DEPOT|LOWE S|LOWES|MENARDS|ACE HARDWARE|HARBOR FREIGHT)\b/,
      /\b(PLUMBER|PLUMBING|HVAC|ROOFER|ROOFING|HANDYMAN|ELECTRICIAN|FURNACE|WATER HEATER|GARAGE DOOR)\b/,
    ],
  },
  {
    categoryId: "shopping",
    patterns: [
      /\bFAMILY DOLLAR\b/,
      /\b(AMAZON|AMZN|TARGET|BEST BUY|IKEA|ETSY|TJ MAXX|MARSHALLS|HOMEGOODS|NORDSTROM|MACY S|MACYS)\b/,
    ],
  },
  {
    categoryId: "entertainment",
    patterns: [/\b(AMC |REGAL|CINEMA|STEAM(GAMES)?|NINTENDO|PLAYSTATION|XBOX|TICKETMASTER|STUBHUB|CONCERT)\b/],
  },
  {
    categoryId: "health",
    patterns: [
      /\b(CVS|WALGREENS|RITE AID|PHARMACY|MEIJER PHARM|DENTAL|ORTHO|PHYSICIAN|UNIV OF MI|BEAUMONT|HENRY FORD|COREWELL|LABCORP|QUEST DIAG)\b/,
    ],
  },
  {
    categoryId: "pets",
    patterns: [
      /\bORION ANIMAL\b/,
      /\b(ANIMAL HOSPITAL|VETERINARY|VET CLINIC)\b/,
      /\b(HILLS? SCIENCE|SCIENCE DIET|HILL S SCIENCE)\b/,
      /\b(CHEWY|PETCO|PETSMART|PET SUPPLIES|ROYAL CANIN|PET FOOD)\b/,
    ],
  },
  {
    categoryId: "personal",
    patterns: [/\b(GREAT CLIPS|SUPERCUTS|SALON|SPA |BARBER|ULTA|SEPHORA)\b/],
  },
  {
    categoryId: "nicotine",
    patterns: [/\bWILD BILL/, /\b(VAPE|VAPOR|TOBACCO|SMOKE SHOP|CIGAR)\b/],
  },
  {
    categoryId: "travel",
    patterns: [/^VACATION$/, /\b(VACATION FUND|VACATION SAVINGS|VACATION TRIP)\b/],
  },
  {
    categoryId: "travel",
    patterns: [/\b(AIRLINE|DELTA |UNITED |SOUTHWEST|AMERICAN AIR|AIRBNB|MARRIOTT|HILTON|HYATT|HOTEL|EXPEDIA|BOOKING COM)\b/],
  },
  {
    categoryId: "gifts",
    patterns: [/\b(DONATION|CHURCH|TITHE|GOFUNDME|RED CROSS)\b/],
  },
  {
    categoryId: "fees",
    patterns: [/\b(FEE|INTEREST CHARGE|FOREIGN TRANSACTION|OVERDRAFT|NSF |ANNUAL MEMBERSHIP)\b/],
  },
  {
    categoryId: "transit",
    patterns: [/\b(UBER|LYFT|METRO|SMART BUS|AMTRAK|PARKING METER)\b/],
  },
];

const AMEX_CATEGORY_MAP: Record<string, string> = {
  "merchandise & supplies-groceries": "groceries",
  groceries: "groceries",
  restaurant: "dining",
  restaurants: "dining",
  "restaurant-restaurant": "dining",
  "merchandise & supplies-internet purchase": "shopping",
  "merchandise & supplies": "shopping",
  "entertainment-other entertainment": "entertainment",
  transportation: "auto",
  "transportation-fuel": "gas",
  "transportation-taxis & coach": "transit",
  "business services-insurance": "insurance",
  "communications-cable & internet svcs": "internet",
  "communications-other communication svcs": "internet",
  "fees & adjustments": "fees",
  "travel-airline": "travel",
  "travel-lodging": "travel",
};

const LEADING = new Set([
  "POS",
  "PURCHASE",
  "DEBIT",
  "CREDIT",
  "NST",
  "THE",
  "CORRECTION",
  "CARD",
  "CHECKCARD",
  "VISA",
  "ACH",
  "WEB",
  "ONLINE",
  "RECURRING",
  "SQ",
  "TST",
  "SP",
  "APL",
  "OCC",
  "DEPOSIT",
  "WITHDRAWAL",
  "PAYMENT",
  "FROM",
  "TO",
]);

// Second words that are part of the brand, not the city on the statement.
const KEEP_SECOND = new Set([
  "DEPOT",
  "DOLLAR",
  "YOLK",
  "BILLS",
  "HUT",
  "CLUB",
  "FOODS",
  "JOE",
  "JOES",
  "MART",
  "EXPRESS",
  "HARDWARE",
  "PIZZA",
  "CAFE",
  "COFFEE",
  "FRESH",
  "MARKET",
  "ANIMAL",
  "HOSPITAL",
]);

const QUALIFIER = new Set(["GAS", "FUEL", "PHARMACY", "RX"]);
const SUFFIX = new Set(["LLC", "INC", "CORP", "LTD", "CO", "COMPANY"]);
const BLOCKED = new Set([
  "TRANSFER",
  "PAYMENT",
  "DEPOSIT",
  "WITHDRAWAL",
  "PURCHASE",
  "MOBILE",
  "BANKING",
  "CHECK",
  "FEE",
  "INTEREST",
  "ALLOWANCE",
  "REMOTE",
  "FROM",
  "TO",
]);
const STATES = new Set(
  "AL AK AZ AR CA CO CT DC DE FL GA HI IA ID IL IN KS KY LA MA MD ME MI MN MO MS MT NC ND NE NH NJ NM NV NY OH OK OR PA RI SC SD TN TX UT VA VT WA WI WV WY".split(
    " ",
  ),
);
const RESIDUE = /^(SUPER(CENTER)?.*|CENTER|STORE|STORES|COM|WWW|MARKETPLACE|MKTPLACE|MKTP|BILL|PHONE)$/;

function merchantLetters(value: string) {
  return value
    .toUpperCase()
    .replace(/['’]/g, "")
    .replace(/\./g, " ")
    .replace(/-/g, "")
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\d+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Stable store identity. Walmart.com, Wal-Mart Super Center, and WAL-MART #3726
 * share a key, while Meijer Gas stays separate from Meijer groceries.
 * Returns null for transfers and other descriptions that are not a store.
 */
export function merchantCategoryKey(description: string, merchant = ""): string | null {
  const normalized = merchantLetters(`${description} ${merchant}`);
  if (/\b(TRANSFER|XFER|REMOTE BANKING)\b/.test(normalized)) return null;

  let words = normalized.split(" ").filter((word) => word.length >= 3 && !SUFFIX.has(word) && !RESIDUE.test(word));
  while (words.length && LEADING.has(words[0])) words.shift();

  const stateAt = words.findIndex((word, index) => index > 0 && STATES.has(word));
  if (stateAt > 0) words = words.slice(0, stateAt);

  while (
    words.length > 2 &&
    !KEEP_SECOND.has(words[words.length - 1]) &&
    !QUALIFIER.has(words[words.length - 1])
  ) {
    words.pop();
  }

  if (words.length === 0) return null;

  const key =
    words.length >= 2 && (QUALIFIER.has(words[1]) || KEEP_SECOND.has(words[1]) || words[0].length < 5)
      ? `${words[0]} ${words[1]}`
      : words[0];

  if (key.length < 4 || BLOCKED.has(key) || BLOCKED.has(words[0])) return null;
  return key;
}

export function merchantCategoryLabel(description: string, merchant = "") {
  const key = merchantCategoryKey(description, merchant);
  return key ? titleCase(key.toLowerCase()) : null;
}

export function categoryForTransaction(
  description: string,
  merchant = "",
  hint?: string,
  learned?: ReadonlyMap<string, string>,
) {
  const key = merchantCategoryKey(description, merchant);
  const taught = key && learned ? learned.get(key) : undefined;
  if (taught) return taught;
  return guessCategory(description, hint);
}

export function guessCategory(description: string, hint?: string) {
  const normalized = haystack(description);
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.categoryId;
    }
  }

  if (hint) {
    const mapped = AMEX_CATEGORY_MAP[hint.toLowerCase().trim()];
    if (mapped) return mapped;
    const byName = CATEGORIES.find((category) => category.name.toLowerCase() === hint.toLowerCase());
    if (byName) return byName.id;
  }

  return "uncategorized";
}

export function displayMerchant(description: string) {
  const cleaned = description
    .replace(/\s{2,}/g, " ")
    .replace(/\*+/g, " ")
    .replace(/\b\d{4,}\b/g, "")
    .trim();

  const cut = cleaned.split(",")[0]?.trim() ?? cleaned;
  return cut.length > 32 ? `${cut.slice(0, 29)}…` : cut;
}