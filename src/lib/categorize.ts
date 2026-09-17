import { CATEGORIES } from "./categories";

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
    categoryId: "shopping",
    patterns: [
      /\bFAMILY DOLLAR\b/,
      /\b(AMAZON|AMZN|TARGET|HOME DEPOT|LOWE S|LOWES|BEST BUY|IKEA|ETSY|TJ MAXX|MARSHALLS|HOMEGOODS|NORDSTROM|MACY S|MACYS)\b/,
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
    patterns: [/\bWILD BILL/, /\b(TOBACCO|SMOKE SHOP|CIGAR)\b/, /\b(GREAT CLIPS|SUPERCUTS|SALON|SPA |BARBER|ULTA|SEPHORA)\b/],
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

  const cut = cleaned.split(/[,-]/)[0]?.trim() ?? cleaned;
  return cut.length > 32 ? `${cut.slice(0, 29)}…` : cut;
}