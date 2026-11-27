/**
 * Links to connectingquran.com that Android hands to the app (app.json intentFilters, verified by the site's
 * /.well-known/assetlinks.json) open the matching screen: /surah/2/255, /tafseer/2/255, /mushaf/50, /juz/3.
 * Anything else, or a number out of range, opens the home screen.
 */
import {juzStart, PAGE_COUNT, surahInfo} from '@/lib/data';

export function redirectSystemPath({path}: {path: string; initial: boolean}){
  try{
    const parts = new URL(path, 'https://www.connectingquran.com').pathname.split('/').filter(Boolean);
    const [kind, x = 0, y = 0] = [parts[0], +parts[1], +parts[2]];
    const ayahOk = (s: number, a: number) => s >= 1 && s <= 114 && (!a || (a >= 1 && a <= surahInfo(s).ayahs));
    if (kind === 'surah' && ayahOk(x, y)) return y ? `/surah/${x}?a=${y}` : `/surah/${x}`;
    if (kind === 'tafseer' && ayahOk(x, y)) return `/tafseer?s=${x}&a=${y || 1}`;
    if (kind === 'mushaf') return `/page?p=${x >= 1 && x <= PAGE_COUNT ? x : 1}`;
    if (kind === 'juz' && x >= 1 && x <= 30){ const [s, a] = juzStart(x); return `/surah/${s}?a=${a}`; }
    // the app's own scheme (connectingquran://…) passes through as it is
    if (!/^https?:/.test(path)) return path;
  }catch{ /* fall through */ }
  return '/';
}
