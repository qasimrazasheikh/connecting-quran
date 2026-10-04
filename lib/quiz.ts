/** Builds a 10-question quiz for a surah section from the Quran text, a translation, word meanings and grammar. */
import {QUIZ_LEN, QUIZ_PART} from './meta';
import {HAS_LETTER} from './text';
export type QuizData = {ayahs: {a: number; text: string}[]; transLang: string; trans: Record<string, string>; words: Record<string, string[]>; gram: Record<string, [string, string]> | null};
export type Question = {type: string; prompt: string; promptRef?: string; word?: string; arTokens?: string[]; blank?: number; trans?: string; transUr?: boolean; opts: string[]; ans: string; optCls: '' | 'ar' | 'ur'; ref: number};
export const quizParts = (n: number) => { const out: [number, number][] = []; for (let f = 1; f <= n; f += QUIZ_PART) out.push([f, Math.min(n, f + QUIZ_PART - 1)]); return out; };
const shuffle = <T,>(a: T[]) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pickN = <T,>(a: T[], n: number) => shuffle(a).slice(0, n);
const letters = (t: string) => t.replace(/[^ء-يٱ-ۓ]/g, '').length;
export function buildQuiz(d: QuizData, n: number, from: number, to: number, meaningLang: string): Question[] {
  const inRange = d.ayahs.filter(x => x.a >= from && x.a <= to);
  const toks = (x: {text: string}) => x.text.split(' ').filter(t => HAS_LETTER.test(t));
  type P = {a: number; w: number; ar: string; mean: string; pos: string; root: string};
  const pool: P[] = [];
  inRange.forEach(x => { const ws = d.words[String(x.a)] || []; toks(x).forEach((t, i) => { const g = d.gram?.[`${x.a}:${i + 1}`]; pool.push({a: x.a, w: i + 1, ar: t, mean: (ws[i] || '').trim(), pos: g?.[0] || '', root: g?.[1] || ''}); }); });
  const used = new Set<string>();
  const uniq = <T,>(arr: T[], key: (x: T) => string) => { const seen = new Set<string>(); return arr.filter(x => { const k = key(x); if (!k || seen.has(k)) return false; seen.add(k); return true; }); };
  const meanPool = uniq(pool.filter(p => letters(p.ar) >= 3 && p.mean && p.mean.length <= 40 && !/^[([]/.test(p.mean)), p => p.mean);
  const allMeans = uniq(pool.filter(p => p.mean), p => p.mean).map(p => p.mean);
  const mkMeaning = (): Question | null => { const c = shuffle(meanPool).find(p => !used.has('m' + p.a + ':' + p.w)); if (!c || allMeans.length < 4) return null; used.add('m' + c.a + ':' + c.w);
    return {type: 'Word meaning', prompt: 'What does this word mean?', promptRef: `ayah ${n}:${c.a}`, word: c.ar, opts: shuffle([c.mean, ...pickN(allMeans.filter(m => m !== c.mean), 3)]), ans: c.mean, optCls: meaningLang === 'ur' ? 'ur' : '', ref: c.a}; };
  const allWords = uniq(pool.filter(p => letters(p.ar) >= 3), p => p.ar).map(p => p.ar);
  const mkComplete = (): Question | null => {
    for (const x of shuffle(inRange.filter(y => toks(y).length >= 4 && !used.has('c' + y.a)))){
      const tk = toks(x); const idx = shuffle(tk.map((_, i) => i).filter(i => letters(tk[i]) >= 3))[0]; if (idx === undefined) continue;
      const others = allWords.filter(w => w !== tk[idx]); if (others.length < 3) return null; used.add('c' + x.a);
      return {type: 'Complete the ayah', prompt: `Which word is missing from ayah ${n}:${x.a}?`, arTokens: tk, blank: idx, opts: shuffle([tk[idx], ...pickN(others, 3)]), ans: tk[idx], optCls: 'ar', ref: x.a};
    }
    return null; };
  const mkTrans = (): Question | null => { if (inRange.length < 4) return null; const c = shuffle(inRange).find(x => !used.has('t' + x.a) && d.trans[String(x.a)]); if (!c) return null; used.add('t' + c.a);
    const snip = (x: {text: string}) => { const tk = toks(x); return tk.slice(0, 7).join(' ') + (tk.length > 7 ? ' …' : ''); };
    const tr = d.trans[String(c.a)] || '';
    const opts = shuffle([c, ...pickN(inRange.filter(x => x.a !== c.a), 3)]).map(snip);
    return {type: 'Match the translation', prompt: 'Which ayah has this meaning?', trans: tr.length > 320 ? tr.slice(0, 320) + '…' : tr, transUr: d.transLang === 'ur', opts, ans: snip(c), optCls: 'ar', ref: c.a}; };
  const gPool = pool.filter(p => p.pos && letters(p.ar) >= 3);
  const roots = uniq(pool.filter(p => p.root), p => p.root).map(p => p.root);
  const POSN: Record<string, string> = {N: 'Noun — اسم', V: 'Verb — فعل', P: 'Particle — حرف'};
  const mkGrammar = (): Question | null => { const c = shuffle(gPool).find(p => !used.has('g' + p.a + ':' + p.w)); if (!c) return null; used.add('g' + c.a + ':' + c.w);
    if (c.root && roots.length >= 4 && Math.random() < .5)
      return {type: 'Word grammar', prompt: 'What is the root of this word?', promptRef: `ayah ${n}:${c.a}`, word: c.ar, opts: shuffle([c.root, ...pickN(roots.filter(r => r !== c.root), 3)]).map(r => [...r].join(' ')), ans: [...c.root].join(' '), optCls: 'ar', ref: c.a};
    return {type: 'Word grammar', prompt: 'What type of word is this?', promptRef: `ayah ${n}:${c.a}`, word: c.ar, opts: ['N', 'V', 'P'].map(k => POSN[k]), ans: POSN[c.pos] || POSN.N, optCls: '', ref: c.a}; };
  const makers: Record<string, () => Question | null> = {m: mkMeaning, c: mkComplete, t: mkTrans, g: d.gram ? mkGrammar : () => null};
  const qs: Question[] = [];
  shuffle(['m','m','m','c','c','c','t','t','g','g']).forEach(k => { const q = makers[k](); if (q) qs.push(q); });
  for (let tries = 0; qs.length < QUIZ_LEN && tries < 40; tries++){ const q = makers[['m','c','t','g'][tries % 4]](); if (q) qs.push(q); }
  return shuffle(qs).slice(0, QUIZ_LEN);
}
