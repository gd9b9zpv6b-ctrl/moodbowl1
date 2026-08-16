# MoodBowl · Agent Principles

Rules for coding / cloud agents working on this repo.

## Preview

1. **Never take screenshots** (headless Chrome, Playwright, computer-use, RecordScreen, or similar).
2. **Never** ship fake static HTML mockups as the product preview unless the user explicitly asks for a static mock.
3. **Always preview with Expo** (`expo start`, prefer `--tunnel` for Expo Go on phone).
4. When sharing a preview, give the **Expo / tunnel URL** (and QR page link if useful) — do not screenshot the QR either.
5. Point to the real route for the change (e.g. `/ritual/release`, `/teacher-dashboard`).

## Why

Screenshots go stale and are not the real app. Expo Go is the source of truth for layout and interaction.

## Related

- Visual / UX system: `memory/DESIGN_PRINCIPLES.md` §18
- Demo accounts: `memory/test_credentials.md`
