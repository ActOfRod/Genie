# Supabase setup for Genie

Notes for future agents and developers.

## Project

- Supabase project: **GenieSpend**, ref `ylwmselditykrhzfzrxx` (org: Delve Dungeons, region us-west-2)
- API URL: `https://ylwmselditykrhzfzrxx.supabase.co`
- Link a local checkout with the Supabase CLI:

```bash
supabase login
supabase init
supabase link --project-ref ylwmselditykrhzfzrxx
```

## Schema

Migrations live in `supabase/migrations/` and have already been applied to the project (via the Supabase MCP `apply_migration` tool — the files here are the source of record).

- One shared **household**; both users are rows in `household_members`.
- Every data table (`accounts`, `transactions`, `budgets`, `recurring_overrides`) carries a `household_id` and is protected by row-level security via `public.is_household_member(uuid)` (SECURITY DEFINER).
- Anonymous requests see nothing. A signed-in user only sees rows for households they belong to. Signing up does not grant access to anything — membership rows are created manually.
- Realtime is enabled on the data tables so multiple signed-in devices stay in sync.

## Auth

- Email + password auth. Household members are managed in the Supabase dashboard (Auth → Users); the login screen maps display names to emails in `src/lib/supabase.ts`.
- App login credentials are intentionally NOT recorded in this repo.
- The auth users were created directly in `auth.users`/`auth.identities` via SQL (the hosted email confirmation flow can't deliver to these addresses). If you add a member: create the user, then insert a row into `public.household_members`.
- Note: Supabase enforces a 6-character minimum at signup/update but not at sign-in; the current passwords were set via SQL (`encrypted_password = extensions.crypt(..., extensions.gen_salt('bf'))`).

## Keys

- The **publishable** key is embedded in `src/lib/supabase.ts` (fallback) and is safe to expose — RLS does the protection.
- Never commit the service-role or secret keys.
