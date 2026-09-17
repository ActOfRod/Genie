import { createClient } from "@supabase/supabase-js";

// The publishable key is safe to ship in a public repo/static site: all data
// access is enforced by Postgres row-level security, not by this key.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ylwmselditykrhzfzrxx.supabase.co";
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_IfZGhvRnPOvnZoE45qprKA_XQJhMO6j";

export const supabase = createClient(url, publishableKey);

// Household members shown on the login screen. Passwords live only in Supabase Auth.
export const HOUSEHOLD_USERS = [
  { name: "Nathan", email: "nathan@geniespend.app" },
  { name: "Nina", email: "nina@geniespend.app" },
] as const;