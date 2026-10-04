/** Builds what each page shows, from the reader's settings (read on the server from the settings cookie). */
import {BISM_UTH} from './meta';
import {getIndoPak, getJuzEdition, getPageEdition, getSurahEditions, getSurahList, getTransEditions, getWords, transMeta, getAyahEditions, type CloudAyah} from './quran';
import type {Settings} from './settings';
import {buildWords, plainTokens, stripBismillah, tajweedTokens, type WordItem} from './text';

export type TransText = {name: string; lang: string; dir: 'rtl' | 'ltr'; text: string};
export type AyahView = {s: number; a: number; n: number; sname: string; ar: string; words: WordItem[]; trans: TransText[]; juz?: number; page?: number};
export type ViewMeta = {ip: boolean; tajweed: boolean; bism: string; trans: {id: string; name: string}[]};

async function ipText(kind: 'chapter' | 'juz' | 'page', id: number){
  try{ return await getIndoPak(kind, id); }catch{ return null; }
}
async function bismFor(ip: boolean){
  if (!ip) return BISM_UTH;
  try{ return (await getIndoPak('verse', '1:1'))['1:1'] || BISM_UTH; }catch{ return BISM_UTH; }
}
function makeAyahs(ar: CloudAyah[], tj: CloudAyah[] | null, ip: Record<string, string> | null, words: Map<string, import('./text').QWord[]> | null,
                   trans: {meta: ReturnType<typeof transMeta>; ayahs: CloudAyah[]}[], st: Settings, sname?: (a: CloudAyah) => string): AyahView[] {
  return ar.map((ay, i) => {
    const s = ay.surah?.number, a = ay.numberInSurah, key = `${s}:${a}`;
    const ref = stripBismillah(ay.text, s, a);
    const ipT = ip?.[key];
    const toks = ipT ? plainTokens(ipT) : tj?.[i] ? tajweedTokens(tj[i].text, s, a) : plainTokens(ref);
    return {
      s, a, n: ay.number, juz: ay.juz, page: ay.page, sname: sname ? sname(ay) : ay.surah.englishName,
      ar: ipT || ref,
      words: buildWords(toks, ref, words?.get(key) || null, !!ipT, st.wbw),
      trans: trans.map(t => ({...t.meta, text: t.ayahs[i]?.text || ''})),
    };
  });
}

export async function surahView(n: number, st: Settings){
  const [surahs, eds] = await Promise.all([getSurahList(), getTransEditions()]);
  const ipOn = st.script === 'indopak', tjOn = st.tajweed && !ipOn;
  const ids = ['quran-uthmani', ...(tjOn ? ['quran-tajweed'] : []), ...st.trans];
  const [data, ip, words, bism] = await Promise.all([
    getSurahEditions(n, ids), ipOn ? ipText('chapter', n) : null,
    (st.wbw || ipOn) ? getWords('chapter', n, st.wbwLang).catch(() => null) : null, bismFor(ipOn),
  ]);
  const ar = data[0].ayahs.map(x => ({...x, surah: x.surah || {number: n, name: '', englishName: ''}}));
  ar.forEach(x => { x.surah = {number: n, name: surahs[n - 1].ar, englishName: surahs[n - 1].en}; });
  const tj = tjOn ? data[1].ayahs : null;
  const tr = data.slice(tjOn ? 2 : 1).map(d => ({meta: transMeta(eds, d.edition.identifier), ayahs: d.ayahs}));
  return {
    info: surahs[n - 1], surahs,
    meta: {ip: !!ip, tajweed: tjOn && !ip, bism: ip ? bism : BISM_UTH, trans: tr.map(t => ({id: t.meta.id, name: t.meta.name}))} as ViewMeta,
    ayahs: makeAyahs(ar, ip ? null : tj, ip, words, tr, st, () => surahs[n - 1].en),
  };
}

export async function juzView(j: number, st: Settings){
  const [surahs, eds] = await Promise.all([getSurahList(), getTransEditions()]);
  const ipOn = st.script === 'indopak', tjOn = st.tajweed && !ipOn;
  const ids = ['quran-uthmani', ...(tjOn ? ['quran-tajweed'] : []), ...st.trans];
  const [parts, ip, words, bism] = await Promise.all([
    Promise.all(ids.map(id => getJuzEdition(j, id))), ipOn ? ipText('juz', j) : null,
    (st.wbw || ipOn) ? getWords('juz', j, st.wbwLang).catch(() => null) : null, bismFor(ipOn),
  ]);
  const tj = tjOn ? parts[1].ayahs : null;
  const tr = parts.slice(tjOn ? 2 : 1).map(d => ({meta: transMeta(eds, d.edition.identifier), ayahs: d.ayahs}));
  return {
    surahs,
    meta: {ip: !!ip, tajweed: tjOn && !ip, bism: ip ? bism : BISM_UTH, trans: tr.map(t => ({id: t.meta.id, name: t.meta.name}))} as ViewMeta,
    ayahs: makeAyahs(parts[0].ayahs, ip ? null : tj, ip, words, tr, st),
  };
}

export async function mushafView(p: number, st: Settings){
  const surahs = await getSurahList();
  const ipOn = st.script === 'indopak', tjOn = st.tajweed && !ipOn;
  const [uth, ip, tj, words, bism] = await Promise.all([
    getPageEdition(p, 'quran-uthmani'), ipOn ? ipText('page', p) : null,
    tjOn ? getPageEdition(p, 'quran-tajweed').catch(() => null) : null,
    (st.wbw || ipOn) ? getWords('page', p, st.wbwLang).catch(() => null) : null, bismFor(ipOn),
  ]);
  return {
    surahs,
    meta: {ip: !!ip, tajweed: !!tj && !ip, bism: ip ? bism : BISM_UTH, trans: []} as ViewMeta,
    ayahs: makeAyahs(uth.ayahs, ip ? null : tj?.ayahs || null, ip, words, [], st, ay => surahs[ay.surah.number - 1]?.en || ay.surah.englishName),
    surahArNames: uth.ayahs.map(a => a.surah.name),
  };
}

/** The ayah shown at the top of the Tafseer page. */
export async function ayahQuote(s: number, a: number, st: Settings){
  const [eds, d, ip] = await Promise.all([
    getTransEditions(), getAyahEditions(s, a, ['quran-uthmani', ...st.trans.slice(0, 2)]),
    st.script === 'indopak' ? getIndoPak('verse', `${s}:${a}`).catch(() => null) : null,
  ]);
  return {ar: ip?.[`${s}:${a}`] || stripBismillah(d[0].text, s, a), ip: !!ip?.[`${s}:${a}`], trans: d.slice(1).map(t => ({...transMeta(eds, t.edition.identifier), text: t.text}))};
}
