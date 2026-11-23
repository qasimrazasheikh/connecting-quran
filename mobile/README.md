# Connecting Quran — mobile app (Android, iOS)

Expo (React Native) app for connectingquran.com: the Quran in Indo-Pak and Uthmani script, Urdu and English translations, word card with grammar,
recitation, tafseer, Mushaf, search and bookmarks. The plan and the decisions behind it are in `../docs/mobile-app-plan.md`.

Stack: Expo SDK 58, Expo Router (`src/app/`, one file per screen), TypeScript, React Compiler. All screens share one stack, with the tab bar
(`src/components/TabBar.tsx`) drawn under it so it stays on every screen.

## First time: build the Quran data

The Quran text, translations and word data come from quran.com and AlQuran Cloud and are not republished in this repository. Build them once:

```bash
npm install
node scripts/fetch-quran.mjs     # ~15 min; a re-run skips surahs already saved
```

This writes `assets/quran/` (one `.dat` file per surah and per surah's grammar, the Mushaf page / juz index, the search file) and
`src/lib/quran-files.ts`. The app can't build without them. To rebuild everything, delete `assets/quran/surah/` and run the script again.

## Run on a phone (Expo Go)

```bash
npx expo start                   # scan the QR code with Expo Go (phone on the same Wi-Fi)
npx tsc --noEmit && npx expo lint
```

Expo Go can't play recitation with the screen locked or show lock-screen controls; the installed build can.

## Build an installable APK

```bash
npx eas-cli login                # once, Expo account qrazastag
$env:EAS_NO_VCS = '1'; npx eas-cli build --platform android --profile preview --non-interactive    # PowerShell
```

`EAS_NO_VCS` uploads just this folder (with the locally built data), not the whole repository. Raise `android.versionCode` in `app.json`
for each build that should install as an update. The `preview` profile makes an APK to install directly; `production` makes the
Play Store bundle.

## Things to know

- Indo-Pak stop signs and justified Arabic need Android-specific handling (`gapMarks` in `src/lib/data.ts`, `src/components/JustifiedRtl.tsx`):
  check text changes on a real Android phone, not just in a browser.
- Surahs load on demand from the shipped files (`useSurah`, `usePage`, `loadSearch` in `src/lib/data.ts`). Phase 2 will load them from the
  website's `/api/v1` instead.
- `src/lib/grammar.ts` is a copy of the site's `lib/grammar.ts` until the shared `lib/shared/` exists.
