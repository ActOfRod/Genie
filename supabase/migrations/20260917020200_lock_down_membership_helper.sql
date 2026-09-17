-- Only signed-in users may call the membership helper (RLS policies run it as the querying user).
-- Applied to project ylwmselditykrhzfzrxx on 2026-09-17 via Supabase MCP.
revoke execute on function public.is_household_member(uuid) from anon;
revoke execute on function public.is_household_member(uuid) from public;
