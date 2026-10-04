'use client';
/* Browser-side calls to this site's own API routes, with a small in-memory cache. */
import type {TafsirEdition, TransEdition} from './meta';
import type {SegInfo} from './grammar';

const cache = new Map<string, Promise<unknown>>();
async function getJSON<T>(url: string): Promise<T> {
  if (!cache.has(url)){
    const p = fetch(url).then(async r => {
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      return j;
    });
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return cache.get(url) as Promise<T>;
}
export const getEditions = () => getJSON<{trans: TransEdition[]; tafsir: TafsirEdition[]}>('/api/editions');
export const getTafsir = (slug: string, s: number, a: number) => getJSON<{text: string}>(`/api/tafsir/${encodeURIComponent(slug)}/${s}/${a}`).then(d => d.text || '');
export type WordInfo = {w: number; translit: string; meanEn: string; meanUr: string; type: string; root: string; lemma: string; segs: SegInfo[]};
export const getWord = (s: number, a: number, q: {w?: number; t?: number}) => getJSON<WordInfo>(`/api/word/${s}/${a}?${q.w ? 'w=' + q.w : 't=' + q.t}`);
