/** Reader settings, bookmarks and reading place, kept on the phone (AsyncStorage), like the site's `noor.*` keys. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode} from 'react';
import {useColorScheme} from 'react-native';
import {theme, type Palette, type Theme} from './theme';

export type Settings = {
  script: 'indopak' | 'uthmani'; arSize: number; trSize: number; palette: Palette; mode: 'auto' | 'light' | 'dark';
  showUr: boolean; showEn: boolean; wbw: boolean; wbwLang: 'ur' | 'en'; reciter: string; autoPlay: boolean; follow: boolean; speed: number;
  tafsir: string;
};
export const DEFAULTS: Settings = {
  script: 'indopak', arSize: 28, trSize: 16, palette: 'midnight', mode: 'auto', showUr: true, showEn: true, wbw: false, wbwLang: 'ur',
  reciter: 'ar.alafasy', autoPlay: true, follow: true, speed: 1, tafsir: 'ur-tafseer-ibn-e-kaseer',
};
export type Mark = {s: number; a: number; at: number};
/** `tips`: one-time hints already shown (e.g. 'mushaf'). */
type Saved = {settings: Settings; marks: Mark[]; history: Mark[]; onboarded: boolean; tips: string[]};

type Ctx = Saved & {
  ready: boolean; t: Theme;
  set: (p: Partial<Settings>) => void; toggleMark: (s: number, a: number) => void; isMarked: (s: number, a: number) => boolean;
  read: (s: number, a: number) => void; finishOnboarding: () => void;
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
      if (raw) try{ const v = JSON.parse(raw); setSt(o => ({...o, ...v, settings: {...DEFAULTS, ...v.settings}})); }catch{}
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
  const finishOnboarding = useCallback(() => setSt(o => ({...o, onboarded: true})), []);
  const tipSeen = useCallback((id: string) => setSt(o => o.tips?.includes(id) ? o : {...o, tips: [...(o.tips ?? []), id]}), []);

  const dark = st.settings.mode === 'auto' ? scheme === 'dark' : st.settings.mode === 'dark';
  const value = useMemo<Ctx>(() => ({
    ...st, ready, t: theme(st.settings.palette, dark), set, toggleMark, read, finishOnboarding, word, setWord, immersive, setImmersive, tipSeen,
    isMarked: (s, a) => st.marks.some(m => m.s === s && m.a === a),
  }), [st, ready, dark, set, toggleMark, read, finishOnboarding, word, immersive, tipSeen]);
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
