/** Where the reader is: the last ayah read (kept while scrolling a surah/juz or turning Mushaf pages), so Mushaf and Tafseer can open there. */
import {store} from './AppProvider';
import {JUZ_PAGE, JUZ_START, SURAH_PAGE} from '@/lib/meta';

export type LastRead = {s: number; a: number; name: string; page?: number; juz?: number};
export const getLastRead = () => store.get<LastRead | null>('lastRead', null);
export const setLastRead = (lr: LastRead) => store.set('lastRead', lr);

type At = {s: number; a: number; page?: number};
/**
 * The ayah to open: the one in the address (surah/juz/mushaf/tafseer pages) unless the last-read ayah is inside it,
 * otherwise the last-read ayah. Null for a first-time visitor.
 */
export function resumeAt(path: string): At | null {
  const lr = getLastRead(), last: At | null = lr ? {s: lr.s, a: lr.a, page: lr.page} : null;
  const [, kind, x, y] = path.split('/'), n = +x || 0, m = +y || 0;
  if (kind === 'surah' && n >= 1 && n <= 114){
    if (lr?.s === n) return last;
    return m ? {s: n, a: m} : {s: n, a: 1, page: SURAH_PAGE[n - 1]};
  }
  if (kind === 'juz' && n >= 1 && n <= 30){
    if (lr?.juz === n) return last;
    const [s, a] = JUZ_START[n - 1]; return {s, a, page: JUZ_PAGE[n - 1]};
  }
  if ((kind === 'tafseer' || kind === 'videos') && n >= 1 && n <= 114 && m >= 1) return lr?.s === n && lr.a === m ? last : {s: n, a: m};
  return last;
}
/** Mushaf opens at the start of the reader's surah (not the exact ayah), with its first ayah highlighted via `at`. */
export const mushafHref = (at: At | null) => !at ? '/mushaf' : `/mushaf/${SURAH_PAGE[at.s - 1]}?at=${at.s}:1`;
export const tafseerHref = (at: At | null) => at ? `/tafseer/${at.s}/${at.a}` : '/tafseer/1/1';
