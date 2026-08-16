# Supabase · MoodBowl

Apply database changes for Phases 1–2 (auth hardening, diary legacy fields, community reactions, crisis alerts, tenancy scaffolding, ritual RPC).

## Prerequisites

1. Create a Supabase project.
2. Run the base schema once: paste `schema.sql` into **SQL Editor → New query → Run**.
3. Confirm Auth is enabled (email/password).

## Apply Phases 1–2

### Option A · One paste (recommended)

1. Open **SQL Editor**.
2. Paste the full contents of `APPLY_PHASES_1_2.sql`.
3. Run. The script is idempotent (safe to re-run).

### Option B · Ordered migrations

Run in this order (psql `\i` equivalent):

1. `migrations/001_auth_profile_hardening.sql`
2. `migrations/002_backfill_profiles.sql`
3. `migrations/003_diary_legacy_fields.sql`
4. `migrations/004_phase2_community_crisis.sql`

## Verify columns

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'diaries'
  and column_name in (
    'entry_date', 'emotions', 'energy_level', 'is_secret', 'hearts'
  )
order by column_name;
```

Expect:

| column | notes |
|---|---|
| `entry_date` | `date` · default UTC date |
| `emotions` | `ARRAY` · default `'{}'` |
| `energy_level` | `integer` |
| `is_secret` | `boolean` · default `false` |
| `hearts` | `integer` · default `0` |

Also confirm new tables exist:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'diary_reactions', 'alerts',
    'schools', 'school_memberships', 'classes', 'class_memberships'
  )
order by table_name;
```

## Verify RLS

```sql
-- Public diary policy must require same-school (not global authenticated).
select polname, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy
where polrelid = 'public.diaries'::regclass
  and polname = 'diaries_select_public';

-- Alerts: select for staff only · no insert policy for clients.
select polname, polcmd
from pg_policy
where polrelid = 'public.alerts'::regclass;

-- Students must not see alerts (run while signed in as a student JWT / Table Editor as that user).
-- Staff in the same school may select via alerts_select_staff_same_school.
```

Quick functional checks:

1. Insert a diary with `diary_text` containing `自殺` → a row appears in `alerts`.
2. Insert with `check_in_type = 'hug_only'` or empty `diary_text` → no alert.
3. As a student JWT, `select * from alerts` returns no rows.
4. As counsellor/teacher/school_admin in the same school membership, alerts for that school’s students are visible.
5. `select public.save_ritual_entry(p_diary_text := 'hello', p_regulation_keys := array['breath_4_7_8']);` returns the diary JSON and creates a `relax_games_history` row.

## Multi-school prep (010)

After Phase 2 migrations (and 006–009 if using those branches), run:

5. `migrations/005_tasks.sql` … through `009_notify_teacher.sql` (when present)
6. `migrations/010_multi_school_prep.sql`

This stamps `diaries.school_id`, enforces one primary membership per user, syncs `profiles.school_id`, and adds stub tables `school_policies` / `family_links` / `invite_codes`.

Optional isolation smoke: create two Auth users then run `seed_two_schools_isolation.sql`.  
Product notes: `memory/MULTI_SCHOOL_TENANCY.md`.

## Demo accounts

See `memory/test_credentials.md` for creating Auth users and assigning roles via SQL (never from the client).

## Related docs

- Root `SPEC.md` — migration standard and phase gates
- `memory/MULTI_SCHOOL_TENANCY.md` — multi-school isolation roadmap
- `memory/DESIGN_PRINCIPLES.md`
- `memory/RITUAL_SPEC.md`
- `memory/RITUAL_PSYCH_THEORY.md`
