import {cookies} from 'next/headers';
import {COOKIE, DEFAULT_SETTINGS, parseSettings, type Settings} from './settings';
/** Reader settings from the cookie, checked so nothing odd reaches an external URL. */
export async function readSettings(): Promise<{settings: Settings; hasCookie: boolean}> {
  const raw = (await cookies()).get(COOKIE)?.value;
  const s = parseSettings(raw);
  const trans = Array.isArray(s.trans) ? s.trans.filter(t => typeof t === 'string' && /^[a-z]{2,3}\.[a-z0-9_-]+$/i.test(t)).slice(0, 4) : DEFAULT_SETTINGS.trans;
  const num = (v: unknown, lo: number, hi: number, d: number) => (typeof v === 'number' && v >= lo && v <= hi ? v : d);
  return {
    hasCookie: !!raw,
    settings: {
      ...s, trans,
      script: s.script === 'indopak' ? 'indopak' : 'uthmani',
      wbwLang: s.wbwLang === 'en' ? 'en' : 'ur',
      theme: ['auto', 'light', 'dark'].includes(s.theme) ? s.theme : 'auto',
      palette: ['midnight', 'ocean', 'classic'].includes(s.palette) ? s.palette : 'midnight',
      arSize: num(s.arSize, 22, 52, DEFAULT_SETTINGS.arSize), trSize: num(s.trSize, 14, 28, DEFAULT_SETTINGS.trSize),
      tajweed: !!s.tajweed, wbw: !!s.wbw, showAr: s.showAr !== false,
    },
  };
}
