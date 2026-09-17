-- Let signed-in clients receive change notifications so both members stay in sync.
-- Applied to project ylwmselditykrhzfzrxx on 2026-09-17 via Supabase MCP.
alter publication supabase_realtime add table public.households, public.accounts, public.transactions, public.budgets, public.recurring_overrides;
