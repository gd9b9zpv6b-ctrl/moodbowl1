-- Phase 2 · extend diaries for current quick-diary / calendar fields.
-- Safe to re-run. After applying, frontend may switch from the temporary
-- body_chips / bowl_steam / time_spent_sec bridge onto these columns.

alter table public.diaries
  add column if not exists entry_date date;

alter table public.diaries
  add column if not exists emotions text[] not null default '{}';

alter table public.diaries
  add column if not exists energy_level integer;

alter table public.diaries
  add column if not exists is_secret boolean not null default false;

alter table public.diaries
  add column if not exists hearts integer not null default 0;

-- Backfill entry_date from created_at (UTC date · good enough for migration).
update public.diaries
set entry_date = (created_at at time zone 'utc')::date
where entry_date is null;

-- Prefer keeping entry_date populated for new rows.
alter table public.diaries
  alter column entry_date set default ((now() at time zone 'utc')::date);

create index if not exists idx_diaries_user_entry_date
  on public.diaries (user_id, entry_date desc);
