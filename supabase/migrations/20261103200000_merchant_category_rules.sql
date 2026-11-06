-- Remember a category the household picked for a merchant, so the rest of
-- that store follows (Walmart.com and Wal-Mart Super Center share a key).
create table public.merchant_rules (
  household_id uuid not null references public.households(id) on delete cascade,
  merchant_key text not null,
  category_id text not null,
  updated_at timestamptz not null default now(),
  primary key (household_id, merchant_key)
);

alter table public.merchant_rules enable row level security;

create policy "members manage merchant rules"
  on public.merchant_rules
  for all
  to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));

alter publication supabase_realtime add table public.merchant_rules;

notify pgrst, 'reload schema';
