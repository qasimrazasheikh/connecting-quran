/** Search highlighting. Arabic/Urdu match the loose way the search source does (no vowel marks, one form per letter, optional extra alif). */
import {AR_DIAC} from './text';
const esc = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const reEsc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const normAr = (t: string) => String(t).replace(AR_DIAC, '').replace(/[‌‍‏]/g, '')
  .replace(/[أإآٱ]/g, 'ا').replace(/[ىیئ]/g, 'ي').replace(/ؤ/g, 'و').replace(/[ةہھ]/g, 'ه').replace(/ک/g, 'ك').replace(/ء/g, '');
export function highlight(text: string, q: string, scope: string): string {
  const terms = q.split(/\s+/).filter(Boolean);
  if (!terms.length) return esc(text);
  if (scope === 'en') return esc(text).replace(new RegExp(`(${terms.map(t => reEsc(esc(t))).join('|')})`, 'gi'), '<mark>$1</mark>');
  const res = terms.map(t => new RegExp([...normAr(t)].map(reEsc).join('ا?')));
  return String(text).split(' ').map(w => { const n = normAr(w); return n && res.some(r => r.test(n)) ? `<mark>${esc(w)}</mark>` : esc(w); }).join(' ');
}
