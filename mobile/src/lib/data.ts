/**
 * The Quran data shipped with the app (assets/quran, made by scripts/fetch-quran.mjs): one file per surah and one for
 * its grammar, read on demand and kept in memory, plus a small index of Mushaf pages and juz starts.
 */
import {Asset} from 'expo-asset';
import {File} from 'expo-file-system';
import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import fatihahFile from '@/assets/quran/fatihah.json';
import indexFile from '@/assets/quran/index.json';
import surahList from '@/assets/quran/surahs.json';
import {MORPH_FILES, SEARCH_FILE, SURAH_FILES} from './quran-files';

export type Word = {ip: string; tr: string; en: string; ur: string};
/** `ipStop`: the stop sign at the end of the ayah, if any (in Indo-Pak text it is part of the ayah-end token). */
export type Ayah = {a: number; n: number; p: number; j: number; ip: string; ipStop?: string; uth: string; ur: string; en: string; w: Word[]};
export type SurahInfo = {n: number; ar: string; en: string; meaning: string; ayahs: number; rev: string};
/** Grammar segments by "ayah:word": [text, part of speech, tags] (Quranic Arabic Corpus). */
export type Morph = Record<string, [string, string, string][]>;

export const SURAHS = surahList as SurahInfo[];
export const surahInfo = (n: number) => SURAHS[n - 1];
/** Al-Fatihah is also bundled in the code: the Bismillah and the settings preview need it at once. */
export const FATIHAH = (fatihahFile as {ayahs: Ayah[]}).ayahs;

/** A shipped asset file as text (on the web, assets are plain URLs). */
async function readAsset(id: number){
  const asset = Asset.fromModule(id);
  if (Platform.OS === 'web') return (await fetch(asset.uri)).text();
  await asset.downloadAsync();
  return new File(asset.localUri ?? asset.uri).text();
}
/** Per-surah data read once, then served from memory; requests made while it loads share one read. */
function store<T>(files: Record<number, number>, pick: (raw: never) => T){
  const done = new Map<number, T>(), pending = new Map<number, Promise<T>>();
  const load = (s: number): Promise<T> => {
    const ready = done.get(s);
    if (ready) return Promise.resolve(ready);
    if (!pending.has(s)) pending.set(s, readAsset(files[s]).then(text => {
      const v = pick(JSON.parse(text) as never);
      done.set(s, v); pending.delete(s);
      return v;
    }));
    return pending.get(s)!;
  };
  /** The data for `s`, or undefined while it loads (the component re-renders when it arrives). */
  const useData = (s: number): T | undefined => {
    const [got, setGot] = useState<{s: number; v: T}>();
    useEffect(() => { let live = true; load(s).then(v => { if (live) setGot({s, v}); }); return () => { live = false; }; }, [s]);
    return got?.s === s ? got.v : done.get(s);
  };
  return {load, now: (s: number) => done.get(s), useData};
}
const surahStore = store<Ayah[]>(SURAH_FILES, (d: {ayahs: Ayah[]}) => d.ayahs);
const morphStore = store<Morph>(MORPH_FILES, (d: Morph) => d);
export const loadSurah = surahStore.load;
export const useSurah = surahStore.useData;
export const useMorph = morphStore.useData;
/** An ayah, if its surah is already in memory (screens showing one ayah load its surah with useSurah). */
export const ayahNow = (s: number, a: number): Ayah | undefined => surahStore.now(s)?.[a - 1];

/** Every ayah's searchable text, [surah, ayah, Indo-Pak, Urdu, English], read once on the first search. */
export type SearchRow = [number, number, string, string, string];
let searchRows: Promise<SearchRow[]> | undefined;
export const loadSearch = () => searchRows ??= readAsset(SEARCH_FILE).then(text => JSON.parse(text) as SearchRow[]);

/** The ayah's number in the whole Quran (1–6236), which names its recitation file; needs no surah loaded. */
const START = SURAHS.reduce<number[]>((acc, x, i) => [...acc, i ? acc[i - 1] + SURAHS[i - 1].ayahs : 0], []);
export const ayahNumber = (s: number, a: number) => START[s - 1] + a;

/** Mushaf pages as [surah, first ayah, last ayah] runs, and the first ayah of each juz. */
export type Run = [number, number, number];
const INDEX = indexFile as {pages: Run[][]; juz: [number, number][]};
export const PAGE_COUNT = INDEX.pages.length;
export const pageRuns = (p: number): Run[] => INDEX.pages[p - 1] ?? [];
/** The Mushaf page an ayah is on. */
export function pageOf(s: number, a: number){
  for (let i = 0; i < INDEX.pages.length; i++) if (INDEX.pages[i].some(([rs, from, to]) => rs === s && a >= from && a <= to)) return i + 1;
  return 1;
}
export const juzStart = (j: number) => INDEX.juz[j - 1];
/** The ayahs on a Mushaf page, once the surahs they belong to have loaded (undefined until then). */
export function usePage(p: number): {s: number; ayah: Ayah}[] | undefined {
  const [got, setGot] = useState<{p: number; items: {s: number; ayah: Ayah}[]}>();
  useEffect(() => {
    let live = true;
    const runs = pageRuns(p);
    Promise.all(runs.map(([s]) => surahStore.load(s))).then(lists => {
      if (live) setGot({p, items: runs.flatMap(([s, from, to], i) => lists[i].slice(from - 1, to).map(ayah => ({s, ayah})))});
    });
    return () => { live = false; };
  }, [p]);
  return got?.p === p ? got.items : undefined;
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
/** The Hafs font draws an Arabic-Indic number as the ornamented ayah-end sign. */
export const endMark = (a: number) => String(a).replace(/\d/g, d => AR_DIGITS[+d]);
/** QPC Hafs text already ends in its ayah number; strip it so both scripts get the same end sign. */
export const uthBody = (t: string) => t.replace(/\s*[٠-٩]+\s*$/, '');

const LETTER = /[ء-يٱ-ۓۺ-ۿ]/;
/**
 * Indo-Pak stop signs (rumooz-e-auqaf) are separate tokens made only of marks, and the font draws them 400-1000 units
 * to the left of where they are anchored. Browsers shape a sign on the space before it, but Android shapes text word by
 * word, split at spaces, so the sign lost its base and landed on the next word (or at the far end of the line).
 * Each sign is now anchored at the end of its own word, on the dotted circle U+25CC (which this font draws invisible
 * and zero-width), with two spaces after it, so it shows in the middle of the gap and never breaks from its word.
 */
export const BASE = '\u25CC';
export const gapMarks = (text: string) => text.split(' ').reduce<string[]>((out, t) => {
  if (t && !LETTER.test(t) && out.length) out[out.length - 1] = out[out.length - 1].trimEnd() + BASE + t + ' ';
  else if (t) out.push(t);
  return out;
}, []).join(' ');

/**
 * Splits an ayah's display text into tappable words (a stop sign stays with its word, see gapMarks), so the count
 * matches the word-by-word data; null when it doesn't (the ayah is then shown as one block).
 */
export function wordTokens(text: string, count: number): string[] | null {
  const out = text.split(/ +/).filter(Boolean);
  return out.length === count ? out : null;
}

export const TAFSIRS = [
  {slug: 'ur-tafseer-ibn-e-kaseer', name: 'تفسیر ابن کثیر', author: 'حافظ ابن کثیر', lang: 'ur'},
  {slug: 'tafsir-bayan-ul-quran', name: 'بیان القرآن', author: 'ڈاکٹر اسرار احمد', lang: 'ur'},
  {slug: 'en-tafisr-ibn-kathir', name: 'Ibn Kathir', author: 'Hafiz Ibn Kathir', lang: 'en'},
  {slug: 'en-tafsir-maarif-ul-quran', name: "Ma'arif al-Qur'an", author: 'Mufti Muhammad Shafi', lang: 'en'},
] as const;
export const SITE = 'https://www.connectingquran.com';

export const RECITERS = [
  {id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', br: 128},
  {id: 'ar.abdulbasitmurattal', name: 'Abdul Basit (Murattal)', br: 192},
  {id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', br: 128},
  {id: 'ar.mahermuaiqly', name: 'Maher Al-Muaiqly', br: 128},
];
/** Per-ayah recitation files on the same CDN the website uses; `n` is the ayah's number in the whole Quran. */
export const audioUrl = (reciter: string, n: number) => {
  const r = RECITERS.find(x => x.id === reciter) ?? RECITERS[0];
  return `https://cdn.islamic.network/quran/audio/${r.br}/${r.id}/${n}.mp3`;
};
