@AGENTS.md

# Connecting Quran (noor-quran)

Quran reader: Arabic text (Uthmani or Indo-Pak), Urdu/English translations, several tafseers per ayah, word grammar and
word-by-word meanings, tajweed colours, recitation player, Mushaf pages, search, surah quizzes and video lectures.

Stack: **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, TypeScript. No database and no auth yet
(planned "Phase 2" will add login and move bookmarks to user accounts). Next 16 differs from older versions — check
`node_modules/next/dist/docs/` before using a Next API you are unsure of.

## Commands

```bash
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
npx tsc --noEmit             # type check (there is no lint script)
```

Offline tests (need a build first; the scripts are bash and write logs to /tmp — use Git Bash on Windows):

```bash
npm run build
./tests/start-test-server.sh     # mock API on :4010, app on :3100
node tests/e2e.mjs               # ~60 Playwright feature checks (npm run test:e2e)
node tests/visual.mjs            # screenshots of every screen into /tmp/vis
```

`tests/mock-api.mjs` serves real text only for surahs 1 and 112; other surahs get placeholder words. When you add a
new external call, add a matching mock route there or the e2e run will break.

## Layout

- `app/` — one folder per URL (`/surah/[n]/[[...ayah]]`, `/juz/[j]`, `/mushaf/[[...p]]`, `/tafseer/[s]`, `/videos/[s]`,
  `/search`, `/quiz/[s]`, `/bookmarks`) plus browser-facing API routes in `app/api/` (`editions`, `tafsir/[slug]/[s]/[a]`,
  `word/[s]/[a]`, `search`, `quiz/[s]`) that proxy the external sources through `lib/quran.ts`.
- `components/` — almost all are client components. `AppProvider` owns settings, bookmarks, toasts and the open
  drawers/panels (settings, tafseer, word card); `PlayerProvider` owns the audio player. Both are mounted in `app/layout.tsx`.
  `resume.ts` keeps the last-read ayah so Mushaf and Tafseer can open where the reader left off.
- `lib/` — data and helpers:
  - `config.ts` — external API base URLs (each overridable by env var, see `.env.example`) and `REVALIDATE` (24 h).
  - `quran.ts` — **server only**. Every external fetch goes through `getJSON` here and is cached with `next.revalidate`.
  - `views.ts` — builds the per-page view models (`AyahView` etc.) from the reader's settings.
  - `text.ts` — pure text helpers shared by server and client (Bismillah stripping, Indo-Pak cleanup, tokens for tajweed / word-by-word).
  - `settings.ts` / `server-settings.ts` — the settings type, defaults and cookie handling.
  - `meta.ts` — edition lists, fallbacks, tafseer renames/hides. `client-data.ts`, `tafsir-client.ts` — client-side fetchers.
  - `grammar.ts` (Quranic Arabic Corpus tags → English/Arabic labels), `highlight.ts` (search highlighting with loose
    Arabic/Urdu matching), `quiz.ts` (10-question quiz builder), `step.ts` (prev/next ayah across surahs),
    `tafseer-route.tsx` (shared page logic for the tafseer routes).
  - `ui.ts` — shared Tailwind class strings (`btn`, `btnGhost`, `iconBtn`, …) and `cx()`; reuse them instead of
    re-spelling button/card styles.

## Things to know

- **Settings flow:** stored in `localStorage` (keys prefixed `noor.`) and mirrored to the `noor_settings` cookie so the
  server renders the chosen translations/script/tajweed on first paint. Only `COOKIE_KEYS` go into the cookie.
  `readSettings()` validates every cookie value before it can reach an external URL — keep that validation when adding fields.
- **Indo-Pak text** comes from quran.com's `text_indopak_nastaleeq`, which uses private-use glyphs only its font can
  draw and ends each ayah with a font-specific end token (`IP_END`, `ipBody`). For copying, the `legacy` edition and
  `plainIP` are used. Changes to Arabic text handling need checking by eye in both scripts (and in popovers like the word card).
- **Fonts** are bundled via `@fontsource/*` packages imported in `app/layout.tsx` — don't add Google Fonts requests.
- **Theming:** colour tokens are CSS variables in `app/globals.css` (3 palettes × light/dark, `data-theme` on `<html>`);
  Tailwind colours read those variables. Use the tokens rather than hard-coded colours.
- Old hash links from the single-file site (`#/surah/2/255`) are redirected client-side in `AppProvider` — keep them working.
- Import alias: `@/*` → project root.
- Code style: compact, small helpers, short doc comments that explain *why*; match the surrounding density.
- The user wants ambiguities in requested changes raised **before** implementing.
