/**
 * What connectingquran.com offers the app (/api/v1): the lists of translations, tafseers and reciters, and translations
 * by surah. The lists are kept on the phone so they work offline and refreshed once per launch; a translation a reader
 * has opened is saved as a file, so a surah read once reads again without a connection.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Directory, File, Paths} from 'expo-file-system';
import {useEffect, useSyncExternalStore} from 'react';
import {Platform} from 'react-native';
import type {Ayah} from './data';

export const SITE = 'https://www.connectingquran.com';

export type TransMeta = {id: string; name: string; lang: string; dir: 'rtl' | 'ltr'; english: string};
/** `lang`: 'urdu' | 'english' | 'arabic'. `route`: 'qoh' works are read from QuranoHadith's page for the ayah. */
export type TafsirMeta = {slug: string; name: string; lang: string; author: string; en: string; route: 'tafsir' | 'qoh'};
/** `audio`: per-ayah address template ({n}, {sss}{aaa}); `timings`: one file per surah, see loadTimings. */
export type ReciterMeta = {id: string; name: string; audio?: string; timings?: string};
export type Meta = {minAppVersion: string; translations: TransMeta[]; tafsirs: TafsirMeta[]; reciters: ReciterMeta[]; wordAudio: string};

/** Translations shipped inside the app's surah files (Ayah.ur / Ayah.en): no connection needed. */
export const BUNDLED: Record<string, (a: Ayah) => string> = {'ur.jalandhry': a => a.ur, 'en.sahih': a => a.en};

/** Used until the site's list first arrives (a first launch with no connection). */
const BUILT_IN: Meta = {
  minAppVersion: '1.0.0',
  translations: [
    {id: 'ur.jalandhry', name: 'Urdu · Fateh Muhammad Jalandhry', lang: 'ur', dir: 'rtl', english: 'Fateh Muhammad Jalandhry'},
    {id: 'en.sahih', name: 'English · Saheeh International', lang: 'en', dir: 'ltr', english: 'Saheeh International'},
  ],
  tafsirs: [
    {slug: 'ur-tafseer-ibn-e-kaseer', name: 'تفسیر ابن کثیر', author: 'حافظ ابن کثیر', lang: 'urdu', en: 'Tafsir Ibn Kathir', route: 'tafsir'},
    {slug: 'tafsir-bayan-ul-quran', name: 'بیان القرآن', author: 'ڈاکٹر اسرار احمد', lang: 'urdu', en: 'Bayan ul Quran', route: 'tafsir'},
    {slug: 'en-tafisr-ibn-kathir', name: 'Tafsir Ibn Kathir', author: 'Hafiz Ibn Kathir', lang: 'english', en: '', route: 'tafsir'},
    {slug: 'en-tafsir-maarif-ul-quran', name: 'Maarif-ul-Quran', author: 'Mufti Muhammad Shafi', lang: 'english', en: '', route: 'tafsir'},
  ],
  reciters: [
    {id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', audio: 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/{n}.mp3'},
    {id: 'ar.abdulbasitmurattal', name: 'Abdul Basit (Murattal)', audio: 'https://cdn.islamic.network/quran/audio/192/ar.abdulbasitmurattal/{n}.mp3'},
    {id: 'ar.husary', name: 'Mahmoud Khalil Al-Husary', audio: 'https://cdn.islamic.network/quran/audio/128/ar.husary/{n}.mp3'},
    {id: 'ar.mahermuaiqly', name: 'Maher Al-Muaiqly', audio: 'https://cdn.islamic.network/quran/audio/128/ar.mahermuaiqly/{n}.mp3'},
  ],
  wordAudio: 'https://audio.qurancdn.com/wbw/{sss}_{aaa}_{www}.mp3',
};

/**
 * A tiny store. Each change replaces the snapshot (`bump`), and components read their data from the snapshot they are
 * given: the React Compiler caches renders by their inputs, so data read from a module variable would never refresh.
 */
type Snap = {meta: Meta; trans: Map<string, string[]>; loading: Set<string>; failed: Set<string>};
const listeners = new Set<() => void>();
const subscribe = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };

async function getJSON<T>(path: string): Promise<T> {
  const r = await fetch(SITE + path);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json() as Promise<T>;
}

// ---- lists ------------------------------------------------------------------------------------------------------------
const META_KEY = 'noor.meta';
let meta = BUILT_IN, metaAsked = false;
const trans = new Map<string, string[]>(), loading = new Set<string>(), failed = new Set<string>();
let snap: Snap = {meta, trans: new Map(), loading: new Set(), failed: new Set()};
function bump(){
  snap = {meta, trans: new Map(trans), loading: new Set(loading), failed: new Set(failed)};
  listeners.forEach(f => f());
}
const useSnap = () => useSyncExternalStore(subscribe, () => snap);
function loadMeta(){
  if (metaAsked) return;
  metaAsked = true;
  AsyncStorage.getItem(META_KEY).then(raw => { if (raw && meta === BUILT_IN) try{ meta = JSON.parse(raw); bump(); }catch{} }).catch(() => {})
    .then(() => getJSON<Meta>('/api/v1/meta')).then(d => {
      if (!d?.reciters?.length || !d.tafsirs?.length) return;
      meta = d; bump();
      AsyncStorage.setItem(META_KEY, JSON.stringify(d)).catch(() => {});
    }).catch(() => { /* offline: keep the saved or built-in lists */ });
}
/** The site's lists (saved copy at once, fresh copy when it arrives). */
export function useMeta(): Meta {
  const m = useSnap().meta;
  useEffect(loadMeta, []);
  return m;
}
export const metaNow = () => meta;
export const reciterOf = (id: string) => meta.reciters.find(r => r.id === id) ?? meta.reciters[0];

// ---- translations -----------------------------------------------------------------------------------------------------
const transFile = (id: string, s: number) => new File(Paths.document, 'trans', id, `${s}.json`);

async function fetchTrans(id: string, s: number){
  const key = `${id}/${s}`;
  if (trans.has(key) || loading.has(key)) return;
  loading.add(key); failed.delete(key); bump();
  try{
    let ayahs: string[] | undefined;
    const web = Platform.OS === 'web', f = web ? null : transFile(id, s);
    if (f?.exists) try{ ayahs = JSON.parse(await f.text()); }catch{}
    if (!ayahs){
      ayahs = (await getJSON<{ayahs: string[]}>(`/api/v1/translation/${id}/${s}`)).ayahs;
      if (f){
        new Directory(Paths.document, 'trans', id).create({intermediates: true, idempotent: true});
        f.write(JSON.stringify(ayahs)).catch(() => {});
      }
    }
    trans.set(key, ayahs);
  }catch{ failed.add(key); }
  loading.delete(key); bump();
}

/** One line of translation under an ayah; `text` undefined while it loads or when it couldn't (`failed`). */
export type TransLine = {id: string; dir: 'rtl' | 'ltr'; ur: boolean; text?: string; failed?: boolean};
/**
 * The reader's chosen translations for surah `s`, as a function giving an ayah's lines. Translations other than the
 * two bundled ones are fetched (or read from the phone) when the surah is first shown.
 */
export function useTranslations(s: number, ids: string[]): (ayah: Ayah) => TransLine[] {
  const now = useSnap(), m = useMeta();
  const want = ids.filter(id => !BUNDLED[id]).join(',');
  useEffect(() => { if (s) want.split(',').filter(Boolean).forEach(id => fetchTrans(id, s)); }, [s, want]);
  return ayah => ids.map(id => {
    const info = m.translations.find(x => x.id === id), dir = info?.dir ?? (id.startsWith('ur') ? 'rtl' : 'ltr');
    const line = {id, dir, ur: id.startsWith('ur')};
    if (BUNDLED[id]) return {...line, text: BUNDLED[id](ayah)};
    return {...line, text: now.trans.get(`${id}/${s}`)?.[ayah.a - 1], failed: now.failed.has(`${id}/${s}`)};
  });
}
/** Ask again for translations that failed (e.g. the connection came back). */
export const retryTranslations = (s: number, ids: string[]) => ids.filter(id => !BUNDLED[id]).forEach(id => fetchTrans(id, s));

// ---- reciters ---------------------------------------------------------------------------------------------------------
const p3 = (n: number) => String(n).padStart(3, '0');
/** A per-ayah reciter's file for s:a (`n`: the ayah's number in the whole Quran). */
export const ayahAudio = (r: ReciterMeta, s: number, a: number, n: number) =>
  (r.audio ?? '').replace('{n}', String(n)).replace('{sss}', p3(s)).replace('{aaa}', p3(a));
export const wordAudio = (s: number, a: number, w: number) =>
  meta.wordAudio.replace('{sss}', p3(s)).replace('{aaa}', p3(a)).replace('{www}', p3(w));

/** A surah-file reciter: `u[s-1]` is surah s's file, `t[s-1][a-1]` the ms where ayah a starts in it. */
export type Timings = {u: string[]; t: number[][]};
const timings = new Map<string, Promise<Timings>>();
export function loadTimings(path: string){
  if (!timings.has(path)) timings.set(path, getJSON<Timings>(path).catch(e => { timings.delete(path); throw e; }));
  return timings.get(path)!;
}

// ---- tafseer ----------------------------------------------------------------------------------------------------------
export type QohItem = {name: string; author: string; text: string};
/** One work's note for s:a ('' when it has none), or QuranoHadith's works for it. */
export const getTafsir = (slug: string, s: number, a: number): Promise<{text?: string; error?: string}> =>
  fetch(`${SITE}/api/tafsir/${slug}/${s}/${a}`).then(r => r.json());
export const getQoh = (s: number, a: number) => getJSON<{items: QohItem[]}>(`/api/qoh/${s}/${a}`).then(d => d.items);
/** The chosen reciter, for screens (re-renders when the site's list arrives). */
export const useReciter = (id: string) => { const m = useMeta(); return m.reciters.find(r => r.id === id) ?? m.reciters[0]; };
