/** Server-side data access. Every external call goes through here and is cached (see REVALIDATE). */
import {unstable_cache} from 'next/cache';
import {API, REVALIDATE} from './config';
import {catalogTafsirs} from './catalog';
import {nativeName} from './tafsir-names';
import {FALLBACK_TAFSIR, FALLBACK_TRANS, QE_EDITION, QE_SLUG, TAFSIR_HIDE, TAFSIR_RENAME, type TafsirEdition, type TransEdition} from './meta';
import {SURAHS} from './surahs';
import {cleanIP, fixTanzil, type QWord} from './text';

class HttpError extends Error { constructor(public status: number, url: string){ super(`HTTP ${status} for ${url}`); } }

/**
 * Quran Foundation access token (OAuth client credentials, valid an hour). Kept in memory per server instance and
 * renewed a minute early. Without CLIENT_ID / CLIENT_SECRET (tests, self-hosting against a mirror) calls go unsigned.
 */
let qfToken: {v: string; until: number} | null = null, qfWarned = false;
async function qfHeaders(renew = false): Promise<Record<string, string>> {
  const id = process.env.CLIENT_ID, secret = process.env.CLIENT_SECRET;
  if (!id || !secret){
    // the real API refuses unsigned calls, and pages then quietly fall back to AlQuran Cloud's text: say so in the log
    if (!qfWarned && !process.env.QURAN_COM_API){ qfWarned = true; console.warn('CLIENT_ID / CLIENT_SECRET not set: Quran Foundation API calls will fail'); }
    return {};
  }
  if (renew || !qfToken || Date.now() > qfToken.until){
    const r = await fetch(API.qfAuth, {method: 'POST', cache: 'no-store',
      headers: {Authorization: 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded'},
      body: 'grant_type=client_credentials&scope=content'});
    if (!r.ok){ console.warn(`Quran Foundation login failed (HTTP ${r.status}): check CLIENT_ID / CLIENT_SECRET`); throw new HttpError(r.status, API.qfAuth); }
    const d = await r.json() as {access_token: string; expires_in: number};
    qfToken = {v: d.access_token, until: Date.now() + (d.expires_in - 60) * 1000};
  }
  return {'x-auth-token': qfToken.v, 'x-client-id': id};
}
async function qfFetch(url: string): Promise<unknown> {
  let r = await fetch(url, {cache: 'no-store', headers: await qfHeaders()});
  if (r.status === 401) r = await fetch(url, {cache: 'no-store', headers: await qfHeaders(true)});
  if (!r.ok){ console.warn(`Quran Foundation API: HTTP ${r.status} for ${url}`); throw new HttpError(r.status, url); }
  return r.json();
}
/** Cached by URL alone: fetch()'s own cache would key on the token header and start over every hour. */
const qfCached = unstable_cache(qfFetch, ['qf'], {revalidate: REVALIDATE});

async function getJSON<T>(url: string, revalidate = REVALIDATE, timeoutMs?: number): Promise<T> {
  if (url.startsWith(API.quranCom)) return qfCached(url) as Promise<T>;
  const r = await fetch(url, {next: {revalidate}, signal: timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined});
  if (!r.ok) throw new HttpError(r.status, url);
  return r.json() as Promise<T>;
}

/** A file from the tafseer source; on a failure other than 404 (or after 8 s), the same file from the backup mirror. */
async function tafsirJSON<T>(path: string): Promise<T> {
  try{ return await getJSON<T>(API.tafsir + path, REVALIDATE, 8000); }
  catch(e){ if (!API.tafsirBackup || (e instanceof HttpError && e.status === 404)) throw e; return getJSON<T>(API.tafsirBackup + path); }
}

/** AlQuran Cloud call: give up after 10 s so a page can still be built from Quran Foundation. */
const cloudJSON = <T>(path: string, revalidate = REVALIDATE) => getJSON<T>(API.quranCloud + path, revalidate, 10000);

export type SurahInfo = {n: number; ar: string; en: string; mean: string; ayahs: number; type: string};
/** Built in (it never changes), so menus and titles need no API. Async so callers stay as they were. */
export async function getSurahList(): Promise<SurahInfo[]> { return SURAHS; }
export async function getTransEditions(): Promise<TransEdition[]> {
  try{
    const d = await cloudJSON<{data: TransEdition[]}>('/edition?format=text&type=translation');
    const list = d.data.filter(e => e.language === 'ur' || e.language === 'en');
    return list.length ? list : FALLBACK_TRANS;
  }catch{ return FALLBACK_TRANS; }
}
export function transMeta(eds: TransEdition[], id: string){
  const e = eds.find(x => x.identifier === id) || FALLBACK_TRANS.find(x => x.identifier === id) || {identifier: id, englishName: id, language: id.split('.')[0]} as TransEdition;
  return {id, name: `${e.language === 'ur' ? 'Urdu' : e.language === 'en' ? 'English' : e.language} · ${e.englishName}`, lang: e.language, dir: (e.direction || (/^(ur|ar|fa)/.test(e.language) ? 'rtl' : 'ltr')) as 'rtl' | 'ltr'};
}

export type CloudAyah = {number: number; text: string; numberInSurah: number; juz: number; page?: number; surah: {number: number; name: string; englishName: string}};
type Edition = {edition: {identifier: string; language: string}; ayahs: CloudAyah[]};
/** The Uthmani edition is only a fallback for quran.com's text (getUthmani); clean it so it still reads right. */
const cleanEd = (e: Edition): Edition => e.edition?.identifier === 'quran-uthmani' ? {...e, ayahs: e.ayahs.map(x => ({...x, text: fixTanzil(x.text)}))} : e;
export const getSurahEditions = (n: number, ids: string[]) => editions('chapter', n, ids);
export const getJuzEdition = async (j: number, id: string) => (await editions('juz', j, [id]))[0];
export const getPageEdition = async (p: number, id: string) => (await editions('page', p, [id]))[0];
export async function getAyahEditions(s: number, a: number, ids: string[]): Promise<(CloudAyah & {edition: {identifier: string}})[]> {
  return (await editions('verse', `${s}:${a}`, ids)).map(e => ({...e.ayahs[0], edition: e.edition}));
}

/**
 * Arabic and translations for a surah/juz/page/ayah, in AlQuran Cloud's shape. Quran Foundation is the main source;
 * tajweed and translations it doesn't carry come from AlQuran Cloud. Whatever one source fails to give, the other fills
 * (from Quran Foundation, tajweed is plain Uthmani and a missing translation reads QF_MISSING). Throws only if both fail.
 */
async function editions(kind: IPKind, id: string | number, ids: string[]): Promise<Edition[]> {
  const viaQf = ids.filter(e => e === 'quran-uthmani' || QF_TRANS[e]), viaCloud = ids.filter(e => !viaQf.includes(e));
  const warn = (src: string) => (e: Error) => { console.warn(`${src} failed for ${kind} ${id} (${e.message}); using the other source`); return null; };
  const [qf, cloud] = await Promise.all([
    viaQf.length ? qfEditions(kind, id, viaQf).catch(warn('Quran Foundation')) : [],
    viaCloud.length ? cloudEditions(kind, id, viaCloud).catch(warn('AlQuran Cloud')) : [],
  ]);
  const got = new Map([...qf ?? [], ...cloud ?? []].map(e => [e.edition.identifier, e]));
  const missing = ids.filter(e => !got.has(e));
  if (missing.length) (qf === null ? await cloudEditions(kind, id, missing) : await qfEditions(kind, id, missing)).forEach(e => got.set(e.edition.identifier, e));
  return ids.map(e => got.get(e)!);
}
async function cloudEditions(kind: IPKind, id: string | number, ids: string[]): Promise<Edition[]> {
  if (kind === 'chapter') return (await cloudJSON<{data: Edition[]}>(`/surah/${id}/editions/${ids.join(',')}`)).data.map(cleanEd);
  if (kind === 'verse') return (await cloudJSON<{data: (CloudAyah & {edition: {identifier: string; language: string}})[]}>(`/ayah/${id}/editions/${ids.join(',')}`)).data
    .map(({edition, ...ay}) => cleanEd({edition, ayahs: [ay]}));
  return Promise.all(ids.map(async e => cleanEd((await cloudJSON<{data: Edition}>(`/${kind}/${id}/${e}`)).data)));
}

/** AlQuran Cloud translation ids → Quran Foundation's. These load from Quran Foundation; others from AlQuran Cloud. */
const QF_TRANS: Record<string, number> = {
  'ur.jalandhry': 234, 'ur.junagarhi': 54, 'ur.maududi': 97,
  'en.sahih': 20, 'en.pickthall': 19, 'en.yusufali': 22, 'en.hilali': 203, 'en.maududi': 95, 'en.transliteration': 57,
};
export const QF_MISSING = 'This translation is temporarily unavailable.';
type QFVerse = {id: number; verse_number: number; verse_key: string; page_number: number; juz_number: number; qpc_uthmani_hafs?: string; translations?: {resource_id: number; text: string}[]};
/** Quran Foundation translation text without its footnote markers and tags. */
const qfPlain = (t: string) => t.replace(/<sup[^>]*>[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
/**
 * Editions in AlQuran Cloud's shape, built from Quran Foundation. Its ayah `id` is the ayah's number across the whole
 * Quran and its pages follow the same 604-page Madani layout. Tajweed comes back as plain Uthmani (no colours).
 */
async function qfEditions(kind: IPKind, id: string | number, ids: string[]): Promise<Edition[]> {
  const tr = [...new Set(ids.map(x => QF_TRANS[x]).filter(Boolean))];
  const q = `fields=qpc_uthmani_hafs${tr.length ? '&translations=' + tr.join(',') : ''}`;
  const vs: QFVerse[] = [];
  if (kind === 'verse') vs.push((await getJSON<{verse: QFVerse}>(`${API.quranCom}/verses/by_key/${id}?${q}`)).verse);
  else for (let page = 1; page; ){
    const d = await getJSON<{verses: QFVerse[]; pagination?: {next_page: number | null}}>(`${API.quranCom}/verses/by_${kind}/${id}?${q}&per_page=1000&page=${page}`);
    vs.push(...(d.verses || [])); page = d.pagination?.next_page || 0;
  }
  if (!vs.length) throw new Error('Quran Foundation returned no ayahs');
  return ids.map(e => ({
    edition: {identifier: e, language: e.startsWith('quran') ? 'ar' : e.split('.')[0]},
    ayahs: vs.map(v => {
      const s = +v.verse_key.split(':')[0], t = v.translations?.find(x => x.resource_id === QF_TRANS[e])?.text;
      return {number: v.id, numberInSurah: v.verse_number, juz: v.juz_number, page: v.page_number, surah: {number: s, name: SURAHS[s - 1].ar, englishName: SURAHS[s - 1].en},
        text: e.startsWith('quran') ? (v.qpc_uthmani_hafs || '').replace(/\s*[٠-٩]+$/, '').trim() : t != null ? qfPlain(t) : QF_MISSING};
    }),
  }));
}

/**
 * Indo-Pak text from quran.com. Backup: fawazahmed0 quran-api. Returns map "s:a" -> text.
 * `nastaleeq` (default) is the edition quran.com's reader shows with the Indo-Pak font: Urdu-style spelling, and each ayah
 * ends with the font's own ayah-end token (۟ + number glyph + waqf/rukuh signs). Many of its marks, and a few letters and
 * words, are private-use glyphs, so it can't be copied; `legacy` (text_indopak) is plain enough to copy (see plainIP).
 */
export type IPKind = 'chapter' | 'juz' | 'page' | 'verse';
const versesQuery = (kind: IPKind, id: string | number) => ({chapter: `chapter_number=${id}`, juz: `juz_number=${id}`, page: `page_number=${id}`, verse: `verse_key=${id}`}[kind]);
/**
 * quran.com's QPC Uthmani Hafs text, map "s:a" -> text (no Bismillah on ayah 1). This is the Arabic the site shows, in
 * the KFGQPC Hafs font quran.com pairs it with. Pause marks sit on their word, so its words are numbered like quran.com's
 * word data and QUL's (related ayahs). The API ends each ayah with its number, which is dropped here (AyahText adds it).
 */
export async function getUthmani(kind: IPKind, id: string | number): Promise<Record<string, string>> {
  type V = {verse_key: string; qpc_uthmani_hafs: string};
  const vs: V[] = [];
  if (kind === 'verse') vs.push((await getJSON<{verse: V}>(`${API.quranCom}/verses/by_key/${id}?fields=qpc_uthmani_hafs`)).verse);
  else for (let page = 1; page; ){
    const d = await getJSON<{verses: V[]; pagination?: {next_page: number | null}}>(`${API.quranCom}/verses/by_${kind}/${id}?fields=qpc_uthmani_hafs&per_page=1000&page=${page}`);
    vs.push(...(d.verses || [])); page = d.pagination?.next_page || 0;
  }
  if (!vs.length || !vs[0]?.qpc_uthmani_hafs) throw new Error('empty');
  return Object.fromEntries(vs.map(v => [v.verse_key, v.qpc_uthmani_hafs.replace(/\s*[٠-٩]+$/, '').trim()]));
}
export type IPEdition = 'nastaleeq' | 'legacy';
export async function getIndoPak(kind: IPKind, id: string | number, edition: IPEdition = 'nastaleeq'): Promise<Record<string, string>> {
  const q = versesQuery(kind, id);
  const field = edition === 'nastaleeq' ? 'text_indopak_nastaleeq' : 'text_indopak';
  try{
    const d = await getJSON<{verses: ({verse_key: string} & Record<string, string>)[]}>(`${API.quranCom}/quran/verses/${field.slice(5)}?${q}`);
    if (!d.verses?.length) throw new Error('empty');
    return Object.fromEntries(d.verses.map(v => [v.verse_key, cleanIP(v[field])]));
  }catch(e){
    if (kind === 'page') throw e;
    const url = kind === 'chapter' ? `${API.ipBackup}/${id}.json` : kind === 'juz' ? `${API.ipBackup}/juzs/${id}.json` : `${API.ipBackup}/${String(id).replace(':', '/')}.json`;
    const d = await getJSON<{chapter?: V[]; juzs?: V[]} & Partial<V>>(url);
    type V = {chapter: number; verse: number; text: string};
    const list: V[] = d.chapter || d.juzs || [d as V];
    return Object.fromEntries(list.map(v => [`${v.chapter}:${v.verse}`, cleanIP(v.text)]));
  }
}

/** Word-by-word data from quran.com (meanings, transliteration, Indo-Pak word text). Map "s:a" -> words. */
export async function getWords(kind: 'chapter' | 'juz' | 'page', id: number, lang: string): Promise<Map<string, QWord[]>> {
  const m = new Map<string, QWord[]>();
  for (let page = 1; page; ){
    const d = await getJSON<{verses: {verse_key: string; words: (QWord & {char_type_name: string})[]}[]; pagination?: {next_page: number | null}}>(
      `${API.quranCom}/verses/by_${kind}/${id}?words=true&language=${lang}&word_fields=text_indopak&per_page=300&page=${page}`);
    (d.verses || []).forEach(v => m.set(v.verse_key, (v.words || []).filter(w => w.char_type_name === 'word')));
    page = d.pagination?.next_page || 0;
  }
  return m;
}
export async function getVerseWords(s: number, a: number, lang: string): Promise<QWord[]> {
  const d = await getJSON<{verse?: {words: (QWord & {char_type_name: string})[]}}>(`${API.quranCom}/verses/by_key/${s}:${a}?words=true&language=${lang}&word_fields=text_uthmani,text_indopak`);
  return (d.verse?.words || []).filter(w => w.char_type_name === 'word');
}

/** Quranic Arabic Corpus morphology (GPL). The file is large, so it is parsed once per server instance. */
export type MSeg = {text: string; pos: string; tags: string[]};
let morphP: Promise<Map<string, MSeg[]>> | null = null;
export function getMorph(): Promise<Map<string, MSeg[]>> {
  if (!morphP){
    morphP = fetch(API.morph, {cache: 'no-store'}).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); }).then(txt => {
      const m = new Map<string, MSeg[]>();
      for (const line of txt.split('\n')){
        const c = line.split('\t'); if (c.length < 4 || !/^\d+:\d+:\d+:\d+$/.test(c[0])) continue;
        const [s, a, w] = c[0].split(':'), key = `${s}:${a}:${w}`;
        if (!m.has(key)) m.set(key, []);
        m.get(key)!.push({text: c[1], pos: c[2], tags: c[3].split('|')});
      }
      return m;
    }).catch(e => { morphP = null; throw e; });
  }
  return morphP;
}

/** The curated catalogue's approved tafseers; without a database, the API's list minus known-broken editions. */
export async function getTafsirEditions(): Promise<TafsirEdition[]> {
  const cat = await catalogTafsirs();
  if (cat?.length) return cat;
  let list: TafsirEdition[];
  try{
    const d = await tafsirJSON<TafsirEdition[]>('/editions.json');
    list = d.filter(e => /english|urdu|arabic/i.test(e.language_name) && !TAFSIR_HIDE.has(e.slug)).map(e => TAFSIR_RENAME[e.slug] ? {...e, name: TAFSIR_RENAME[e.slug]} : e);
    if (!list.length) throw new Error('empty');
  }catch{ list = FALLBACK_TAFSIR.filter(e => e.slug !== QE_SLUG); }
  return [QE_EDITION, ...list.filter(e => e.slug !== QE_SLUG).map(nativeName)];
}
/** Tafseer text for one ayah ('' when the work has no note for it). */
export async function getTafsirText(slug: string, s: number, a: number): Promise<string> {
  if (slug === QE_SLUG){
    const d = await getJSON<{result?: {translation?: string; footnotes?: string}}>(`${API.quranEnc}/translation/aya/urdu_junagarhi/${s}/${a}`);
    const tr = (d.result?.translation || '').trim(), notes = (d.result?.footnotes || '').trim();
    if (!tr && !notes) return '';
    return `ترجمہ: ${tr}` + (notes ? `\n\nتفسیری حواشی:\n${notes}` : '\n\n(اس آیت پر کوئی حاشیہ نہیں)');
  }
  if (!/^[a-z0-9-]+$/i.test(slug)) throw new Error('bad slug');
  try{ return (await tafsirJSON<{text?: string}>(`/${slug}/${s}/${a}.json`)).text || ''; }
  catch(e){ if (e instanceof HttpError && e.status === 404) return ''; throw e; }
}

/**
 * The tafseer part of an eQuranLibrary ayah page (the curator-approved link URL), as simple HTML paragraphs.
 * Their page has no API; the note is the `whitespace-pre-line` block in the section headed "Tafseer · <work>"
 * (pages with no note for the ayah have no such section).
 */
export async function getEqlTafsir(url: string): Promise<string> {
  const r = await fetch(url, {next: {revalidate: REVALIDATE}, signal: AbortSignal.timeout(15000)});
  if (!r.ok) throw new HttpError(r.status, url);
  const m = (await r.text()).match(/>Tafseer · [\s\S]*?<div class="[^"]*\bwhitespace-pre-line\b[^"]*">([\s\S]*?)<\/div>\s*<\/section>/);
  if (!m) return '';
  return paras(m[1]
    .replace(/<big>([\s\S]*?)<\/big>/g, '<b>$1</b>')   // headings like خلاصہ تفسیر (in a coloured span)
    .replace(/<\/?span\b[^>]*>/g, ''))                  // colour and Arabic-run spans; the client marks Quran runs itself
    .replace(/<p>(\d+)\s+/g, '<p><sup>$1</sup> ');      // footnote numbers opening a note (Usmani etc.)
}

/** Plain text with line breaks (and maybe <br>) as <p> paragraphs. */
const paras = (t: string) => t.split(/\s*(?:\n|<br\s*\/?>)\s*/).filter(p => p.replace(/<[^>]+>/g, '').trim()).map(p => `<p>${p}</p>`).join('');

/** QuranoHadith's titles in Urdu script: [name, author]. Titles not listed keep the site's English. */
const QOH_NATIVE: Record<string, [string, string]> = {
  'Tafseer Ibn-e-Kaseer': ['تفسیر ابن کثیر', 'حافظ ابن کثیر'],
  'Ahsan ul Bayan': ['احسن البیان', 'حافظ صلاح الدین یوسف'],
  'Taiseer ul Quran': ['تیسیر القرآن', 'مولانا عبدالرحمٰن کیلانی'],
  'Tafseer al Quran': ['تفسیر القرآن الکریم', 'حافظ عبدالسلام بھٹوی'],
  'Maariful Quran': ['معارف القرآن', 'مفتی محمد شفیع'],
  'Mufradat ul Quran': ['مفردات القرآن', 'امام راغب اصفہانی'],
  'Ahkam ul Quran': ['احکام القرآن', 'امام ابوبکر جصاص'],
  'Bayan ul Quran': ['بیان القرآن', 'ڈاکٹر اسرار احمد'],
  'Tafheem ul Quran': ['تفہیم القرآن', 'سید ابوالاعلیٰ مودودی'],
  'Aasan Tarjuma e Quran': ['آسان ترجمۂ قرآن', 'مفتی محمد تقی عثمانی'],
};
export type QohTafsir = {name: string; author: string; text: string};
/**
 * The tafseers on a QuranoHadith ayah page (the approved link URL) that have a note for this ayah. No API: each work
 * is a `div.alert` with an h5 title, h6 author and a <p> of plain text. Ibn Abbas is left out (weak chain, as elsewhere).
 */
export async function getQohTafsirs(url: string): Promise<QohTafsir[]> {
  const src = url.replace(/^https:\/\/quranohadith\.com/, API.qoh);
  // the site's firewall turns away requests without a browser-like user agent
  const r = await fetch(src, {next: {revalidate: REVALIDATE}, signal: AbortSignal.timeout(20000),
    headers: {'User-Agent': 'Mozilla/5.0 (compatible; ConnectingQuran/1.0)'}});
  if (!r.ok) throw new HttpError(r.status, src);
  const re = /<div class="alert alert-light[^"]*"[^>]*>\s*<h5 class="m-0">([^<]*)<\/h5>\s*<h6 class="m-0 small">([^<]*)<\/h6>\s*<hr>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/g;
  return [...(await r.text()).matchAll(re)]
    .map(([, t, by, body]) => { const title = t.trim(), [name, author] = QOH_NATIVE[title] ?? [title, by.trim().replace(/^by\s+/i, '')]; return {name, author, text: paras(body.trim())}; })
    .filter(x => x.text && !/ibn[- ]e[- ]abbas/i.test(x.name));
}

export type SearchMatch = {s: number; a: number; sname: string; text: string};
/**
 * Quran Foundation first; AlQuran Cloud when QF fails, finds nothing, or lacks the translation (AlQuran Cloud matches
 * exact words, so it can still find what QF's looser search misses).
 */
export async function searchQuran(term: string, edition: string): Promise<{count: number; matches: SearchMatch[]}> {
  let qf: {count: number; matches: SearchMatch[]} | null = null;
  try{ qf = await qfSearch(term, edition); if (qf.matches.length) return qf; }
  catch(e){ console.warn(`Quran Foundation search failed (${(e as Error).message}); using AlQuran Cloud`); }
  try{
    const d = await cloudJSON<{code: number; data: {count: number; matches: {text: string; numberInSurah: number; surah: {number: number; englishName: string}}[]}}>(
      `/search/${encodeURIComponent(term)}/all/${encodeURIComponent(edition)}`, 3600);
    return {count: d.data.count, matches: d.data.matches.map(m => ({s: m.surah.number, a: m.numberInSurah, sname: SURAHS[m.surah.number - 1]?.en || m.surah.englishName, text: m.text}))};
  }catch(e){
    // AlQuran Cloud answers 404 for "no matches"; if it's down, QF's empty answer stands
    if ((e instanceof HttpError && e.status === 404) || qf) return {count: 0, matches: []};
    throw e;
  }
}
/** Search on Quran Foundation (looser matching than AlQuran Cloud's exact words): first 100 results. */
async function qfSearch(term: string, edition: string): Promise<{count: number; matches: SearchMatch[]}> {
  const ar = edition.startsWith('quran'), tr = QF_TRANS[edition];
  if (!ar && !tr) throw new Error(`no Quran Foundation copy of ${edition}`);
  type R = {verse_key: string; text: string; translations?: {resource_id: number; text: string}[]};
  // a translation search needs its language, or QF only matches the Arabic
  const get = (page: number) => getJSON<{search: {total_results: number; results: R[]}}>(
    `${API.quranCom}/search?q=${encodeURIComponent(term)}&size=50&page=${page}${ar ? '' : `&language=${edition.split('.')[0]}&translations=${tr}`}`, 3600);
  const first = await get(1), results = [...first.search.results];
  if (first.search.total_results > 50) results.push(...(await get(2).catch(() => null))?.search.results ?? []);
  // a translation search keeps only results that came with that translation (QF also matches on the Arabic)
  const matches = results.map(r => {
    const [s, a] = r.verse_key.split(':').map(Number), t = r.translations?.find(x => x.resource_id === tr)?.text;
    return {s, a, sname: SURAHS[s - 1]?.en || `Surah ${s}`, text: ar ? r.text : t ? qfPlain(t) : ''};
  }).filter(m => m.text);
  return {count: matches.length < results.length ? matches.length : first.search.total_results, matches};
}
