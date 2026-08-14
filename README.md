# MoodBowl

Expo Router app migrating Auth · Diary · Ritual · Community to Supabase.

## Docs

| Doc | Purpose |
|---|---|
| [`SPEC.md`](./SPEC.md) | Supabase migration standard · security · phase gates |
| [`memory/DESIGN_PRINCIPLES.md`](./memory/DESIGN_PRINCIPLES.md) | Product UI / copy principles |
| [`memory/RITUAL_SPEC.md`](./memory/RITUAL_SPEC.md) | Ritual v1 product + data contracts |
| [`memory/RITUAL_PSYCH_THEORY.md`](./memory/RITUAL_PSYCH_THEORY.md) | Regulation theory behind the ritual |
| [`supabase/README.md`](./supabase/README.md) | How to apply schema / Phases 1–2 SQL · verify RLS |
| [`memory/test_credentials.md`](./memory/test_credentials.md) | Demo Auth accounts + role assignment |

## Quick start (database)

1. Apply `supabase/schema.sql` once in the Supabase SQL Editor.
2. Apply Phases 1–2 via `supabase/APPLY_PHASES_1_2.sql` (or ordered files under `supabase/migrations/`).
3. Create demo users per `memory/test_credentials.md`.
