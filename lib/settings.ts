/** Reader settings. Stored in localStorage and mirrored to a cookie so the server can render the reader's choices. */
export type Settings = {
  trans: string[]; tafsirs: string[]; arSize: number; trSize: number;
  theme: 'auto' | 'light' | 'dark'; palette: 'midnight' | 'ocean' | 'classic';
  showAr: boolean; script: 'uthmani' | 'indopak'; reciter: string; autoPlay: boolean; autoScroll: boolean;
  wbw: boolean; wbwLang: 'ur' | 'en'; tajweed: boolean; wordSound: boolean; speed: number;
  tafLayout: 'accordion' | 'split'; tafLast: string;
};
export const DEFAULT_SETTINGS: Settings = {
  trans: ['ur.jalandhry', 'en.sahih'],
  tafsirs: ['ur-tafseer-ibn-e-kaseer', 'ur-tafsir-bayan-ul-quran', 'en-tafisr-ibn-kathir', 'en-tafsir-maarif-ul-quran', 'qe-urdu-junagarhi'],
  arSize: 32, trSize: 18, theme: 'auto', palette: 'midnight', showAr: true, script: 'indopak',
  reciter: 'ar.alafasy', autoPlay: true, autoScroll: true, wbw: false, wbwLang: 'ur', tajweed: false,
  wordSound: false, speed: 1, tafLayout: 'accordion', tafLast: '',
};
export const COOKIE = 'noor_settings';
/** Only the settings the server needs are kept in the cookie (small and safe). */
export const COOKIE_KEYS = ['trans', 'script', 'tajweed', 'wbw', 'wbwLang', 'theme', 'palette', 'arSize', 'trSize', 'showAr'] as const;
export function parseSettings(raw?: string | null): Settings {
  if (!raw) return {...DEFAULT_SETTINGS};
  try { return {...DEFAULT_SETTINGS, ...JSON.parse(decodeURIComponent(raw))}; } catch { return {...DEFAULT_SETTINGS}; }
}
export function cookieValue(s: Settings): string {
  const o: Record<string, unknown> = {};
  COOKIE_KEYS.forEach(k => { o[k] = s[k]; });
  return encodeURIComponent(JSON.stringify(o));
}
