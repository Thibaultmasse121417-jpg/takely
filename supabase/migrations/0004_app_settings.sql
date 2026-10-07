-- Takely — private key/value settings written by the server (e.g. the Stripe webhook
-- signing secret created automatically). RLS on with no policy: only the service role reads it.
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
