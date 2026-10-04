'use client';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {useApp} from './AppProvider';
import {audioUrl, RECITERS} from '@/lib/meta';
import {Icon} from './Icons';

export type QItem = {key: string; s: number; a: number; n: number; name: string};
type Rep = {mode: 'off' | 'ayah' | 'range'; times: number; count: number; loop: number; from: string; to: string};
type PCtx = {cur: string | null; playing: boolean; setQueue: (q: QItem[], opts?: {onEnd?: () => void}) => void; toggle: (key: string) => void; playKey: (key: string) => void; playFirst: () => void; stop: () => void; playFirstOnNextQueue: () => void};
const PlayerCtx = createContext<PCtx | null>(null);
export const usePlayer = () => { const c = useContext(PlayerCtx); if (!c) throw new Error('usePlayer outside provider'); return c; };
const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function PlayerProvider({children}: {children: ReactNode}) {
  const {settings, update, toast} = useApp();
  const pathname = usePathname();
  const audio = useRef<HTMLAudioElement | null>(null);
  const queue = useRef<QItem[]>([]); const onEnd = useRef<(() => void) | undefined>(undefined);
  const pendingFirst = useRef(false);
  const [cur, setCur] = useState<string | null>(null); const curRef = useRef<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [rep, setRepState] = useState<Rep>({mode: 'off', times: 3, count: 1, loop: 1, from: '', to: ''}); const repRef = useRef(rep);
  const setRep = (r: Rep) => { repRef.current = r; setRepState(r); };
  const [panel, setPanel] = useState(false);
  const [sleepLeft, setSleepLeft] = useState<string>(''); const sleepEnd = useRef(0); const sleepAfterAyah = useRef(false); const sleepTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  const sRef = useRef(settings); sRef.current = settings;

  const item = (key: string | null) => queue.current.find(q => q.key === key);
  const play = useCallback((key: string) => {
    const it = queue.current.find(q => q.key === key); const el = audio.current; if (!it || !el) return;
    if (key !== curRef.current) setRep({...repRef.current, count: 1});
    curRef.current = key; setCur(key);
    el.src = audioUrl(sRef.current.reciter, it.n);
    el.defaultPlaybackRate = el.playbackRate = sRef.current.speed || 1;
    el.play().catch(e => { if ((e as Error).name !== 'AbortError') toast('Could not play audio'); });
    if (sRef.current.autoScroll) document.querySelector(`[data-key="${key}"]`)?.scrollIntoView({block: 'center', behavior: 'smooth'});
  }, [toast]);
  const stop = useCallback(() => {
    const el = audio.current; if (el){ el.pause(); el.removeAttribute('src'); el.load(); }
    curRef.current = null; setCur(null); setPlaying(false); setPanel(false);
  }, []);
  const step = (dir: number) => { const i = queue.current.findIndex(q => q.key === curRef.current); return queue.current[i + dir]?.key; };
  const clearSleep = () => { clearInterval(sleepTimer.current); sleepEnd.current = 0; sleepAfterAyah.current = false; setSleepLeft(''); };

  useEffect(() => {
    const el = new Audio(); el.preload = 'auto'; audio.current = el;
    const onPlay = () => setPlaying(true), onPause = () => setPlaying(false);
    const onEnded = () => {
      const r = repRef.current, key = curRef.current;
      if (sleepAfterAyah.current){ clearSleep(); toast('Sleep timer: stopped'); return; }
      if (r.mode === 'ayah' && key && (r.times === 0 || r.count < r.times)){ setRep({...r, count: r.count + 1}); el.currentTime = 0; el.play(); return; }
      if (r.mode === 'range' && key){
        if (key === r.to){
          if (r.times === 0 || r.loop < r.times){ setRep({...r, loop: r.loop + 1}); play(r.from); return; }
          setRep({...r, loop: 1}); toast('Range finished'); return;
        }
        const nx = step(1); if (nx){ play(nx); return; }
      }
      const nx = sRef.current.autoPlay ? step(1) : undefined;
      if (nx) play(nx);
      else if (sRef.current.autoPlay && onEnd.current){ pendingFirst.current = true; onEnd.current(); }
      else if (sRef.current.autoPlay) toast('Finished');
    };
    const onErr = () => { if (curRef.current && el.getAttribute('src')) toast('Audio not available for this ayah'); };
    el.addEventListener('play', onPlay); el.addEventListener('pause', onPause); el.addEventListener('ended', onEnded); el.addEventListener('error', onErr);
    return () => { el.pause(); el.removeEventListener('play', onPlay); el.removeEventListener('pause', onPause); el.removeEventListener('ended', onEnded); el.removeEventListener('error', onErr); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // leaving a page stops audio (unless Mushaf is moving to the next page while reciting)
  useEffect(() => { if (!pendingFirst.current) stop(); }, [pathname, stop]);
  // space bar plays/pauses
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || !curRef.current) return;
      const t = (document.activeElement?.tagName || ''); if (/INPUT|SELECT|TEXTAREA|BUTTON/.test(t)) return;
      e.preventDefault(); const el = audio.current!; if (el.paused) el.play(); else el.pause();
    };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, []);

  const value = useMemo<PCtx>(() => ({
    cur, playing,
    setQueue: (q, opts) => {
      queue.current = q; onEnd.current = opts?.onEnd;
      if (pendingFirst.current && q.length){ pendingFirst.current = false; play(q[0].key); }
    },
    toggle: key => { const el = audio.current; if (key === curRef.current && el?.getAttribute('src')){ if (el.paused) el.play(); else el.pause(); } else play(key); },
    playKey: play,
    playFirst: () => { if (queue.current[0]) play(queue.current[0].key); },
    stop,
    playFirstOnNextQueue: () => { pendingFirst.current = true; },
  }), [cur, playing, play, stop]);

  const setSpeed = (v: number) => { update({speed: v}); if (audio.current) audio.current.defaultPlaybackRate = audio.current.playbackRate = v; };
  const setSleep = (min: number | 'ayah') => {
    clearSleep();
    if (min === 'ayah'){ sleepAfterAyah.current = true; setSleepLeft('ayah'); return; }
    if (!min) return;
    sleepEnd.current = Date.now() + min * 60000;
    const tick = () => { const left = sleepEnd.current - Date.now(); if (left <= 0){ clearSleep(); audio.current?.pause(); toast('Sleep timer: paused'); return; } setSleepLeft(Math.ceil(left / 60000) + 'm'); };
    tick(); sleepTimer.current = setInterval(tick, 15000);
  };
  const it = item(cur);
  const rec = RECITERS.find(r => r.id === settings.reciter) || RECITERS[0];
  let info = rec.name;
  if (rep.mode === 'ayah') info += ` · repeat ${rep.count}/${rep.times || '∞'}`;
  if (rep.mode === 'range') info += ` · range ${rep.from}–${rep.to} (${rep.loop}/${rep.times || '∞'})`;
  if ((settings.speed || 1) !== 1) info += ` · ${settings.speed}×`;

  const startRange = (from: string, to: string) => {
    const fi = queue.current.findIndex(q => q.key === from), ti = queue.current.findIndex(q => q.key === to);
    if (fi < 0 || ti < 0 || fi > ti){ toast('Pick a range of ayahs shown on this page, e.g. 2:1 to 2:5'); return; }
    setRep({...repRef.current, mode: 'range', from, to, loop: 1}); setPanel(false); play(from);
  };
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-[13px] ${on ? 'bg-brand border-brand text-on-brand' : 'border-line bg-surface'}`;
  const pbtn = 'grid h-[38px] min-w-[38px] place-items-center rounded-[10px] text-ink hover:bg-surface2 hover:text-brand';

  return (
    <PlayerCtx.Provider value={value}>
      {children}
      {cur && it && (
        <div className="fixed bottom-4 left-1/2 z-30 flex w-[min(660px,calc(100%-24px))] -translate-x-1/2 flex-wrap items-center gap-1.5 rounded-[14px] border border-line bg-surface px-2.5 py-2 shadow-[0_8px_30px_rgba(0,0,0,.15)]" id="player">
          {panel && (
            <div className="absolute inset-x-0 bottom-[calc(100%+8px)] rounded-[14px] border border-line bg-surface p-3.5 text-sm shadow-[0_8px_30px_rgba(0,0,0,.18)]" onClick={e => e.stopPropagation()}>
              <h5 className="mb-1.5 text-[11.5px] uppercase tracking-wider text-muted">Repeat</h5>
              <div className="flex flex-wrap gap-1.5">{(['off', 'ayah', 'range'] as const).map(m => <button key={m} data-rm={m} className={chip(rep.mode === m)} onClick={() => setRep({...rep, mode: m, count: 1, loop: 1, from: rep.from || cur, to: rep.to || cur})}>{m === 'off' ? 'Off' : m === 'ayah' ? 'This ayah' : 'Range'}</button>)}</div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">Times: {[1, 2, 3, 5, 7, 10, 0].map(n => <button key={n} data-rt={n} className={chip(rep.times === n)} onClick={() => setRep({...rep, times: n})}>{n || '∞'}</button>)}</div>
              {rep.mode === 'range' && <RangeRow from={rep.from || cur} to={rep.to || cur} onStart={startRange} />}
              <h5 className="mb-1.5 mt-3 text-[11.5px] uppercase tracking-wider text-muted">Speed</h5>
              <div className="flex flex-wrap gap-1.5">{SPEEDS.map(v => <button key={v} data-sp={v} className={chip((settings.speed || 1) === v)} onClick={() => setSpeed(v)}>{v}×</button>)}</div>
              <h5 className="mb-1.5 mt-3 text-[11.5px] uppercase tracking-wider text-muted">Sleep timer <span className="normal-case tracking-normal">({sleepLeft ? (sleepLeft === 'ayah' ? 'after this ayah' : sleepLeft + ' left') : 'off'})</span></h5>
              <div className="flex flex-wrap gap-1.5">{([[0, 'Off'], [5, '5 min'], [10, '10 min'], [15, '15 min'], [30, '30 min'], [60, '60 min'], ['ayah', 'End of ayah']] as const).map(([v, l]) => <button key={String(v)} data-sl={v} className={chip(false)} onClick={() => { setSleep(v); toast(v === 0 ? 'Sleep timer off' : 'Sleep timer set'); }}>{l}</button>)}</div>
            </div>
          )}
          <button className={pbtn} aria-label="Previous ayah" onClick={() => { const p = step(-1); if (p) play(p); }}><Icon.prev /></button>
          <button className={`${pbtn} bg-brand text-on-brand hover:bg-brand hover:text-on-brand`} aria-label="Play or pause" id="plPlay" onClick={() => value.toggle(cur)}>{playing ? <Icon.pause /> : <Icon.play />}</button>
          <button className={pbtn} aria-label="Next ayah" onClick={() => { const n = step(1); if (n) play(n); }}><Icon.next /></button>
          <button className={`${pbtn} px-2 text-[13px] font-semibold`} id="plSpeed" title="Playback speed" onClick={() => { const i = SPEEDS.indexOf(settings.speed || 1); setSpeed(SPEEDS[(i + 1) % SPEEDS.length]); }}>{settings.speed || 1}×</button>
          <div className="min-w-0 flex-1 px-1.5 max-sm:order-first max-sm:basis-full max-sm:pb-0.5"><b className="block truncate text-sm" id="plTitle">{it.name} {it.s}:{it.a}</b><small className="text-xs text-muted" id="plRec">{info}</small></div>
          <button className={`${pbtn} ${rep.mode !== 'off' ? 'bg-brand-soft text-brand' : ''}`} id="plRep" title="Repeat, speed, sleep" onClick={e => { e.stopPropagation(); setPanel(p => !p); }}><Icon.repeat /></button>
          <button className={`${pbtn} px-2 text-[13px] ${sleepLeft ? 'bg-brand-soft text-brand' : ''}`} id="plSleep" title="Sleep timer" onClick={e => { e.stopPropagation(); setPanel(p => !p); }}><Icon.moon /><span id="plSleepT">{sleepLeft && sleepLeft !== 'ayah' ? ' ' + sleepLeft : sleepLeft === 'ayah' ? ' ayah' : ''}</span></button>
          <label className="flex items-center gap-1 whitespace-nowrap text-[12.5px] text-muted" title="Play the next ayah automatically"><input type="checkbox" id="plAuto" className="accent-brand" checked={settings.autoPlay} onChange={e => update({autoPlay: e.target.checked})} /><span className="max-sm:hidden">Continue</span></label>
          <button className={pbtn} aria-label="Stop" id="plClose" onClick={stop}><Icon.x /></button>
        </div>
      )}
    </PlayerCtx.Provider>
  );
}
function RangeRow({from, to, onStart}: {from: string; to: string; onStart: (f: string, t: string) => void}) {
  const [f, setF] = useState(from), [t, setT] = useState(to);
  const inp = 'w-[70px] rounded-lg border border-line bg-bg px-2 py-1.5 text-center';
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">From <input id="rFrom" className={inp} value={f} onChange={e => setF(e.target.value)} placeholder="2:1" /> to <input id="rTo" className={inp} value={t} onChange={e => setT(e.target.value)} placeholder="2:5" />
      <button id="rStart" className="inline-flex items-center gap-1.5 rounded-[11px] bg-brand px-3 py-1.5 text-sm font-medium text-on-brand" onClick={() => onStart(f.trim(), t.trim())}><Icon.play /> Play range</button></div>
  );
}
