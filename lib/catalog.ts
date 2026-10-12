/**
 * Reads the curated catalogue (server only). Every reader returns null when there is no database or it can't be
 * reached, so callers fall back to the built-in lists and the site keeps working.
 */
import 'server-only';
import {and, asc, desc, eq, gte, isNull, lte, or} from 'drizzle-orm';
import {db, schema} from './db';
import {qohUrl, VIDEO_SOURCES, type TafsirEdition} from './meta';

const {sources, entries, relatedAyahs} = schema;
const TTL = 60_000;
const memo = new Map<string, {t: number; p: Promise<unknown>}>();
/** Results are kept for a minute per server instance; admin edits clear it (other instances catch up within the minute). */
function cached<T>(key: string, fn: () => Promise<T>): Promise<T | null> {
  if (!db) return Promise.resolve(null);
  const hit = memo.get(key);
  if (hit && Date.now() - hit.t < TTL) return hit.p as Promise<T | null>;
  const p = fn().catch(e => { console.error('catalogue:', (e as Error).message); memo.delete(key); return null; });
  memo.set(key, {t: Date.now(), p});
  return p;
}
export const clearCatalogCache = () => memo.clear();

const LANG_NAME = {ar: 'arabic', ur: 'urdu', en: 'english'} as const;
const LANG_LABEL = {ar: 'Arabic', ur: 'Urdu', en: 'English'} as const;

/** Approved tafseers, in the curator's order. */
export const catalogTafsirs = () => cached('tafsirs', async () => {
  const rows = await db!.select().from(sources).where(and(eq(sources.kind, 'tafseer'), eq(sources.status, 'approved'))).orderBy(asc(sources.sort), asc(sources.id));
  return rows.map((r): TafsirEdition => ({slug: r.slug, name: r.name, language_name: LANG_NAME[r.lang], author_name: r.author || undefined}));
});

export type VideoLink = {title: string; url: string; start: string; range: string; whole: boolean};
export type VideoCard = {id: string; name: string; initials: string; lang: string; desc: string; searchUrl: string; links: VideoLink[]};

const fill = (pattern: string, s: number, a: number, surah: string) =>
  pattern.replace(/\{s\}/g, String(s)).replace(/\{a\}/g, String(a)).replace(/\{surah\}/g, encodeURIComponent(surah));
const initials = (name: string) => name.replace(/^(Dr|Mufti|Maulana|Shaykh|Sheikh)\.?\s+/i, '').split(/\s+/).map(w => w[0]).join('').slice(0, 3).toUpperCase();
/** 75 → "1:15", 3725 → "1:02:05" */
const clock = (sec: number) => {
  const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, pad = (n: number) => String(n).padStart(2, '0');
  return `${h ? `${h}:${pad(m)}` : m}:${pad(sec % 60)}`;
};
/** YouTube links open at the entry's start time. */
function withStart(url: string, sec: number | null){
  if (!sec || !/youtu\.?be/.test(url)) return url;
  const u = new URL(url); u.searchParams.set('t', `${sec}s`); return u.toString();
}

/**
 * Lecture series for an ayah (or a whole surah when `a` is null): each approved video source with the exact videos the
 * curator added for that ayah/surah, plus its fallback search link.
 */
export async function videoCards(s: number, a: number | null, surah: string): Promise<VideoCard[]> {
  const res = await cached(`videos:${s}:${a}`, async () => {
    const [srcs, ents] = await Promise.all([
      db!.select().from(sources).where(and(eq(sources.kind, 'video'), eq(sources.status, 'approved'))).orderBy(asc(sources.sort), asc(sources.id)),
      db!.select().from(entries).where(and(eq(entries.kind, 'video'), eq(entries.status, 'approved'), eq(entries.surah, s),
        a == null ? undefined : or(isNull(entries.ayahFrom), and(lte(entries.ayahFrom, a), gte(entries.ayahTo, a)))))
        .orderBy(asc(entries.ayahFrom), asc(entries.startSec), asc(entries.id)),
    ]);
    return {srcs, ents};
  });
  if (!res) return VIDEO_SOURCES.map(v => ({id: v.id, name: v.name, initials: v.initials, lang: v.lang, desc: v.desc, searchUrl: v.url(surah), links: []}));
  return res.srcs.map(src => ({
    id: src.slug, name: src.name, initials: initials(src.name), lang: LANG_LABEL[src.lang], desc: src.description,
    searchUrl: src.urlPattern ? fill(src.urlPattern, s, a ?? 1, surah) : src.homepage,
    links: res.ents.filter(e => e.sourceId === src.id).map(e => ({
      title: e.title || src.name, url: withStart(e.url, e.startSec), start: e.startSec ? clock(e.startSec) : '', whole: e.ayahFrom == null,
      range: e.ayahFrom == null ? 'Whole surah' : e.ayahFrom === e.ayahTo ? `Ayah ${s}:${e.ayahFrom}` : `Ayahs ${s}:${e.ayahFrom}–${e.ayahTo}`,
    })),
  }));
}

export type StudyLink = {id: string; name: string; author: string; lang: string; site: string; url: string};
const siteOf = (src: {description: string; homepage: string}) => src.description || (src.homepage ? new URL(src.homepage).hostname.replace(/^www\./, '') : '');

/**
 * "More tafseers": approved link sources opened at this ayah (e.g. a tafseer on eQuranLibrary), plus single links the
 * curator attached to this ayah, in the curator's order.
 */
export async function studyLinks(s: number, a: number): Promise<StudyLink[]> {
  const res = await cached(`links:${s}:${a}`, async () => {
    const [srcs, ents] = await Promise.all([
      db!.select().from(sources).where(and(eq(sources.kind, 'link'), eq(sources.status, 'approved'))).orderBy(asc(sources.sort), asc(sources.id)),
      db!.select().from(entries).where(and(eq(entries.kind, 'link'), eq(entries.status, 'approved'), eq(entries.surah, s),
        or(isNull(entries.ayahFrom), and(lte(entries.ayahFrom, a), gte(entries.ayahTo, a))))).orderBy(asc(entries.id)),
    ]);
    return {srcs, ents};
  });
  if (!res) return [{id: 'qoh', name: 'More Urdu tafaseer', author: 'QuranoHadith.com', lang: 'Urdu', site: 'QuranoHadith', url: qohUrl(s, a)}];
  const out: StudyLink[] = [];
  res.srcs.forEach(src => {
    const one = (id: string, name: string, url: string) => out.push({id, name, author: src.author, lang: LANG_LABEL[src.lang], site: siteOf(src), url});
    if (src.urlPattern) one(src.slug, src.name, fill(src.urlPattern, s, a, ''));
    res.ents.filter(e => e.sourceId === src.id && e.url).forEach(e => one(`${src.slug}-${e.id}`, e.title || src.name, e.url));
  });
  return out;
}

/** A related ayah as the Study panel shows it: its Arabic as tokens, shared words marked. */
export type RelatedItem = {s: number; a: number; sname: string; score: number; coverage: number; words: number; ip: boolean; toks: {t: string; hit: boolean}[]};
export type Related = {s: number; a: number; score: number; coverage: number; words: number; match: [number, number][]};
/** Ayahs sharing wording with s:a (QUL data), closest first. Empty without a database. */
export async function relatedAyahsOf(s: number, a: number): Promise<Related[]> {
  const rows = await cached(`related:${s}:${a}`, () => db!.select().from(relatedAyahs)
    .where(and(eq(relatedAyahs.surah, s), eq(relatedAyahs.ayah, a))).orderBy(desc(relatedAyahs.score), asc(relatedAyahs.relSurah), asc(relatedAyahs.relAyah)));
  return (rows || []).map(r => ({s: r.relSurah, a: r.relAyah, score: r.score, coverage: r.coverage, words: r.words, match: r.matchWords}));
}
