# Moodful — 心情陪伴 · Mental Wellness Mobile App

## Problem
A gentle Cantonese Traditional Chinese mood-tracking app for people managing depression to identify and articulate their emotions, journal, optionally share with a supportive community, track their emotional journey on a calendar, build small self-care habits with rewards, discover gentle real-world activities, and access registered professional help when needed.

## Stack
- Expo React Native (expo-router file-based routing)
- FastAPI + MongoDB backend
- JWT auth (bcrypt password hashing)
- react-native-calendars (custom day markers)
- expo-notifications (local daily reminder)
- Gemini Nano Banana image generation (mascot illustrations, one-off script)

## Screens
1. **Welcome / Login / Register** (`/auth/*`) — 廣東話 UI, JWT stored securely
2. **首頁 Home** (`/(tabs)/index`) — greeting + 溫柔提醒 affirmation card + 尋求幫助 / 行出去 CTA + 20-emotion picker (mascot illustrations) + journal (private/public) + today's entries
3. **心情曆 Calendar** (`/(tabs)/calendar`) — monthly grid, days color-coded, tap to view entries
4. **社群 Community** (`/(tabs)/community`) — anonymous feed with 心心 reactions
5. **小習慣 Tasks** (`/(tabs)/tasks`) — credits badge, 習慣庫 (16 preset habits), custom tasks, complete tasks to earn 小心心 credits
6. **我 Profile** (`/(tabs)/profile`) — user info + credits, links to 尋求幫助 / 行出去, daily reminder toggle, sign out
7. **/help** (stack) — HK 24-hour crisis hotlines (tap-to-call) + registered professionals directory
8. **/activities** (stack) — categorised gentle activities (micro / outdoor / sensory / creative / social) + random-picker

## Backend endpoints (all under `/api`)
- `POST /auth/register` `POST /auth/login` `GET /auth/me` — returns `credits`
- Entries: `POST /entries`, `GET /entries`, `GET /entries/calendar?month=YYYY-MM`, `GET /entries/community`, `POST /entries/{id}/react`, `DELETE /entries/{id}`
- Tasks: `POST /tasks`, `GET /tasks?task_date=…`, `PATCH /tasks/{id}` (toggling `completed` adjusts user credits ±1), `DELETE /tasks/{id}`

## Content
- 20 emotion mascot illustrations generated with Gemini Nano Banana → `/app/frontend/assets/emotions/*.png`
- 15 warm 廣東話 affirmations (`src/constants/affirmations.ts`)
- 16 preset healing habits (`src/constants/habits.ts`)
- 20 gentle activities across 5 categories with HK-specific suggestions (`src/constants/activities.ts`)
- Curated HK mental-health hotlines + verified professional directories (`src/constants/providers.ts`)

## Notifications
Local-only daily reminder scheduled with `expo-notifications`. Works on device / dev build; not fully testable in Expo Go on Android.

## 2026-07-03 · Anti-fake-happy features
Concern: students may keep tapping "happy" bowls out of social pressure. Added two features:

### 樹洞 · Secret Hollow (`/hollow`)
- Dark forest-green themed page for absolutely private entries
- Uses existing `is_secret: true` entries flag — filtered client-side
- No emotion picker required (defaults to 'blank'), just free-form text
- Prominent privacy banner: "老師 · 家長 · 輔導 · 冇一個會見到"
- Entry point: dark card on home screen below the garden card
- Users can delete secrets from within the hollow page

### Teacher Dashboard v2 (`/teacher-dashboard`)
- FIXED: `BOWL_POS` undefined crash; `c.positive/neutral/negative` data mismatch
- Replaced 😊😐😔 emojis with rice bowl `EmotionVisual` icons (happy/calm/sad)
- Added 能量分類圖例 section — 高能量 / 能量平穩 / 低能量 with representative bowls & descriptions
- Added 行為異常偵測 (Behavioral Anomaly Detection) box — flags usage-pattern changes (login drop, late-night usage, mood swings) because behavior is harder to fake than self-report
- Progress bars now correctly use `ENERGY_META` colors from `src/constants/energy.ts`

### Pending (backlog for anti-fake-happy)
- Battery/energy slider companion on emotion picker (dual-track validation)
- Peer normalization after emotion pick ("32% of classmates also picked tired")
- Configurable school-level keyword alert (e.g. "想死") — per-school policy toggle
- Backend `is_secret` filter endpoint (currently filtered client-side)

## 2026-07-03 · Post-hollow pivot (v2)
User rejected the standalone /hollow page — argued that regular non-public entries already
achieve "self-only" privacy. Instead, four concrete anti-fake-happy features shipped:

### 1. Removed /hollow page + entry point
- Deleted `/app/frontend/app/hollow.tsx`
- Removed hollow card from home screen
- Deleted hollow styles

### 2. Privacy reassurance banner
- Added inline banner above the composer share/secret toggles:
  「只有你自己睇到 · 老師 · 家長 · 冇任何人可以偷睇你嘅日記」

### 3. Democratized premium features (schools = free access)
- **Backend**: Removed `is_premium` gate on `/premium/set-pin` and `/premium/settings`
- **Backend**: New users default `is_premium=True`
- **Backend**: One-time startup migration promotes existing users to premium
- **Frontend**: Removed premium gate on secret-toggle in home composer
- **Frontend**: Removed 升級會員 nudge in entry-detail-modal
- Now every student has: password lock · font/paper customization · icon packs

### 4. 樹洞 emotion icon (`hollow`)
- New emotion in "unspoken" category — key `hollow` · label 樹洞
- Description: "我唔想 label 今日 · 只想寫俾自己"
- Deep forest color (#2A3E37) + warm gold shield icon (via Feather · no PNG needed)
- Added optional `iconTint?: string` field on `Emotion` type
- **Auto-behavior**: When picked, if user has `has_secret_pin=true`, auto-turns-on the secret/password toggle
- Mapped to `steady` energy level for teacher dashboard aggregation

### 5. 電量 slider (energy dimension)
- New `EnergySlider` component using `@react-native-community/slider@5.0.1`
- Sits between note input and privacy banner in composer
- 0-100% with 5-step ticks · shows emoji + label + color that changes by level (快冇電/有啲攰/一般/有精神/好有energy)
- Backend: added `energy_level: Optional[int]` on EntryIn/EntryUpdate/EntryOut + Mongo doc
- Frontend `Entry` type updated
- Dual-track validation: emotion (what) + energy (how much). Harder to fake both.

### 6. School admin — configurable keyword policy
- New file `/app/frontend/src/lib/school-alert-policy.ts` — AsyncStorage-backed
  (currently mocked; will move to backend per-school schema in production)
- New section in `/school-admin`: 私隱與警示政策
  - Master toggle for keyword monitoring
  - Editable keywords list with add/remove (default: 想死, 自殺, 傷害自己, 唔想再返學, 打我, 救命)
  - Configurable notify roles: 輔導老師 / 班主任 / 校方
  - Toggle: disclose watched words to student (transparency)
- Every school can customize — no forced default · can be fully disabled

### Screenshots verified
- Home composer: hollow icon in 講唔出 category · energy slider working
- School admin: policy section with chips + role selectors rendering correctly

## 2026-07-03 · School-configurable energy mapping + more UX
User request: schools should decide which emotion goes to which energy bucket.

### 1. 🎨 School-configurable emotion→energy mapping (P0)
- **New file** `/app/frontend/src/lib/school-energy-config.ts` — AsyncStorage-backed override
  layer on top of the default `ENERGY_BY_KEY` from `constants/energy.ts`. Setting an emotion
  back to its default removes it from overrides (keeps storage lean).
- **New hook** `/app/frontend/src/hooks/use-school-energy-map.ts` — reactive read of the
  merged (default + overrides) map for dashboards to consume.
- **School Admin UI**: new section 「情緒能量分類」in `/school-admin`
  - 3 buckets displayed as cards with left-border color per level
  - Each emotion shown as chip with `EmotionVisual` mini icon + label
  - Tap a chip → cycles level (高 → 平穩 → 低 → 高) and persists immediately
  - "還原預設分類" button with confirm dialog to reset
- **Teacher Dashboard**: representative bowls in the legend + self-care card + `ClassCard` legend
  now dynamically pick the FIRST emotion (in EMOTIONS order) in each bucket per school config.
  Falls back to happy/calm/sad if a bucket is empty.
- **Parent Home**: same dynamic representative bowls for the weekly view.

### 2. 👥 Peer normalization tips
- Home composer now shows small warm cards below the note input when relevant:
  - Low energy picked → "你唔係一個人 · 今日全校差唔多 35% 同學仔都揀咗低能量情緒。"
  - High-intensity emotion picked (angry/furious/anxious/irritable/scared) → 
    "好激動嘅感覺都好正常 · 唔洗擔心 · 慢慢寫低發生咗咩事。"
- Reduces shame of admitting negative feelings.

### 3. 📊 Emotion vs Energy dissonance flag (teacher dashboard)
- Added 4th behavior flag: "4 位同學仔今日揀咗高能量情緒 · 但電量只有 20% 以下"
- Uses the new `energy_level` field alongside self-reported emotion to detect fakes.
- Currently mocked; real detection = future backend work.

### Files touched
- Backend: none
- Frontend:
  - `src/lib/school-energy-config.ts` (new)
  - `src/hooks/use-school-energy-map.ts` (new)
  - `app/school-admin.tsx` (energy config UI section)
  - `app/teacher-dashboard.tsx` (consume hook + dissonance flag)
  - `app/parent-home.tsx` (consume hook)
  - `app/(tabs)/index.tsx` (peer normalization tips)

### Notes for future
- Storage still AsyncStorage — needs to move to backend per-school schema
- No screenshots taken this session (user request to save credits)

## 2026-07-03 · Self-care CTA on all role dashboards
User feedback: every role portal (not just teacher) should encourage the adult user
to also check in with themselves.

### RoleSelfCareCard component (new)
- `/app/frontend/src/components/role-selfcare-card.tsx`
- Reusable card: bowl icon + title + subtitle + chevron
- Tapping switches RoleStorage to 'student' and navigates to '/'
- Props: `bg`, `border`, `bowlBg`, `title`, `subtitle`, `bowlKey`, `testID`

### Applied to all 4 role portals with themed palettes
- `teacher-dashboard.tsx` — beige/gold theme, 開心 bowl. 「老師都可以用呢個 App」
- `counsellor-panel.tsx` — blue theme, 平靜 bowl. 「幫人之前 · 記得幫自己」
- `parent-home.tsx` — pink theme, 被愛 bowl. 「家長都要照顧自己」
- `school-admin.tsx` — purple theme, 安寧 bowl. 「校長 · 主任都用得到」

### Cleanup
- Removed teacher-dashboard's local `selfCard/selfBowlWrap/selfTitle/selfSub` styles (now in shared component)
- Removed unused `RoleStorage`/`useRouter` imports in teacher-dashboard
