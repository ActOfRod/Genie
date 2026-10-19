-- Optional household nickname for a detected recurring charge.
-- Detection still keys off merchant_key; this is display-only.
alter table public.recurring_overrides add column if not exists nickname text;

-- Make PostgREST pick up the new column immediately (avoids
-- "Could not find the 'nickname' column ... in the schema cache").
notify pgrst, 'reload schema';
