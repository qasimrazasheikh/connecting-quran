# Noor Library (Next.js)

Quran reader with Urdu and English translations, several tafseers per ayah, word grammar,
word-by-word meanings, tajweed colours, Indo-Pak script, recitation player, Mushaf mode,
search, surah quizzes and video lectures.

Built with **Next.js 16 (App Router)**, **React 19** and **Tailwind CSS v4**.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

Node 20.9 or newer is needed.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On vercel.com: **Add New → Project**, pick the repo, keep the defaults (framework: Next.js).
3. Click **Deploy**. No environment variables are needed.

## How it is organised

| Folder | What is in it |
|---|---|
| `app/` | Pages (one folder per URL) and API routes in `app/api/` |
| `components/` | React components. `AppProvider` holds settings, bookmarks and panels; `PlayerProvider` holds the audio player |
| `lib/` | Data and helpers. `quran.ts` talks to the outside APIs (server only, cached for 24 hours); `views.ts` builds what each page shows |
| `tests/` | Offline mock API and an end-to-end test |

### Pages

| URL | Page |
|---|---|
| `/`, `/juz` | Surah and Juz lists |
| `/surah/2`, `/surah/2/255` | Reader (the second number jumps to an ayah) |
| `/juz/30` | Juz reader |
| `/mushaf/1` … `/mushaf/604` | Mushaf, page by page |
| `/tafseer/2/255`, `/videos/2/255` | Tafseer page, video lectures tab |
| `/search?q=mercy&scope=en` | Search (`scope` = `ar`, `ur` or `en`) |
| `/quiz`, `/quiz/2/1` | Quiz list, quiz (surah 2, part 1) |
| `/bookmarks` | Bookmarks |

Old links from the single-file site (`#/surah/2/255`) still work; they redirect.

### Settings

Settings are saved in the browser (`localStorage`) and copied to a small cookie
(`noor_settings`), so the server can render the chosen translations, script, tajweed and
word-by-word meanings straight away. Bookmarks and "continue reading" stay in the browser
for now. Phase 2 (login) will move them to the user's account.

### API routes (used by the browser)

| Route | Returns |
|---|---|
| `/api/editions` | Translation and tafseer lists |
| `/api/tafsir/{slug}/{s}/{a}` | Tafseer text for one ayah |
| `/api/word/{s}/{a}?w=` | Grammar and meaning of one word |
| `/api/search?q=&scope=` | Search results |
| `/api/quiz/{s}` | Data for building a surah quiz |

## Data sources

- Quran text and translations: AlQuran Cloud API
- Indo-Pak text, word meanings: Quran.com API
- Tafseer: spa5k/tafsir_api (jsDelivr) and QuranEnc (Rowwad Translation Center)
- Word grammar: Quranic Arabic Corpus (GNU GPL), via mustafa0x/quran-morphology
- Recitation: islamic.network CDN; word audio: Quran.com CDN

Each source URL can be changed with an environment variable; see `.env.example`.

## Testing (offline)

```bash
npm run build
./tests/start-test-server.sh     # mock API on :4010, app on :3100
npx playwright install chromium  # first time only
node tests/e2e.mjs               # about 60 feature checks
node tests/visual.mjs            # screenshots of every screen (desktop + phone, light + dark) in /tmp/vis
```

The mock API uses real Arabic, Urdu and English text for Surah Al-Fatiha (1) and Al-Ikhlas (112),
so fonts and vowel marks can be checked by eye. Other surahs use placeholder words.
