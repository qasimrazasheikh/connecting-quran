'use client';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {COOKIE, COOKIE_KEYS, cookieValue, DEFAULT_SETTINGS, type Settings} from '@/lib/settings';
import type {SurahInfo} from '@/lib/quran';

export type Bookmark = {k: string; s: number; a: number; name: string; t: number};
export type TafsirReq = {s: number; a: number; tab: 'text' | 'videos'} | null;
/** `font`: the font family the tapped word was drawn in, so the card can draw it the same (Indo-Pak text has glyphs only its font has). */
export type WordReq = {s: number; a: number; w?: number; t?: number; text: string; font?: string; rect: DOMRect; onAyah?: () => void} | null;

type Ctx = {
  settings: Settings; update: (patch: Partial<Settings>) => void; surahs: SurahInfo[];
  bookmarks: Bookmark[]; toggleBookmark: (s: number, a: number) => boolean;
  toast: (msg: string) => void;
  settingsOpen: string | false; openSettings: (focus?: string) => void; closeSettings: () => void;
  tafsir: TafsirReq; openTafsir: (s: number, a: number, tab?: 'text' | 'videos') => void; closeTafsir: () => void;
  tafTab: 'text' | 'videos'; setTafTab: (t: 'text' | 'videos') => void;
  word: WordReq; openWord: (w: NonNullable<WordReq>) => void; closeWord: () => void;
};
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => { const c = useContext(AppCtx); if (!c) throw new Error('useApp outside provider'); return c; };

/** Best-effort browser storage (private windows can throw). */
export const store = {
  get<T>(k: string, d: T): T { try{ const v = localStorage.getItem('noor.' + k); return v ? JSON.parse(v) as T : d; }catch{ return d; } },
  set(k: string, v: unknown){ try{ localStorage.setItem('noor.' + k, JSON.stringify(v)); }catch{ /* ignore */ } },
};

/** Old single-file site used #/ addresses; send them to the new pages. */
function legacyPath(hash: string): string | null {
  const h = hash.replace(/^#\/?/, ''); if (!h) return null;
  const [p, x, y] = h.split('/');
  if (p === 'search') return `/search?q=${encodeURIComponent(decodeURIComponent(x || ''))}${y ? `&scope=${y}` : ''}`;
  if (['surah', 'juz', 'mushaf', 'tafseer', 'videos', 'quiz', 'bookmarks'].includes(p)) return '/' + [p, x, y].filter(Boolean).join('/');
  return null;
}

export default function AppProvider({initial, hasCookie, surahs, children}: {initial: Settings; hasCookie: boolean; surahs: SurahInfo[]; children: ReactNode}) {
  const router = useRouter();
  const pathname = usePathname();
  const [settings, setSettings] = useState<Settings>(initial);
  const sRef = useRef(settings); sRef.current = settings;
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [toastMsg, setToastMsg] = useState(''); const toastT = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [settingsOpen, setSettingsOpen] = useState<string | false>(false);
  const [tafsir, setTafsir] = useState<TafsirReq>(null);
  const [tafTab, setTafTab] = useState<'text' | 'videos'>('text');
  const [word, setWord] = useState<WordReq>(null);

  const persist = useCallback((next: Settings) => {
    store.set('settings', next);
    document.cookie = `${COOKIE}=${cookieValue(next)};path=/;max-age=31536000;samesite=lax`;
  }, []);

  // load full settings + bookmarks from the browser; import an older site's settings once
  useEffect(() => {
    const saved = store.get<Partial<Settings>>('settings', {});
    const merged = {...DEFAULT_SETTINGS, ...saved, ...(hasCookie ? Object.fromEntries(COOKIE_KEYS.map(k => [k, initial[k]])) : {})} as Settings;
    if (!merged.tafsirs.includes('qe-urdu-junagarhi') && !store.get('qeAdded', false) && merged.tafsirs.length < 8){ merged.tafsirs = [...merged.tafsirs, 'qe-urdu-junagarhi']; }
    store.set('qeAdded', true);
    setSettings(merged); persist(merged);
    setBookmarks(store.get<Bookmark[]>('bookmarks', []));
    if (!hasCookie && COOKIE_KEYS.some(k => JSON.stringify(merged[k]) !== JSON.stringify(initial[k]))) router.refresh();
    const lp = legacyPath(location.hash);
    if (lp) router.replace(lp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // theme, palette and text sizes
  useEffect(() => {
    const r = document.documentElement;
    r.setAttribute('data-palette', settings.palette);
    if (settings.theme === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', settings.theme);
    r.style.setProperty('--ar-size', settings.arSize + 'px');
    r.style.setProperty('--tr-size', settings.trSize + 'px');
    document.body.classList.toggle('ip', settings.script === 'indopak');
  }, [settings.palette, settings.theme, settings.arSize, settings.trSize, settings.script]);

  // Settings that change what the server renders. While the settings panel is open, the page reloads once on close.
  const dirty = useRef(false); const openRef = useRef<string | false>(false); openRef.current = settingsOpen;
  const update = useCallback((patch: Partial<Settings>) => {
    const prev = sRef.current, next = {...prev, ...patch};
    sRef.current = next; setSettings(next); persist(next);
    const serverKeys = ['trans', 'script', 'tajweed', 'wbw', 'wbwLang', 'showAr'] as const;
    if (serverKeys.some(k => k in patch && JSON.stringify(prev[k]) !== JSON.stringify(next[k]))){
      if (openRef.current) dirty.current = true; else router.refresh();
    }
  }, [persist, router]);
  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
    if (dirty.current){ dirty.current = false; router.refresh(); }
  }, [router]);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToastMsg(''), 1900);
  }, []);
  const toggleBookmark = useCallback((s: number, a: number) => {
    const k = `${s}:${a}`; const list = store.get<Bookmark[]>('bookmarks', []); const i = list.findIndex(b => b.k === k);
    let on: boolean;
    if (i >= 0){ list.splice(i, 1); toast('Bookmark removed'); on = false; }
    else { list.unshift({k, s, a, name: surahs[s - 1]?.en || '', t: Date.now()}); toast('Bookmarked ' + k); on = true; }
    store.set('bookmarks', list); setBookmarks([...list]); return on;
  }, [surahs, toast]);

  // close overlays on navigation
  useEffect(() => { setTafsir(null); setWord(null); closeSettings(); }, [pathname, closeSettings]);
  // Escape closes panels
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape'){ setTafsir(null); setWord(null); closeSettings(); } };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [closeSettings]);

  const value = useMemo<Ctx>(() => ({
    settings, update, surahs, bookmarks, toggleBookmark, toast,
    settingsOpen, openSettings: (f?: string) => { setTafsir(null); setSettingsOpen(f || 'top'); }, closeSettings,
    tafsir, openTafsir: (s, a, tab) => { if (tab) setTafTab(tab); closeSettings(); setWord(null); setTafsir({s, a, tab: tab || tafTab}); }, closeTafsir: () => setTafsir(null),
    tafTab, setTafTab,
    word, openWord: w => setWord(w), closeWord: () => setWord(null),
  }), [settings, update, surahs, bookmarks, toggleBookmark, toast, settingsOpen, closeSettings, tafsir, tafTab, word]);

  return (
    <AppCtx.Provider value={value}>
      {children}
      <div aria-live="polite" className={`fixed left-1/2 bottom-28 z-[70] -translate-x-1/2 rounded-lg bg-ink px-4 py-2 text-sm text-bg pointer-events-none transition-all duration-200 ${toastMsg ? 'opacity-100' : 'opacity-0 translate-y-4'}`}>{toastMsg}</div>
    </AppCtx.Provider>
  );
}
