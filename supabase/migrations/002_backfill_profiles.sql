-- Backfill profiles for any auth users created before the trigger existed.
insert into public.profiles (id, display_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(u.email, '@', 1)),
  'student'
from auth.users u
on conflict (id) do nothing;
