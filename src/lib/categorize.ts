import { CATEGORIES } from "./categories";
import { normalizeMerchant } from "./utils";

const RULES: Array<{ categoryId: string; patterns: RegExp[] }> = [
  {
    categoryId: "income",
    patterns: [
      /\b(PAYROLL|DIRECT DEP|DIRECT DEPOSIT|SALARY|ADP |PAYCHEX|GUSTO|WORKDAY)\b/,
      /\bINTEREST (PAID|CREDIT|EARNED)\b/,
      /\bDIVIDEND\b/,
    ],
  },
  {
    categoryId: "transfer",
    patterns: [
      /\b(AMEX|AMERICAN EXPRESS).*(EPAYMENT|PAYMENT|ACH)\b/,
      /\bPAYMENT THANK YOU\b/,
      /\bAUTOPAY\b/,
      /\bTRANSFER (TO|FROM)\b/,
      /\bONLINE TRANSFER\b/,
      /\bGENISYS.*(TRANSFER|XFER)\b/,
      /\bCREDIT CARD PAYMENT\b/,
      /\bPAYMENT RECEIVED\b/,
      /\bVENMO|ZELLE|CASH APP\b/,
    ],
  },
  {
    categoryId: "groceries",
    patterns: [
      /\b(MEIJER|KROGER|COSTCO|SAM'?S CLUB|WHOLE FOODS|TRADER JOE|ALDI|WALMART|TARGET|PUBLIX|FOOD LION|SPROUTS|H-E-B|GIANT EAGLE|FRESH THYME)\b/,
      /\bGROCERY\b/,
    ],
  },
  {
    categoryId: "dining",
    patterns: [
      /\b(CHIPOTLE|MCDONALD|STARBUCKS|PANERA|SWEETGREEN|SHAKE SHACK|WENDY|TACO BELL|CHICK-FIL-A|CHICK FIL|POPEYES|SUBWAY|DOMINO|PIZZA|DOORDASH|UBER EATS|GRUBHUB|CAVA|FIVE GUYS|OLIVE GARDEN|APPLEBEE|CHILI'?S|OUTBACK)\b/,
      /\b(RESTAURANT|REST |GRILL|BISTRO|TAQUERIA|SUSHI|RAMEN|BAR &|BREWING|BREWERY)\b/,
    ],
  },
  {
    categoryId: "coffee",
    patterns: [/\b(STARBUCKS|DUNKIN|PEET'?S|BLUE BOTTLE|INTELLIGENTSIA|BIGGBY|TIM HORTON)\b/],
  },
  {
    categoryId: "housing",
    patterns: [/\b(RENT|MORTGAGE|HOA |PROPERTY TAX|LANDLORD|APARTMENT)\b/],
  },
  {
    categoryId: "utilities",
    patterns: [/\b(DTE ENERGY|DTE |CONSUMERS ENERGY|WATER|SEWER|WASTE MGMT|REPUBLIC SERVICES|NATURAL GAS)\b/],
  },
  {
    categoryId: "internet",
    patterns: [/\b(XFINITY|COMCAST|AT&T|ATT |T-MOBILE|VERIZON|SPECTRUM|GOOGLE FI|VISIBLE|US CELLULAR)\b/],
  },
  {
    categoryId: "insurance",
    patterns: [/\b(GEICO|STATE FARM|PROGRESSIVE|ALLSTATE|USAA|FARMERS INS|LIBERTY MUTUAL|AUTO-OWNERS|AAA )\b/],
  },
  {
    categoryId: "subscriptions",
    patterns: [
      /\b(NETFLIX|SPOTIFY|HULU|DISNEY PLUS|HBO|ITUNES|ICLOUD|YOUTUBE|AMAZON PRIME|PRIME VIDEO|PARAMOUNT|PEACOCK|NYTIMES|NEW YORK TIMES|WSJ|AUDIBLE|DROPBOX|ADOBE|MICROSOFT|OPENAI|CHATGPT|ANTHROPIC|CURSOR|APPLE COM)\b/,
      /\b(PLANET FITNESS|LA FITNESS|ANYTIME FITNESS|YMCA|PELOTON)\b/,
    ],
  },
  {
    categoryId: "gas",
    patterns: [/\b(SHELL|BP |EXXON|MOBIL|SPEEDWAY|SUNOCO|MARATHON|CIRCLE K|COSTCO GAS|MEIJER GAS|WAWA|SHEETZ)\b/],
  },
  {
    categoryId: "auto",
    patterns: [/\b(AUTOZONE|O'?REILLY|NAPA |JIFFY LUBE|VALVOLINE|FIRESTONE|DISCOUNT TIRE|CAR WASH|PARKING|TOLLS?)\b/],
  },
  {
    categoryId: "transit",
    patterns: [/\b(UBER|LYFT|METRO|SMART BUS|AMTRAK|PARKING METER)\b/],
  },
  {
    categoryId: "shopping",
    patterns: [
      /\b(AMAZON|AMZN|TARGET|HOME DEPOT|LOWE'?S|BEST BUY|IKEA|ETSY|TJ MAXX|MARSHALLS|HOMEGOODS|NORDSTROM|MACY'?S)\b/,
    ],
  },
  {
    categoryId: "entertainment",
    patterns: [/\b(AMC |REGAL|CINEMA|STEAMGAMES|NINTENDO|PLAYSTATION|XBOX|TICKETMASTER|STUBHUB|CONCERT)\b/],
  },
  {
    categoryId: "health",
    patterns: [
      /\b(CVS|WALGREENS|RITE AID|PHARMACY|MEIJER PHARM|DENTAL|ORTHO|PHYSICIAN|UNIV OF MI|BEAUMONT|HENRY FORD|COREWELL|LABCORP|QUEST DIAG)\b/,
    ],
  },
  {
    categoryId: "personal",
    patterns: [/\b(GREAT CLIPS|SUPERCUTS|SALON|SPA |BARBER|ULTA|SEPHORA)\b/],
  },
  {
    categoryId: "travel",
    patterns: [/\b(AIRLINE|DELTA |UNITED |SOUTHWEST|AMERICAN AIR|AIRBNB|MARRIOTT|HILTON|HYATT|HOTEL|EXPEDIA|BOOKING.COM)\b/],
  },
  {
    categoryId: "gifts",
    patterns: [/\b(DONATION|CHURCH|TITHE|GOFUNDME|RED CROSS)\b/],
  },
  {
    categoryId: "fees",
    patterns: [/\b(FEE|INTEREST CHARGE|FOREIGN TRANSACTION|OVERDRAFT|NSF |ANNUAL MEMBERSHIP)\b/],
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

export function guessCategory(description: string, hint?: string) {
  if (hint) {
    const mapped = AMEX_CATEGORY_MAP[hint.toLowerCase().trim()];
    if (mapped) return mapped;
    const byName = CATEGORIES.find(
      (category) => category.name.toLowerCase() === hint.toLowerCase(),
    );
    if (byName) return byName.id;
  }

  const haystack = normalizeMerchant(description);
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return rule.categoryId;
    }
  }
  return "uncategorized";
}

export function displayMerchant(description: string) {
  const cleaned = description
    .replace(/\s{2,}/g, " ")
    .replace(/\*+/g, " ")
    .replace(/\b\d{4,}\b/g, "")
    .trim();

  const cut = cleaned.split(/[,-]/)[0]?.trim() ?? cleaned;
  return cut.length > 32 ? `${cut.slice(0, 29)}…` : cut;
}