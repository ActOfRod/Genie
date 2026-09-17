-- Optional household nickname for a detected recurring charge.
-- Detection still keys off merchant_key; this is display-only.
alter table public.recurring_overrides add column if not exists nickname text;
