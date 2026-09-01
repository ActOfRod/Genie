# Genie

A simple household money app, inspired by Rocket Money, built for **American Express** and **Genisys Credit Union**.

Genie keeps the books in this browser. There is no bank login and no third-party aggregator. You download a statement from Amex or Genisys, drop it in, and Genie categorizes spending, spots recurring charges, and tracks budgets.

## What you can do

- See spending, leftover cash, and category breakdowns for any month
- Search and recategorize activity
- Review subscriptions and other repeating bills
- Set monthly budgets
- Import Amex CSV and Genisys CSV / QFX (Quicken Web Connect)
- Export a JSON backup to move the household to another computer

## Importing statements

**American Express**

1. Sign in at [americanexpress.com](https://www.americanexpress.com)
2. Open the card → **Statements & Activity** → **Download**
3. Choose **CSV**
4. In Genie, open **Accounts** and drop the file on the Amex account

**Genisys Credit Union**

1. Sign in to Genisys online banking
2. Open the account → **Download transactions**
3. Choose a spreadsheet/CSV if offered, or **Quicken Web Connect (.qfx)**
4. Drop that file on the matching Genisys account in Genie

Duplicate rows are skipped, so you can re-import the same window safely.

## Running locally

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first visit loads a sample household so you can click around immediately. Replace it from **Settings → Start from scratch**, then import your files.

## Privacy

Transactions are stored in IndexedDB on the device that opens the app. Use **Settings → Download backup** if you want a copy, or to share the books with each other on a second computer.
