# Connecting Quran — mobile app plan (Android + iOS)

Draft for review, 2026-11-08. Nothing is built yet. Section 1 lists the decisions to make before work starts.

---

## 1. Decisions to make first

| # | Question | My recommendation |
|---|----------|-------------------|
| 1 | **How to build it:** a real native app, or the website wrapped in an app shell? | **Native app with Expo (React Native)** (see section 2) |
| 2 | **Domain:** you wrote `connectingquran.cm`. Is it `connectingquran.com`? | Use `www.connectingquran.com` (the `SITE` value in `lib/seo.ts`) |
| 3 | **What goes into version 1** | The reader, audio, tafseer, search, bookmarks. Mushaf, quiz, videos and offline downloads come in 1.1 (section 5) |
| 4 | **Store accounts:** personal or organisation? | An organisation account shows the organisation's name in the stores, but Apple asks for a D-U-N-S number (free, takes 1–2 weeks). A personal account shows your own name. |
| 5 | **Test phones:** do you have an Android phone and an iPhone? | We need at least one of each. iOS builds run in the cloud (EAS Build), so a Mac is **not** needed. |
| 6 | **App interface language:** English only, or also Urdu (right-to-left)? | English for v1, with the strings kept in one file so Urdu can be added later |
| 7 | **Offline use:** none, cache what was read, or full downloads? | v1 keeps what you have read for offline use. v1.1 adds "download surah / whole Quran" for text and for each reciter's audio |
| 8 | **Accounts and sync:** bookmarks synced across devices? | Not in v1. Bookmarks and last-read stay on the phone, as they do on the site today |
| 9 | **Money:** free, no ads? Donations? | Free and no ads. Note that a Donate button inside the iOS app is only allowed for registered charities, so link to the website instead |
| 10 | **Where the code lives** | A `mobile/` folder in this repository, so it can use the same `lib/` code |

### Decided

- **Domain: connectingquran.com** (confirmed 2026-11-24). App links, the privacy page and the API all use `www.connectingquran.com`.
- **Version 1 scope (confirmed 2026-11-24):** section 4 is the agreed list.
  - The Mushaf moves into v1, because it is already built.
  - Tajweed colours and tafseer compare move to 1.1.
  - The daily ayah reminder moves into v1.
  - Full surah download moves into v1 (2026-11-24).
- **Other section 1 decisions (confirmed 2026-11-24, all as recommended):**
  - **Store accounts:** personal for now, which means Google Play's closed test of 12 testers for 14 days applies. The app can move to an organisation account later.
  - **iPhone:** arrange access to one for the TestFlight beta.
  - **Interface language:** English for v1, with all strings kept in one place so Urdu can follow.
  - **Offline:** what you read stays available, and full surah download is in v1.
  - **Accounts and sync:** none in v1; everything stays on the phone.
  - **Money:** free, no ads. Any "Support us" link opens the website.
- **Testing without Expo Go:** before going public, the user tests an installable Android build (APK) that runs anywhere, without the PC.

- **Design: Option A, Midnight (chosen 2026-11-08).** The app looks like the website:
  - Indigo and gold by default, with the Classic and Ocean palettes, each in light and dark.
  - Inter for the interface; Indo-Pak by default and Uthmani as an option.
  - Each ayah sits in its own card.
  - Bottom tabs: Quran · Mushaf · Tafseer · Search · Saved.
- The mockups (foundations and 7 screens) are on the design canvas: https://claude.ai/artifact/YNhSwFmuYyAdPdBwuHaqzx. The rejected options B (Mushaf Paper) and C (Clean Minimal) are kept there for reference.

---

## 2. How to build it: the options

**A. Expo / React Native app (recommended).**
- Real native screens, smooth scrolling, and audio that keeps playing in the background with lock-screen controls.
- Offline storage, notifications and deep links all work.
- Written in TypeScript and React like the site, so the pure helpers in `lib/` (`text.ts`, `grammar.ts`, `quiz.ts`, `step.ts`, `surahs.ts`, `highlight.ts`, the `settings.ts` types) can be reused unchanged.
- EAS Build makes the iOS builds on Expo's servers, which matters on Windows. EAS Update can push JS fixes without waiting for store review.
- Cost: the screens have to be written again with React Native components, because the site's Tailwind DOM components don't run in React Native.

**B. Capacitor or WebView wrapper around the site.**
- Fastest: about 1–2 weeks.
- Apple often rejects apps that are "just the website" (guideline 4.2, minimum functionality).
- Background audio, lock-screen controls and offline use are weak.
- Scrolling feels like a web page.

**C. PWA, plus a Trusted Web Activity for Play.**
- Almost no work for Android.
- iOS has no store listing, and audio stops when the screen locks.

Option A is the only one that gives a good reciter experience and a reliable path through App Store review. Option B could be a stopgap, but its work would be thrown away later.

---

## 3. Architecture

```
 ┌────────────── Mobile app (Expo) ──────────────┐
 │ Expo Router screens · TanStack Query cache    │
 │ MMKV (settings, bookmarks, last read)         │
 │ SQLite / files (offline text + audio)         │
 │ shared code: lib/text, grammar, quiz, step …  │
 └──────────────────────┬────────────────────────┘
                        │ HTTPS JSON  (/api/v1/…)
 ┌──────────────────────▼────────────────────────┐
 │ Next.js site on Vercel (this repo)            │
 │ lib/views.ts builds AyahView etc. — same data │
 │ the web pages render; QF OAuth stays here     │
 └──────┬──────────────┬──────────────┬──────────┘
   Quran Foundation  AlQuran Cloud   Neon catalogue
```

The phone never calls Quran Foundation directly. `CLIENT_SECRET` must not ship inside an app, because anyone can unpack the app and read it. All content goes through our own API. That API reuses `lib/quran.ts`, with its caching and its fallbacks between sources.

### 3.1 New backend work in this repo: `/api/v1`

The site's pages are server components that build their view models in `lib/views.ts`. For the app we expose the same view models as JSON, versioned as `v1` so that older installed apps keep working after the site changes:

| Endpoint | Returns | Built from |
|---|---|---|
| `GET /api/v1/surah/[n]?trans=…&script=…&tajweed=…&wbw=…&wbwLang=…` | `AyahView[]` + `ViewMeta` | `surahView()` |
| `GET /api/v1/juz/[j]?…` | same | juz view |
| `GET /api/v1/page/[p]?…` | same, for one Mushaf page | page view |
| `GET /api/v1/ayah/[s]/[a]?…` | a single ayah (for deep links and share) | `getAyahEditions` |
| `GET /api/v1/meta` | surah list, editions, tafseer list (`linkTafsirs()` included), reciters with `timed` ids, minimum app version | `meta.ts`, `catalog.ts` |
| existing: `editions`, `tafsir/[slug]/[s]/[a]`, `qoh`, `word`, `search`, `quiz`, `study`, `related` | unchanged, reused as they are | — |

- The query parameters go through the same validation as `readSettings()`, so nothing unchecked reaches an external URL.
- Responses carry `Cache-Control: s-maxage=86400, stale-while-revalidate`. Vercel's edge then answers repeat requests, which keeps Vercel costs and the load on the QF API low.
- Audio timings: the app downloads `public/timings/<id>.json` directly, since those files are static.
- A `minAppVersion` field in `/meta` lets an old app ask the reader to update when the API has to break.
- Light abuse protection: an `X-App` header and a rate limit per IP on `search`. There are no secrets in the app.
- Every new endpoint gets a route in `tests/mock-api.mjs` and checks in `tests/e2e.mjs`.
- Universal links and app links: serve `public/.well-known/apple-app-site-association` and `assetlinks.json`, so a `connectingquran.com/surah/2/255` link opens in the app when it is installed.
- Add a `/privacy` page, which both stores require.

### 3.2 App stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK (current), TypeScript, **Expo Router** (file routes mirror the site: `surah/[n]`, `juz/[j]`, `mushaf/[p]`, `tafseer/[s]/[a]`, `search`, `quiz/[s]`, `bookmarks`, `settings`) |
| Styling | **NativeWind** (Tailwind for RN). The 3 palettes × light/dark from `globals.css` become one TS theme object, so the colours match the site |
| Data | **TanStack Query** with its cache saved to disk, so a surah read once opens offline |
| Local storage | **MMKV** for settings, bookmarks and last read (the same keys and shape as the site's `noor.*`). **expo-sqlite** and the file system for downloads |
| Lists | **FlashList**, one row per ayah. Al-Baqarah has 286 ayahs and more than 6,000 words when word-by-word is on, so the list must be virtualised |
| Audio | **react-native-track-player**: background play, lock-screen and notification controls, queue, speed. Reciters with one file per surah seek with the timings JSON, as `PlayerProvider` does on the site |
| Fonts | Ship KFGQPC Uthmanic Hafs, the Indo-Pak Nastaleeq, surah names and Mehr Nastaliq inside the app (`expo-font`). Jameel Noori must **not** be shipped (no licence) |
| Tafseer HTML | `react-native-render-html` for normal tafseers. A WebView for the long eQuranLibrary and QuranoHadith pages |
| Videos | Open in the YouTube app, or play in an embedded YouTube iframe player |
| Builds | **EAS Build** (Android and iOS in the cloud), **EAS Submit** (store uploads), **EAS Update** (JS fixes over the air) |
| Crash reports | Sentry (free tier), with no personal data |

### 3.3 Sharing code with the site

- Move the helpers that run anywhere into `lib/shared/`: `text`, `grammar`, `quiz`, `step`, `surahs`, `highlight`, the `settings` types and the `views` types. Leave thin re-exports at the old paths so the site's imports don't change.
- Metro's `watchFolders` points at `../lib/shared`.
- Rule: nothing in `shared/` imports `server-only`, `next/*` or the DOM. A `tsc` check in `mobile/` will catch a break.

---

## 4. Feature map: site → app (v1 scope confirmed 2026-11-24)

"Built" = working in the `mobile/` prototype on 7 bundled surahs; it still needs connecting to all 114 through `/api/v1`.

| Feature | Release | Status / notes |
|---|---|---|
| Surah list, Continue reading, surah search | v1 | Built |
| Surah reader, Indo-Pak and Uthmani | v1 | Built |
| Juz reader | v1 | Stub only |
| All the site's translations, chosen in Settings | v1 | 2 built; the rest come with the API |
| Word card (meaning, root, grammar), with the tapped word highlighted | v1 | Built |
| Word audio ("Hear word") | v1, only if QF grants permission | Built; hidden if permission isn't given |
| Recitation: every site reciter, including surah-file (timed) ones | v1 | 4 built |
| Background playback, lock-screen controls | v1 | Needs a real (EAS) build; Expo Go can't do it |
| Recitation bar (after play, with ×), full player with speed / repeat / sleep timer | v1 | Built |
| Tafseer: every work the site carries, with the language filter | v1 | 4 built |
| Mushaf: surah list, pages scrolling down, justified lines, full view, long-press translation panel | v1 | Built (moved up from 1.1) |
| Search through the site's search, all surahs | v1 | Local-only now |
| Bookmarks, history, last read (on the phone) | v1 | Built |
| Settings, palettes, light/dark, first-run setup | v1 | Built |
| Copy and share an ayah as text | v1 | Built |
| Offline: what you have read stays available | v1 | Partial |
| Full surah download for offline use | v1 | Not built (moved up from 1.1). The reader chooses per download: text only, or text and the chosen reciter's audio |
| Daily ayah reminder (local notification) | v1 | Not built (moved up from 1.1) |
| Tajweed colours (Uthmani) | 1.1 | Moved down from v1; reuse `tajweedTokens` from `lib/text.ts` |
| Tafseer compare | 1.1 | Moved down from v1 |
| Quiz | 1.1 | `quiz.ts` is reused as it is |
| Video lectures | 1.1 | YouTube player plus a rights check |
| Study panel, related ayahs | 1.1 | |
| eQuranLibrary / QuranoHadith tafseer pages | 1.1 | Need permission for in-app display |
| Share ayah as an image card | 1.1 | |
| Accounts and bookmark sync | later | Possibly through Quran Foundation's user APIs |
| Urdu app interface | later | |
| Home-screen widget (ayah of the day) | later | Needs native widget code on each platform |

---

## 5. Phases

Week counts are rough and assume I write the code while you test on your phones between phases. Per your rule, nothing is committed or released until you have tried it and approved it.

**Phase 0: setup and the risky part first (≈1 week)**
- Open the developer accounts:
  - Apple Developer Program: $99 a year.
  - Google Play Console: $25 once.
- Create the Expo project in `mobile/` and install a dev build on both phones.
- **Rendering spike:** Al-Fatiha and Al-Baqarah in both scripts, with tajweed, word-by-word and Urdu Nastaliq translation, on a real Android phone and a real iPhone.
- Things to check in the spike:
  - Indo-Pak private-use glyphs and ayah-end tokens.
  - Nastaliq lines being clipped (Android is known for this).
  - Right-to-left line breaking.
  - Scrolling speed with word-by-word on.
- **Go / no-go:** if rendering isn't right here, we change the approach before building anything else.

**Phase 1: backend API v1 (≈1 week, in this repo)**
- The `/api/v1` endpoints, cache headers, mock routes, e2e checks, the `/privacy` page, `.well-known` files and the `lib/shared` move.
- You test it on the site, then it is committed and deployed.

**Phase 2: core reader (≈2–3 weeks)**
- Home, surah list, the surah and juz readers, settings, themes and palettes.
- Bookmarks, last read, the word card, copy and share text.

**Phase 3: audio (≈1–2 weeks)**
- Track player with every reciter, including the timed ones.
- Background play, lock screen, speed, auto-play to the next ayah, auto-scroll, repeat.

**Phase 4: tafseer and search (≈2 weeks)**
- The tafseer sheet and reader, compare, the language filter and the eQuranLibrary / QuranoHadith works.
- Search.

**Phase 5: v1.1 features (≈2–3 weeks)**
- Mushaf, quiz, videos, the study panel and related ayahs.
- Offline downloads, the share card and reminders.
- These could ship as a 1.1 update rather than holding back v1.

**Phase 6: polish and beta (≈1–2 weeks)**
- Accessibility: screen-reader labels, and font size that follows the system setting.
- Tablet layout, app icon, splash screen and store screenshots.
- Store texts in English and Urdu, Data Safety and App Privacy forms (no tracking, no data collected).
- **Beta testing:**
  - iOS: TestFlight.
  - Android: Play closed testing. A new personal Play account must run a closed test with **at least 12 testers for 14 days** before it can publish to production, so start recruiting testers early.

**Phase 7: release (≈1 week including review)**
- Submit to both stores and fix anything review raises.
- After launch, JS fixes go out through EAS Update. Native changes need a new store build.

**Total:** about 10–14 weeks to v1 in both stores, plus about 3 weeks for 1.1.

---

## 6. Risks and how we handle them

| Risk | Mitigation |
|---|---|
| Arabic, Indo-Pak and Nastaliq rendering on Android | Phase 0 spike on real devices before anything else. Generous `lineHeight`, `includeFontPadding: false`, and `size-adjust`-style scaling per font |
| Long surahs scrolling slowly with word-by-word on | FlashList, memoised ayah rows, word nodes only when word-by-word is on |
| **Content rights inside an app** | The QF API terms for apps, the eQuranLibrary / QuranoHadith pages we pull tafseer notes from, reciter audio CDNs and font licences (KFGQPC, the Indo-Pak font, Mehr Nastaliq) need checking for app use, which is a separate question from website use. I'll make a checklist, and some may need an email asking permission before launch |
| More traffic on Vercel and QF | Edge caching on `/api/v1`, and the app's cache on disk. Watch usage during the beta |
| Store review | A native app with real features (audio, offline, notes) passes 4.2. Privacy policy and accurate privacy labels from day one |
| iOS work on Windows | EAS Build in the cloud, plus TestFlight on your iPhone. A Mac is only needed for deep native debugging, which is unlikely |
| Site and app drifting apart | Shared `lib/shared` code, a versioned API, and `minAppVersion` |

---

## 7. Costs

| Item | Cost |
|---|---|
| Apple Developer Program | $99 a year |
| Google Play Console | $25 once |
| Expo EAS | Free tier (about 30 builds a month, with a queue) is enough to start. The paid plan is about $19 a month if the build queue gets slow |
| Sentry | Free tier |
| Vercel / Neon | Current plans, to be watched during the beta |

---

## 8. Changes to this repo

- `app/api/v1/*`, the new endpoints.
- `lib/shared/*`, moved helpers, with re-exports at the old paths.
- `app/privacy/page.tsx`, and an entry for `/privacy` in `proxy.ts` and the sitemap if needed.
- `public/.well-known/apple-app-site-association` and `assetlinks.json`.
- `tests/mock-api.mjs` and `tests/e2e.mjs` for the new routes.
- `mobile/`, the Expo app, with its own `package.json`. The site's build ignores it.
- `CLAUDE.md`: a short section on the app and the API contract.
