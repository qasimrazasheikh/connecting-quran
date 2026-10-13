@AGENTS.md

# Connecting Quran (noor-quran)

Quran reader: Arabic text (Uthmani or Indo-Pak), Urdu/English translations, several tafseers per ayah, word grammar and
word-by-word meanings, tajweed colours, recitation player, Mushaf pages, search, surah quizzes and video lectures.

Stack: **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, TypeScript, **Drizzle ORM** on
**Neon Postgres** for the curated catalogue, with a single-password curator login at `/admin` (no public accounts yet;
bookmarks still live in the browser). Next 16 differs from older versions — check
`node_modules/next/dist/docs/` before using a Next API you are unsure of.

## Commands

```bash
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
npx tsc --noEmit             # type check (there is no lint script)
npm run db:generate          # after editing lib/db/schema.ts: write a migration into drizzle/
npm run db:migrate           # apply migrations to DATABASE_URL
npm run db:seed              # fill the catalogue from the current sources (re-runnable; never overwrites curator edits)
npm run db:import-related    # (re)load related ayahs from QUL's matching-ayah JSON in data/qul/ (download needs a QUL login; not committed)
```

Env (`.env.local`, and Vercel project settings): `DATABASE_URL` (Neon), `ADMIN_PASSWORD` (8+ chars), `ADMIN_SECRET`
(32+ random chars, signs the login cookie), `CLIENT_ID` / `CLIENT_SECRET` (Quran Foundation API, production client).
Without `DATABASE_URL` the site runs on the built-in lists.

Offline tests (need a build first; the scripts are bash and write logs to /tmp — use Git Bash on Windows):

```bash
npm run build
./tests/start-test-server.sh     # mock API on :4010, app on :3100
node tests/e2e.mjs               # ~60 Playwright feature checks (npm run test:e2e)
node tests/visual.mjs            # screenshots of every screen into /tmp/vis
```

The test server runs with `DATABASE_URL` empty (built-in lists). Without Playwright's own browser download, add
`PW_CHANNEL=msedge` (or `chrome`) to use an installed browser.

`tests/mock-api.mjs` serves real text only for surahs 1 and 112; other surahs get placeholder words. When you add a
new external call, add a matching mock route there or the e2e run will break.

## Layout

- `app/` — one folder per URL (`/surah/[n]/[[...ayah]]`, `/juz/[j]`, `/mushaf/[[...p]]`, `/tafseer/[s]`, `/videos/[s]`,
  `/search`, `/quiz/[s]`, `/bookmarks`) plus browser-facing API routes in `app/api/` (`editions`, `tafsir/[slug]/[s]/[a]`,
  `word/[s]/[a]`, `search`, `quiz/[s]`, `study/[s]/[a]` = links + videos + related count for the Study panel, `related/[s]/[a]` = related ayahs with shared words marked) that proxy the external sources through `lib/quran.ts`.
- `components/` — almost all are client components. `AppProvider` owns settings, bookmarks, toasts and the open
  drawers/panels (settings, tafseer, word card); `PlayerProvider` owns the audio player. Both are mounted in `app/layout.tsx`.
  `resume.ts` keeps the last-read ayah so Mushaf and Tafseer can open where the reader left off.
- `app/admin/` — the curator area: `login/`, and `(panel)/` (overview + pending queue, sources, entries by ayah).
  `actions.ts` holds the server actions; each calls `assertAdmin()` itself.
- `lib/` — data and helpers:
  - `db/` — Drizzle schema (`sources` = works/series, `entries` = resources tied to an ayah range), client, allowed
    values (`enums.ts`, safe to import in client code).
  - `catalog.ts` — **server only**. Reads approved catalogue rows (60 s in-memory cache, cleared by admin actions);
    returns null without a database so callers fall back to the built-in lists in `meta.ts`.
  - `step.ts` also defines the Study panel tabs (`StudyTab`, `studyHref`): text, more and related live on `/tafseer/s/a[?tab=…]`, videos on `/videos/s/a`.
  - `admin-auth.ts` — curator session (signed httpOnly cookie on `/admin`, signature includes the password).
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

- **Curation policy (user's rule):** only sources from the Deobandi, Barelvi, Ahl-e-Hadith and Salafi schools, plus
  classical Sunni works; never Shia or Ahmadi sources. The `school` field records this privately — it is **never shown
  on the site**. New imports that need judgement go in as `pending`; only `approved` rows are public.

- **Settings flow:** stored in `localStorage` (keys prefixed `noor.`) and mirrored to the `noor_settings` cookie so the
  server renders the chosen translations/script/tajweed on first paint. Only `COOKIE_KEYS` go into the cookie.
  `readSettings()` validates every cookie value before it can reach an external URL — keep that validation when adding fields.
- **Indo-Pak text** comes from quran.com's `text_indopak_nastaleeq`, which uses private-use glyphs only its font can
  draw and ends each ayah with a font-specific end token (`IP_END`, `ipBody`). For copying, the `legacy` edition and
  `plainIP` are used. Changes to Arabic text handling need checking by eye in both scripts (and in popovers like the word card).
- **Fonts** are bundled via `@fontsource/*` packages imported in `app/layout.tsx` — don't add Google Fonts requests.
  The Quran fonts (KFGQPC Uthmanic Hafs, Indo-Pak Nastaleeq, surah names) are files in `public/fonts`, declared in
  `globals.css`. Uthmani text is quran.com's QPC Hafs text (`getUthmani`), drawn with `--font-q`; the font turns a bare
  Arabic-Indic number into the ayah-end sign (`.endmark`).
- **Quran Foundation API:** every `API.quranCom` call is signed with an OAuth token (`qfHeaders` in `quran.ts`) and cached
  by URL with `unstable_cache` (fetch's own cache would key on the hourly token).
- **Theming:** colour tokens are CSS variables in `app/globals.css` (3 palettes × light/dark, `data-theme` on `<html>`);
  Tailwind colours read those variables. Use the tokens rather than hard-coded colours.
- Old hash links from the single-file site (`#/surah/2/255`) are redirected client-side in `AppProvider` — keep them working.
- Import alias: `@/*` → project root.
- Code style: compact, small helpers, short doc comments that explain *why*; match the surrounding density.
- The user wants ambiguities in requested changes raised **before** implementing.
