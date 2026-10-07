-- Takely — full database setup (paste once in Supabase › SQL Editor › Run).

-- ===== supabase/migrations/0001_init.sql =====
-- Takely — initial schema. Run in the Supabase SQL editor (or `supabase db push`).

-- ---------- Profiles & credits ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  credits integer not null default 0 check (credits >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.credit_ledger (
  id bigserial primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason text not null,
  ref text unique,                -- idempotency key (stripe session id, generation id…)
  created_at timestamptz not null default now()
);

-- Welcome credits for every new account.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, credits) values (new.id, new.email, 20)
  on conflict (id) do nothing;
  insert into public.credit_ledger (user_id, delta, reason, ref) values (new.id, 20, 'welcome', 'welcome:' || new.id)
  on conflict (ref) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Atomically take credits. Returns false when the balance is too low.
create or replace function public.spend_credits(p_user uuid, p_amount integer, p_reason text, p_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.profiles set credits = credits - p_amount
  where id = p_user and credits >= p_amount
  returning true into ok;
  if ok is null then return false; end if;
  insert into public.credit_ledger (user_id, delta, reason, ref) values (p_user, -p_amount, p_reason, p_ref);
  return true;
end $$;

-- Add credits once per ref (refunds, purchases). Returns false if that ref was already applied.
create or replace function public.add_credits(p_user uuid, p_amount integer, p_reason text, p_ref text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into public.credit_ledger (user_id, delta, reason, ref) values (p_user, p_amount, p_reason, p_ref);
  update public.profiles set credits = credits + p_amount where id = p_user;
  return true;
exception when unique_violation then
  return false;
end $$;

revoke execute on function public.spend_credits(uuid, integer, text, text) from public, anon, authenticated;
revoke execute on function public.add_credits(uuid, integer, text, text) from public, anon, authenticated;

-- ---------- Product ads ----------
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  brief text not null,
  product_image_url text not null,
  language text not null default 'en',
  duration integer not null default 30,
  aspect text not null default '9:16',
  voiceover boolean not null default true,
  title text,
  plan jsonb,
  status text not null default 'planning'
    check (status in ('planning','shooting','assembling','completed','failed')),
  final_url text,
  thumbnail_url text,
  cost integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Generations (every fal.ai job) ----------
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('image','video','audio','compose')),
  model text not null,
  endpoint text not null,
  prompt text,
  input jsonb not null default '{}'::jsonb,
  aspect text,
  status text not null default 'queued' check (status in ('queued','running','completed','failed')),
  fal_request_id text,
  result_url text,
  thumbnail_url text,
  cost integer not null default 0,
  error text,
  ad_id uuid references public.ads (id) on delete cascade,
  role text check (role in ('keyframe','clip','voice','final')),
  shot_index integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists generations_user_idx on public.generations (user_id, created_at desc);
create index if not exists generations_ad_idx on public.generations (ad_id);
create index if not exists ads_user_idx on public.ads (user_id, created_at desc);
-- One keyframe / clip per shot and one voice / final per ad, even if two webhooks race.
create unique index if not exists generations_ad_step_uniq
  on public.generations (ad_id, role, coalesce(shot_index, -1)) where ad_id is not null;

-- ---------- Row level security: users read their own rows; writes go through the server ----------
alter table public.profiles enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.ads enable row level security;
alter table public.generations enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "own ledger" on public.credit_ledger;
create policy "own ledger" on public.credit_ledger for select using (auth.uid() = user_id);
drop policy if exists "own ads" on public.ads;
create policy "own ads" on public.ads for select using (auth.uid() = user_id);
drop policy if exists "own generations" on public.generations;
create policy "own generations" on public.generations for select using (auth.uid() = user_id);

-- ---------- Storage: product photos & start images ----------
insert into storage.buckets (id, name, public) values ('uploads', 'uploads', true)
on conflict (id) do nothing;

drop policy if exists "upload own folder" on storage.objects;
create policy "upload own folder" on storage.objects for insert to authenticated
with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- ===== supabase/migrations/0002_subscriptions.sql =====
-- Takely — monthly subscriptions.
alter table public.profiles add column if not exists stripe_customer_id text unique;
alter table public.profiles add column if not exists plan text;              -- starter | pro | agency | null
alter table public.profiles add column if not exists plan_status text;       -- active | past_due | canceled | …
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists current_period_end timestamptz;

-- ===== supabase/migrations/0003_formats_music.sql =====
-- Takely — multi-format delivery and background music.
alter table public.ads add column if not exists formats jsonb;           -- { "9:16": url, "4:5": url, "1:1": url }
alter table public.ads add column if not exists music boolean not null default true;

-- 'music' is a new pipeline step.
alter table public.generations drop constraint if exists generations_role_check;
alter table public.generations add constraint generations_role_check
  check (role in ('keyframe','clip','voice','music','final'));

-- Finished videos in every format (public so they can be downloaded and shared).
insert into storage.buckets (id, name, public) values ('outputs', 'outputs', true)
on conflict (id) do nothing;

