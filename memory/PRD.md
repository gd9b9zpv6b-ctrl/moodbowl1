# Moodful — Mental Wellness Mobile App

## Problem
A gentle mood-tracking app for people managing depression to identify and articulate their emotions, journal about them, optionally share anonymously with a supportive community, track their emotional journey on a calendar, and set small daily self-care intentions.

## Stack
- Expo React Native (expo-router file-based routing)
- FastAPI + MongoDB backend
- JWT auth (bcrypt password hashing) via `/api/auth/*`
- react-native-calendars for the monthly calendar
- expo-notifications for local daily reminder

## Screens
1. **Welcome / Login / Register** (`/auth/*`) — JWT auth stored securely
2. **Home** (`/(tabs)/index`) — 20-emotion picker with descriptions, journal entry, public/private toggle, list of today's entries
3. **Calendar** (`/(tabs)/calendar`) — monthly grid, days color-coded by emotion, tap day to view entries
4. **Community** (`/(tabs)/community`) — anonymous public feed with heart reactions
5. **Tasks** (`/(tabs)/tasks`) — per-day self-care checklist (add/toggle/delete)
6. **Profile** (`/(tabs)/profile`) — user info, local daily reminder toggle + hour, sign out

## Backend endpoints (all under `/api`)
- `POST /auth/register` `POST /auth/login` `GET /auth/me`
- `POST /entries` `GET /entries` `GET /entries/calendar?month=YYYY-MM` `GET /entries/community` `POST /entries/{id}/react` `DELETE /entries/{id}`
- `POST /tasks` `GET /tasks?task_date=YYYY-MM-DD` `PATCH /tasks/{id}` `DELETE /tasks/{id}`

## Emotions
20 emotions with Feather icons + healing pastel colors (see `/app/frontend/src/constants/emotions.ts`): happy, content, grateful, hopeful, calm, peaceful, loved, proud, sad, lonely, empty, numb, exhausted, restless, anxious, worried, overwhelmed, insecure, frustrated, angry.

## Notifications
Local-only reminder scheduled with `expo-notifications` (no push server). Works on device/dev build; not fully testable in Expo Go on Android.
