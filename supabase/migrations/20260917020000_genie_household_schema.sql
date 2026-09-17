-- Genie household schema: shared books for household members, locked down by RLS.
-- Applied to project ylwmselditykrhzfzrxx on 2026-09-17 via Supabase MCP.

create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our household',
  created_at timestamptz not null default now()
);

create table public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  primary key (household_id, user_id)
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  institution text not null default 'other',
  type text not null default 'checking',
  mask text,
  last_imported_at timestamptz,
  created_at timestamptz not null default now()
);
create index accounts_household_idx on public.accounts (household_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  date date not null,
  description text not null,
  merchant text not null,
  amount_cents bigint not null,
  category_id text not null default 'uncategorized',
  external_id text,
  source text not null default 'import',
  excluded boolean not null default false,
  created_at timestamptz not null default now()
);
create index transactions_household_date_idx on public.transactions (household_id, date desc);
create index transactions_account_idx on public.transactions (account_id);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  category_id text not null,
  monthly_cents bigint not null,
  unique (household_id, category_id)
);

create table public.recurring_overrides (
  household_id uuid not null references public.households(id) on delete cascade,
  merchant_key text not null,
  merchant text not null,
  status text not null default 'active',
  primary key (household_id, merchant_key)
);

-- Membership helper. SECURITY DEFINER so policies can consult household_members
-- without recursive RLS lookups.
create or replace function public.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.household_members m
    where m.household_id = hid
      and m.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_overrides enable row level security;

create policy "members read household" on public.households
  for select to authenticated using (public.is_household_member(id));
create policy "members rename household" on public.households
  for update to authenticated using (public.is_household_member(id)) with check (public.is_household_member(id));

create policy "members see membership" on public.household_members
  for select to authenticated using (public.is_household_member(household_id));

create policy "members manage accounts" on public.accounts
  for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "members manage transactions" on public.transactions
  for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "members manage budgets" on public.budgets
  for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));

create policy "members manage recurring overrides" on public.recurring_overrides
  for all to authenticated using (public.is_household_member(household_id)) with check (public.is_household_member(household_id));
