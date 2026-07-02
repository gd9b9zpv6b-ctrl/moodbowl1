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
