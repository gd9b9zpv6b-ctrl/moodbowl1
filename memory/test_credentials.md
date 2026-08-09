# Demo credentials · Supabase Auth

Use these accounts for local / staging demos. They match the login screen quick-login chips (`frontend/app/auth/login.tsx`).

## Accounts to create

Create each user in **Supabase Dashboard → Authentication → Users → Add user** (email confirm as needed).

| Email | Role (`profiles.role`) | Display hint |
|---|---|---|
| `student@demo.moodful.app` | `student` | 陳小明 (學生 A) |
| `student2@demo.moodful.app` | `student` | 學生 B |
| `teacher@demo.moodful.app` | `teacher` | 陳老師 (班主任) |
| `counsellor@demo.moodful.app` | `counsellor` | 李輔導 (輔導老師) |
| `parent@demo.moodful.app` | `parent` | 王太 (家長) |
| `school@demo.moodful.app` | `school_admin` | 校長 (校方管理) |

Shared demo password (dev only): `demo1234`

> New signups always get `role = 'student'` from `handle_new_user()`. Staff roles must be set in SQL after Auth user creation.

## Assign roles (SQL Editor)

`profiles` has no email column — join `auth.users`:

```sql
update public.profiles p
set role = v.role
from auth.users u
join (
  values
    ('student@demo.moodful.app',    'student'),
    ('student2@demo.moodful.app',   'student'),
    ('teacher@demo.moodful.app',    'teacher'),
    ('counsellor@demo.moodful.app', 'counsellor'),
    ('parent@demo.moodful.app',     'parent'),
    ('school@demo.moodful.app',     'school_admin')
) as v(email, role) on lower(u.email) = v.email
where p.id = u.id;
```

Verify:

```sql
select u.email, p.role, p.display_name
from public.profiles p
join auth.users u on u.id = p.id
where u.email like '%@demo.moodful.app'
order by u.email;
```

## Optional · same-school tenancy for community / alerts

After Phase 2 migration (`004`), seed a demo school and memberships so `same_school()` and staff alert reads work:

```sql
insert into public.schools (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Demo School')
on conflict (id) do nothing;

insert into public.school_memberships (school_id, user_id, role)
select
  '00000000-0000-4000-8000-000000000001',
  u.id,
  p.role
from auth.users u
join public.profiles p on p.id = u.id
where u.email like '%@demo.moodful.app'
on conflict (school_id, user_id) do update
set role = excluded.role;
```

## Security warning

**Never assign or change `profiles.role` (or school / class membership) from the Expo client.**

- Clients may update only safe fields (`display_name`, `avatar_url`).
- Role is authorization data · set it with the SQL Editor, service role, or a trusted Edge Function / `security definer` RPC that checks the caller.
- Do not trust `user_metadata.role` from sign-up — the trigger always forces `'student'`.
