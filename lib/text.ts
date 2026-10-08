/** Pure text helpers shared by server and client. */
export const HAS_LETTER = /[ء-يٱ-ۓ]/;
export const wordCount = (t: string) => String(t).split(' ').filter(x => HAS_LETTER.test(x)).length;
export function stripBismillah(text: string, surah: number, ayah: number) {
  if (surah === 1 || ayah !== 1) return text;
  const t = text.replace(/^﻿/, '');
  return /^بِس[ْۡ]?مِ/.test(t) ? t.split(' ').slice(4).join(' ') : t;
}
/** Indo-Pak text cleanup: hidden direction marks / zero-width spaces split words; backup source has marks the font can't draw. */
export const cleanIP = (t: string) => String(t || '')
  .replace(/[​‎‏﻿]/g, '').replace(/[  ]/g, ' ')
  .replace(/[٘ࣔ-࣢]/g, '').replace(/ {2,}/g, ' ').trim();
/**
 * Indo-Pak text for the clipboard: quran.com draws some marks with private-use characters only its Indo-Pak font has
 * (other apps show them as boxes). Map the alternate vowel forms back to standard Unicode and drop the font-only
 * waqf signs (ز ص ق قف وقفة, small-circle stop) and the rukuh ع, which have no standard Unicode equivalent.
 */
/** quran.com's Indo-Pak Nastaleeq text ends each ayah with a token the font draws as the ayah-end marker (۟ + number glyph + waqf signs). */
export const IP_END = /^۟/;
/** Text without that ayah-end token (e.g. the Bismillah shown above a surah). */
export const ipBody = (t: string) => String(t || '').replace(/\s*۟\S*$/, '').trim();
export const plainIP = (t: string) => String(t || '')
  .replace(//g, 'ٖ').replace(//g, 'ٗ').replace(/ﺎ/g, 'ا')
  .replace(/ ?[-]/g, '').replace(/ {2,}/g, ' ').trim();

export type Seg = {c?: string; t: string};
export type Tok = {text: string; segs: Seg[]};
export const plainTokens = (text: string): Tok[] => String(text).split(' ').filter(Boolean).map(t => ({text: t, segs: [{t}]}));
/** Tajweed edition markup: [x[text] or [x:123[text] (x = rule code). Rules can run across spaces. */
export function tajweedTokens(raw: string, s: number, a: number): Tok[] {
  const segs: Seg[] = []; let last = 0; const re = /\[([a-z])(?::\d+)?\[([^\]]*)\]/g; let m: RegExpExecArray | null;
  while ((m = re.exec(raw))){ if (m.index > last) segs.push({t: raw.slice(last, m.index)}); segs.push({c: m[1], t: m[2]}); last = re.lastIndex; }
  if (last < raw.length) segs.push({t: raw.slice(last)});
  const toks: Tok[] = []; let cur: Tok = {text: '', segs: []};
  segs.forEach(sg => sg.t.split(' ').forEach((piece, i) => {
    if (i > 0){ toks.push(cur); cur = {text: '', segs: []}; }
    if (piece){ cur.text += piece; cur.segs.push(sg.c ? {c: sg.c, t: piece} : {t: piece}); }
  }));
  toks.push(cur);
  let out = toks.filter(t => t.text !== '');
  if (s !== 1 && a === 1 && out[0] && /^بِس/.test(out[0].text.replace(/^﻿/, ''))) out = out.slice(4);
  return out;
}

/** One rendered item in an ayah: a tappable word (word number `n`, or token number when `byToken`) or a plain mark. */
export type WordItem = {k: 'w'; n: number; byToken?: boolean; toks: Tok[]; m?: string} | {k: 'x'; tok: Tok};
export type QWord = {text_indopak?: string; translation?: {text?: string}; transliteration?: {text?: string}};
/**
 * Group tokens into words that match the grammar data's word numbers.
 * Indo-Pak text can split a word ("وَ هُوَ"); quran.com's Indo-Pak word list tells us how to regroup.
 */
export function buildWords(tokens: Tok[], ref: string | null, words: QWord[] | null, ipMode: boolean, wbw: boolean): WordItem[] {
  const letterIdx = tokens.map((t, i) => HAS_LETTER.test(t.text) ? i : -1).filter(i => i >= 0);
  let groups: number[][] | null = null;
  // regroup only when the Indo-Pak text splits words differently (the word list's text_indopak is the legacy edition,
  // so its split only helps there; the Nastaleeq edition almost always has one token per word)
  if (words && ipMode && ref && wordCount(ref) !== letterIdx.length){
    const sizes = words.map(w => Math.max(1, wordCount(cleanIP(w.text_indopak || ''))));
    if (sizes.reduce((x, y) => x + y, 0) === letterIdx.length){ let k = 0; groups = sizes.map(n => letterIdx.slice(k, k += n)); }
  }
  let byToken = false;
  if (!groups){ groups = letterIdx.map(i => [i]); if (ref && wordCount(ref) !== letterIdx.length) byToken = true; }
  const startOf = new Map(groups.map((g, n) => [g[0], n]));
  const inGroup = new Set(groups.flat());
  const out: WordItem[] = [];
  tokens.forEach((t, i) => {
    if (startOf.has(i)){
      const n = startOf.get(i)!, g = groups![n], w = words && !byToken ? words[n] : null;
      out.push({k: 'w', n: n + 1, byToken: byToken || undefined, toks: g.map(j => tokens[j]), m: wbw && w?.translation?.text ? w.translation.text : undefined});
    } else if (!inGroup.has(i)){
      // Indo-Pak waqf signs are separate tokens; keep each with the word before it (as quran.com does) so it sits over
      // that word instead of floating between word boxes. The ayah-end marker stays on its own.
      const prev = out[out.length - 1];
      if (ipMode && prev?.k === 'w' && !IP_END.test(t.text)) prev.toks = [...prev.toks, t];
      else out.push({k: 'x', tok: t});
    }
  });
  return out;
}
export const AR_DIAC = /[ً-ٰٟۖ-ۭـ]/g;
