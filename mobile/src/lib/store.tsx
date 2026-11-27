/** Reader settings, bookmarks and reading place, kept on the phone (AsyncStorage), like the site's `noor.*` keys. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';
import {useColorScheme} from 'react-native';
import {theme, type Palette, type Theme} from './theme';

export type Settings = {
  script: 'indopak' | 'uthmani'; arSize: number; trSize: number; palette: Palette; mode: 'auto' | 'light' | 'dark';
  /** Translation ids shown under each ayah, in this order (see api.ts; two are bundled). */
  trans: string[]; wbw: boolean; wbwLang: 'ur' | 'en'; reciter: string; autoPlay: boolean; follow: boolean; speed: number;
  /** The open tafseer and the last few chosen (quick chips on the Tafseer screen). */
  tafsir: string; tafsirs: string[];
  /** Tafseer text size (Urdu and Arabic draw a little larger). */
  tafSize: number;
};
export const DEFAULTS: Settings = {
  script: 'indopak', arSize: 28, trSize: 16, palette: 'midnight', mode: 'auto', trans: ['ur.jalandhry', 'en.sahih'], wbw: false, wbwLang: 'ur',
  reciter: 'ar.alafasy', autoPlay: true, follow: true, speed: 1, tafsir: 'ur-tafseer-ibn-e-kaseer', tafsirs: [], tafSize: 16,
};
/** Settings saved by an older build: the two translation switches became the `trans` list. */
function upgrade(s: Record<string, unknown> = {}): Settings {
  const out = {...DEFAULTS, ...s} as Settings & {showUr?: boolean; showEn?: boolean};
  if (!Array.isArray(s.trans) && ('showUr' in s || 'showEn' in s))
    out.trans = [out.showUr !== false && 'ur.jalandhry', out.showEn !== false && 'en.sahih'].filter(Boolean) as string[];
  delete out.showUr; delete out.showEn;
  return out;
}
export type Mark = {s: number; a: number; at: number};
/**
 * `history`: the reader's places, one per surah, latest first. `mushaf`: the last Mushaf page read, kept apart so each
 * mode resumes where it was left. `tips`: one-time hints already shown (e.g. 'mushaf').
 */
type Saved = {settings: Settings; marks: Mark[]; history: Mark[]; mushaf?: {p: number; at: number}; onboarded: boolean; tips: string[]};

type Ctx = Saved & {
  ready: boolean; t: Theme;
  set: (p: Partial<Settings>) => void; toggleMark: (s: number, a: number) => void; isMarked: (s: number, a: number) => boolean;
  read: (s: number, a: number) => void; readPage: (p: number) => void; finishOnboarding: () => void;
  /** The word whose card is open ("s:a:i", '' for none), highlighted in the reader; not saved. */
  word: string; setWord: (k: string) => void;
  /** Full-view Mushaf: the tab and recitation bars step aside; not saved. */
  immersive: boolean; setImmersive: (v: boolean) => void;
  tipSeen: (id: string) => void;
};
const AppCtx = createContext<Ctx | null>(null);
const KEY = 'noor.app';

export function AppProvider({children}: {children: ReactNode}){
  const [st, setSt] = useState<Saved>({settings: DEFAULTS, marks: [], history: [], onboarded: false, tips: []});
  const [ready, setReady] = useState(false);
  const [word, setWord] = useState('');
  const [immersive, setImmersive] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    AsyncStorage.getItem(KEY).then(raw => {
      if (raw) try{ const v = JSON.parse(raw); setSt(o => ({...o, ...v, settings: upgrade(v.settings)})); }catch{}
    }).finally(() => setReady(true));
  }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(KEY, JSON.stringify(st)).catch(() => {}); }, [st, ready]);

  const set = useCallback((p: Partial<Settings>) => setSt(o => ({...o, settings: {...o.settings, ...p}})), []);
  const toggleMark = useCallback((s: number, a: number) => setSt(o => ({
    ...o, marks: o.marks.some(m => m.s === s && m.a === a) ? o.marks.filter(m => !(m.s === s && m.a === a)) : [{s, a, at: Date.now()}, ...o.marks],
  })), []);
  // History keeps one entry per surah: the last ayah read in it
  const read = useCallback((s: number, a: number) => setSt(o => o.history[0]?.s === s && o.history[0]?.a === a ? o
    : {...o, history: [{s, a, at: Date.now()}, ...o.history.filter(h => h.s !== s)].slice(0, 20)}), []);
  const readPage = useCallback((p: number) => setSt(o => o.mushaf?.p === p ? o : {...o, mushaf: {p, at: Date.now()}}), []);
  const finishOnboarding = useCallback(() => setSt(o => ({...o, onboarded: true})), []);
  const tipSeen = useCallback((id: string) => setSt(o => o.tips?.includes(id) ? o : {...o, tips: [...(o.tips ?? []), id]}), []);

  const dark = st.settings.mode === 'auto' ? scheme === 'dark' : st.settings.mode === 'dark';
  const value = useMemo<Ctx>(() => ({
    ...st, ready, t: theme(st.settings.palette, dark), set, toggleMark, read, readPage, finishOnboarding, word, setWord, immersive, setImmersive, tipSeen,
    isMarked: (s, a) => st.marks.some(m => m.s === s && m.a === a),
  }), [st, ready, dark, set, toggleMark, read, readPage, finishOnboarding, word, immersive, tipSeen]);
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
export const useApp = () => useContext(AppCtx)!;

/** "2 hours ago" style labels for bookmarks and history. */
export function ago(at: number){
  const m = Math.round((Date.now() - at) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  return new Date(at).toLocaleDateString('en-GB', {day: 'numeric', month: 'short'});
}
