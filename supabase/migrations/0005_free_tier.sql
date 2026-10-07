-- Takely — free tier: 60 one-time credits for every new account.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, credits) values (new.id, new.email, 60)
  on conflict (id) do nothing;
  insert into public.credit_ledger (user_id, delta, reason, ref) values (new.id, 60, 'welcome', 'welcome:' || new.id)
  on conflict (ref) do nothing;
  return new;
end $$;
