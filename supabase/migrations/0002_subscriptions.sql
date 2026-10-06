-- Takely — monthly subscriptions.
alter table public.profiles add column if not exists stripe_customer_id text unique;
alter table public.profiles add column if not exists plan text;              -- starter | pro | agency | null
alter table public.profiles add column if not exists plan_status text;       -- active | past_due | canceled | …
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists current_period_end timestamptz;
