# MoodBowl · Supabase Migration Implementation Standard

> **Status** · Approved migration baseline · 2026-08-06  
> **Scope** · Expo Router app migration from FastAPI／MongoDB／custom JWT to Supabase  
> **Source documents** · `memory/DESIGN_PRINCIPLES.md` · `memory/RITUAL_PSYCH_THEORY.md` · `memory/RITUAL_SPEC.md`

---

## 1 · Non-negotiable principles

- Preserve Auth · Diary · Calendar · Community · Tasks · Memories · Premium · Admin／Teacher／Counsellor／Parent dashboards throughout the migration.
- Client code uses only the Supabase anon key · the service-role key and Resend key must never ship in Expo.
- Every table exposed through the Data API has RLS enabled · access is denied unless an explicit policy allows it.
- Sharing is opt-in · `is_public`、`shared_with_class`、`shared_with_family` default to `false`.
- School and class data is tenant-scoped · no cross-school read is permitted.
- Role and school membership are authorization data · users cannot assign or modify these fields themselves.
- Crisis detection is server-side and cannot be bypassed by a modified client.
- Ritual state detection routes supportive content only · it is not a diagnosis.
- UI and copy follow `memory/DESIGN_PRINCIPLES.md` · Traditional Chinese／Cantonese · middle dot `·` · gentle wording.
- Old rows and old app flows remain readable during migration.

## 2 · Target architecture

```text
Expo Router app
  ├─ Supabase Auth · session and identity
  ├─ PostgREST queries · ordinary user-scoped CRUD
  ├─ Realtime · community and dashboard refresh where useful
  ├─ Storage · bowl PNG and avatars
  └─ Edge Functions／RPC
       ├─ privileged school administration
       ├─ bulk invitations and user creation
       ├─ crisis alert processing
       ├─ Resend email
       ├─ push dispatch
       └─ account export／deletion orchestration

Supabase
  ├─ auth.users
  ├─ public application tables with RLS
  ├─ private schema for secrets／internal rules where required
  └─ audit log written only by trusted database or Edge Function code
```

FastAPI remains a temporary compatibility layer while a feature has not yet moved. It must accept and verify Supabase JWTs during that period. Delete `backend/` only after the Phase 5 regression gate passes.

## 3 · Security corrections required before production use

### 3.1 · Role escalation

The initial schema is unsafe because `profiles_update_own` permits updates to the whole row and `handle_new_user()` trusts `raw_user_meta_data.role`.

Required correction:

- New profiles always receive `role = 'student'` in SQL · ignore client-supplied role and school metadata.
- A user may update only safe profile fields through a restricted RPC such as `update_my_profile(display_name, avatar_url)`.
- Remove direct client `UPDATE` grants on protected authorization columns.
- Role、school、class and family assignment changes run through a `security definer` RPC or Edge Function that checks the caller’s trusted membership.
- Never authorize from `user_metadata` · use database memberships or server-managed `app_metadata`.

### 3.2 · Tenant boundaries

`diaries_select_public` must not expose public diaries to every authenticated account.

Required correction:

- Introduce `schools`、`school_memberships`、`classes` and `class_memberships`.
- Community reads require an active membership in the same school · class sharing additionally requires a shared class.
- Teacher reads require an explicit teacher-to-class relationship.
- Parent reads require an active `family_links` row.
- Counsellor and school-admin access is limited to their own school and is written to `audit_logs`.
- Anonymous users cannot read profiles or diaries.

### 3.3 · Privileged operations

The following never run as unrestricted direct client writes:

- Create or invite teacher、counsellor、parent、school-admin accounts
- Change role／school／class membership
- CSV bulk user creation
- Reveal sensitive alert details
- Moderate another user’s diary
- Send email or push
- Export or delete another person’s data

These operations use verified Edge Functions or narrowly scoped RPCs.

### 3.4 · Crisis and privacy safeguards

- Diary insert／update triggers an asynchronous trusted scan when `diary_text` is non-empty.
- `hug_only` contains no text and therefore creates no scan payload.
- Alert rows are not readable by students or unrelated staff.
- Grounding and sensory exercise free text stays in memory on the device and is never persisted.
- Audit logs must not store full diary text · store actor、action、target id、reason and timestamp.

## 4 · Expo and Supabase client standard

### 4.1 · Environment variables

Use Expo public variables:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Rules:

- Do not use `NEXT_PUBLIC_*` in this Expo app.
- Validate both variables when constructing the client.
- `.env.example` contains placeholders only.
- Edge Function secrets are configured in Supabase · never prefixed with `EXPO_PUBLIC_`.

### 4.2 · Client location and configuration

Canonical file · `frontend/src/lib/supabase-client.ts`

- One shared `createClient()` instance.
- Native session persistence uses AsyncStorage.
- `persistSession: true` · `autoRefreshToken: true` · `flowType: 'pkce'`.
- Native does not rely on browser URL auto-detection.
- Web may detect callback URLs.
- Deep links exchange the PKCE code through `exchangeCodeForSession()`.
- Start and stop token auto-refresh in response to React Native `AppState`.

### 4.3 · Auth API mapping

| Existing action | Supabase action |
|---|---|
| Register | `supabase.auth.signUp()` |
| Login | `supabase.auth.signInWithPassword()` |
| Restore session | `supabase.auth.getSession()` |
| Observe refresh／logout | `supabase.auth.onAuthStateChange()` |
| Current identity | Auth user + own `profiles` row |
| Logout | `supabase.auth.signOut()` |
| Forgot password email | `supabase.auth.resetPasswordForEmail()` |
| OTP verification | `supabase.auth.verifyOtp({ type: 'recovery' })` |
| Set recovered password | `supabase.auth.updateUser()` |

Return generic forgot-password copy regardless of whether an account exists.

## 5 · Data model target

The initial three tables remain the Ritual core but do not represent all current features. Add migrations rather than editing production state manually.

### Core identity and tenancy

- `profiles`
- `schools`
- `school_memberships`
- `classes`
- `class_memberships`
- `family_links`
- `school_policies`

### Diary and community

- `diaries`
- `diary_reactions` · unique `(diary_id, user_id)`
- `alerts`
- optional `alert_access_log` or shared `audit_logs`

`diaries` must preserve legacy-compatible fields including `energy_level`、`entry_date`、secret state and a stable bowl emotion key. Frontend adapters may expose old `note`／`emotions[]` shapes until all screens use the new shape.

### Existing features

- `tasks`
- `memories`
- `push_devices`
- `invite_codes`
- `audit_logs`
- profile settings for diary style、icon pack、PIN state and featured entries

PIN material must be salted and hashed server-side · never stored as plaintext.

### Ritual

- `diaries` stores soup、body chips、customization、check-in type、duration and smile state.
- `relax_games_history` stores one activity row per attempt／completion.
- An RPC creates the final diary and activity rows atomically.

## 6 · Query conventions

All normal writes derive `user_id` from the current authenticated session and remain protected by RLS.

```ts
const { data, error } = await supabase
  .from('diaries')
  .insert({ user_id: session.user.id, diary_text, is_public: false })
  .select()
  .single();
```

```ts
const { data, error } = await supabase
  .from('diaries')
  .select('*')
  .gte('entry_date', monthStart)
  .lt('entry_date', nextMonthStart)
  .order('created_at', { ascending: false });
```

RLS is the security boundary · client filters are presentation helpers only. Every query checks and translates Supabase errors into gentle user-facing copy without exposing database details.

## 7 · Phase plan and acceptance gates

### Phase 1 · Supabase Auth

Deliverables:

- Harden profile creation and update authorization.
- Add Expo-compatible Supabase client and environment template.
- Replace custom JWT session handling in `AuthProvider`.
- Migrate login、register、logout、session restore and forgot／reset password.
- Sync roles from protected profile data into existing role routing.
- Keep 10-minute inactivity logout.
- Keep unmigrated API calls operating through the temporary compatibility strategy.
- Document demo-account provisioning in Supabase · no client-side role assignment.

Acceptance:

- Session survives a normal app restart.
- Expired and revoked sessions return to welcome safely.
- A student cannot make themselves staff by editing metadata or profile rows.
- A user cannot read another profile.
- Login／register／recovery errors use gentle copy.
- Existing role routes still resolve correctly.

### Phase 2 · Diary CRUD

Deliverables:

- Extend diary schema for current fields and backward compatibility.
- Migrate create、list、calendar、edit and delete to direct Supabase queries.
- Add reaction table and community-safe query.
- Add server-side crisis scan and alert creation before removing old entry endpoints.
- Migrate data from MongoDB with id mapping and validation counts.

Acceptance:

- Users can CRUD only their own entries.
- Community data respects same-school／class policy.
- All sharing defaults remain off.
- Calendar renders old and new rows.
- Crisis test fixtures create the expected restricted alert.

### Phase 3 · Ritual v1

Deliverables follow `memory/RITUAL_SPEC.md`:

- Zustand ritual store · soup and body-chip constants.
- Pure bowl scorer、state detector、age wording and praise pool with unit tests.
- Eight ritual screens and preserved quick-diary／full-grid escape paths.
- Bowl customization、five minimum regulation activities and optional bridge.
- Atomic diary／activity save.
- Calendar Album mode.

Acceptance:

- Scorer always returns six defaults including `hollow` and up to twelve expanded results.
- All share controls start off.
- Private activity input is not persisted.
- Old diary flow and old entries still work.
- Required accessibility labels and `testID`s are present.

### Phase 4 · Admin／Teacher dashboards

Deliverables:

- Migrate tenancy、class、family、policy、alerts、invites、audit、Tasks、Memories and profile settings.
- Implement role-scoped dashboard queries and Realtime subscriptions where needed.
- Move bulk CSV、membership changes and moderation to Edge Functions／RPC.
- Record sensitive staff reads and writes in audit logs.

Acceptance:

- Automated RLS matrix covers student、teacher、counsellor、parent、school-admin and cross-school denial.
- Teacher sees assigned classes only.
- Parent sees linked children only.
- No staff workflow requires a service-role key in the client.
- Existing dashboards pass regression checks.

### Phase 5 · Email／Push

Deliverables:

- Resend Edge Function for invites and operational email.
- Push-device registration table and trusted push dispatcher.
- Rate limits、idempotency keys、retry policy and audit records.
- Account export and deletion orchestration.
- Remove FastAPI only after all consumers and jobs are migrated.

Acceptance:

- No Resend／service-role secret appears in bundle or repository.
- Email does not disclose whether an arbitrary account exists.
- A user manages only their own push devices.
- Duplicate function invocation does not send duplicate notifications.
- Full regression suite passes without FastAPI.

## 8 · RLS verification matrix

For each table · test `SELECT`、`INSERT`、`UPDATE` and `DELETE` as applicable:

- owner in same school
- different student in same class
- student in different class
- student in different school
- assigned teacher
- unassigned teacher
- assigned counsellor
- linked parent
- unlinked parent
- school admin in same school
- school admin in different school
- anonymous user

Tests must verify both allowed rows and denied columns／mutations. A successful UI test alone does not prove RLS.

## 9 · Migration workflow

1. Add numbered SQL migrations and test them in a non-production Supabase project.
2. Seed dedicated accounts for every role and two separate schools.
3. Run RLS tests before connecting production data.
4. Deploy frontend behind a per-phase feature flag where rollback is useful.
5. Export MongoDB · transform · import · compare counts and sampled records.
6. Keep old backend read-only during a verification window.
7. Remove compatibility code only when the phase acceptance gate passes.

## 10 · Definition of complete migration

- Supabase Auth is the only identity provider.
- No custom JWT or bcrypt password flow remains.
- Client has no privileged secret.
- Every user-data table has reviewed RLS and automated tenant-isolation tests.
- All existing features and Ritual v1 pass regression tests.
- Email、push、alerts and admin operations run through trusted server code.
- Data export and deletion are operational.
- `backend/` has no runtime consumers and can be removed in a final dedicated change.

