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
