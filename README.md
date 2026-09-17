# Genie

A simple household money app, inspired by Rocket Money, built for **American Express** and **Genisys Credit Union**.

Sign in as a household member, import statements from Amex or Genisys, and Genie categorizes spending, spots recurring charges, and tracks budgets. Data lives in a shared Supabase database protected by row-level security, so both members see the same books on any device.

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

## Live site

Every merge to `main` publishes a static build to GitHub Pages:

**https://actofrod.github.io/Genie/**

The site is public but the data is not: without signing in as a household member, nothing loads.

## Running locally

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in as a household member.

To preview the GitHub Pages build locally:

```bash
GITHUB_PAGES=true npm run build
npm start
```

## Storage & security

- All data lives in Supabase (project notes in `supabase/README.md`) behind email/password auth.
- Every table uses row-level security keyed to household membership — anonymous visitors and non-members see nothing.
- Login credentials are managed in the Supabase dashboard, not in this repo.
- Use **Settings → Download backup** for a JSON copy of everything.
