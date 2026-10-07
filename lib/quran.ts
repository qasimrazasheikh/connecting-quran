/** Server-side data access. Every external call goes through here and is cached (see REVALIDATE). */
import {API, REVALIDATE} from './config';
import {FALLBACK_TAFSIR, FALLBACK_TRANS, QE_EDITION, QE_SLUG, TAFSIR_HIDE, TAFSIR_RENAME, type TafsirEdition, type TransEdition} from './meta';
import {cleanIP, type QWord} from './text';

class HttpError extends Error { constructor(public status: number, url: string){ super(`HTTP ${status} for ${url}`); } }
async function getJSON<T>(url: string, revalidate = REVALIDATE): Promise<T> {
  const r = await fetch(url, {next: {revalidate}});
  if (!r.ok) throw new HttpError(r.status, url);
  return r.json() as Promise<T>;
}

export type SurahInfo = {n: number; ar: string; en: string; mean: string; ayahs: number; type: string};
export async function getSurahList(): Promise<SurahInfo[]> {
  const d = await getJSON<{data: {number: number; name: string; englishName: string; englishNameTranslation: string; numberOfAyahs: number; revelationType: string}[]}>(`${API.quranCloud}/surah`);
  return d.data.map(s => ({n: s.number, ar: s.name, en: s.englishName, mean: s.englishNameTranslation, ayahs: s.numberOfAyahs, type: s.revelationType}));
}
export async function getTransEditions(): Promise<TransEdition[]> {
  try{
    const d = await getJSON<{data: TransEdition[]}>(`${API.quranCloud}/edition?format=text&type=translation`);
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
export async function getSurahEditions(n: number, ids: string[]): Promise<Edition[]> {
  return (await getJSON<{data: Edition[]}>(`${API.quranCloud}/surah/${n}/editions/${ids.join(',')}`)).data;
}
export async function getJuzEdition(j: number, id: string): Promise<Edition> {
  return (await getJSON<{data: Edition}>(`${API.quranCloud}/juz/${j}/${id}`)).data;
}
export async function getPageEdition(p: number, id: string): Promise<Edition> {
  return (await getJSON<{data: Edition}>(`${API.quranCloud}/page/${p}/${id}`)).data;
}
export async function getAyahEditions(s: number, a: number, ids: string[]): Promise<(CloudAyah & {edition: {identifier: string}})[]> {
  return (await getJSON<{data: (CloudAyah & {edition: {identifier: string}})[]}>(`${API.quranCloud}/ayah/${s}:${a}/editions/${ids.join(',')}`)).data;
}

/**
 * Indo-Pak text from quran.com. Backup: fawazahmed0 quran-api. Returns map "s:a" -> text.
 * `nastaleeq` (default) is the edition quran.com's reader shows with the Indo-Pak font: Urdu-style spelling, and each ayah
 * ends with the font's own ayah-end token (۟ + number glyph + waqf/rukuh signs). Many of its marks, and a few letters and
 * words, are private-use glyphs, so it can't be copied; `legacy` (text_indopak) is plain enough to copy (see plainIP).
 */
export type IPKind = 'chapter' | 'juz' | 'page' | 'verse';
export type IPEdition = 'nastaleeq' | 'legacy';
export async function getIndoPak(kind: IPKind, id: string | number, edition: IPEdition = 'nastaleeq'): Promise<Record<string, string>> {
  const q = {chapter: `chapter_number=${id}`, juz: `juz_number=${id}`, page: `page_number=${id}`, verse: `verse_key=${id}`}[kind];
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

export async function getTafsirEditions(): Promise<TafsirEdition[]> {
  let list: TafsirEdition[];
  try{
    const d = await getJSON<TafsirEdition[]>(`${API.tafsir}/editions.json`);
    list = d.filter(e => /english|urdu|arabic/i.test(e.language_name) && !TAFSIR_HIDE.has(e.slug)).map(e => TAFSIR_RENAME[e.slug] ? {...e, name: TAFSIR_RENAME[e.slug]} : e);
    if (!list.length) throw new Error('empty');
  }catch{ list = FALLBACK_TAFSIR.filter(e => e.slug !== QE_SLUG); }
  return [QE_EDITION, ...list.filter(e => e.slug !== QE_SLUG)];
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
  try{ return (await getJSON<{text?: string}>(`${API.tafsir}/${slug}/${s}/${a}.json`)).text || ''; }
  catch(e){ if (e instanceof HttpError && e.status === 404) return ''; throw e; }
}

export type SearchMatch = {s: number; a: number; sname: string; text: string};
export async function searchQuran(term: string, edition: string): Promise<{count: number; matches: SearchMatch[]}> {
  try{
    const d = await getJSON<{code: number; data: {count: number; matches: {text: string; numberInSurah: number; surah: {number: number; englishName: string}}[]}}>(
      `${API.quranCloud}/search/${encodeURIComponent(term)}/all/${encodeURIComponent(edition)}`, 3600);
    return {count: d.data.count, matches: d.data.matches.map(m => ({s: m.surah.number, a: m.numberInSurah, sname: m.surah.englishName, text: m.text}))};
  }catch(e){ if (e instanceof HttpError && e.status === 404) return {count: 0, matches: []}; throw e; }
}
