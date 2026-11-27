/**
 * Recitation player: plays a surah ayah by ayah, with repeat, speed and a sleep timer. Most reciters have one file per
 * ayah; the others one file per surah, where the player seeks to the ayah's start and treats reaching the next ayah's
 * start as the end of this one (the site's timings files, as the website does).
 */
import {setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';
import {isRunningInExpoGo} from 'expo';
import {Alert} from 'react-native';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {ayahAudio, loadTimings, reciterOf, type Timings} from './api';
import {ayahNumber, surahInfo} from './data';
import {useApp} from './store';

const IN_EXPO_GO = isRunningInExpoGo();
type Cur = {s: number; a: number} | null;
/** Where an ayah sits in its surah file, in seconds (`end` null for the last ayah: the file's end). */
type Span = {start: number; end: number | null};
const spanOf = (tm: Timings, s: number, a: number): Span => ({start: (tm.t[s - 1]?.[a - 1] ?? 0) / 1000, end: tm.t[s - 1]?.[a] != null ? tm.t[s - 1][a] / 1000 : null});
type Ctx = {
  cur: Cur; playing: boolean; loading: boolean; time: number; duration: number; repeat: number; sleep: number;
  play: (s: number, a: number) => void; toggle: () => void; next: () => void; prev: () => void; stop: () => void;
  seekBy: (sec: number) => void; setRepeat: (n: number) => void; setSleep: (min: number) => void;
};
const PlayerCtx = createContext<Ctx | null>(null);

export function PlayerProvider({children}: {children: ReactNode}){
  const {settings} = useApp();
  const player = useAudioPlayer(null, {updateInterval: 250});
  const status = useAudioPlayerStatus(player);
  const [cur, setCur] = useState<Cur>(null);
  const [repeat, setRepeat] = useState(1);
  const [span, setSpan] = useState<Span | null>(null);
  const [sleep, setSleepMin] = useState(0);
  /** The surah-file reciter's timings while one plays; the file now in the player (so stepping within it only seeks). */
  const timed = useRef<Timings | null>(null), loaded = useRef(''), req = useRef(0);
  const left = useRef(1), sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Background playback starts a service Expo Go doesn't have (it reports an error), so only in a real build
    setAudioModeAsync({playsInSilentMode: true, shouldPlayInBackground: !IN_EXPO_GO, interruptionMode: 'doNotMix'}).catch(() => {});
  }, []);

  const play = useCallback(async (s: number, a: number) => {
    if (a < 1 || a > surahInfo(s).ayahs) return;
    left.current = repeat;
    setCur({s, a});
    const r = reciterOf(settings.reciter), id = ++req.current;
    let uri = ayahAudio(r, s, a, ayahNumber(s, a)), start = 0;
    if (r.timings){
      try{ timed.current = await loadTimings(r.timings); }
      catch{ if (id === req.current) setCur(null); Alert.alert('Could not load this reciter', 'Check the connection, or choose another reciter in Settings.'); return; }
      if (id !== req.current) return; // another ayah was asked for meanwhile
      uri = timed.current.u[s - 1]; start = spanOf(timed.current, s, a).start; setSpan(spanOf(timed.current, s, a));
    } else { timed.current = null; setSpan(null); }
    if (loaded.current !== uri){ player.replace({uri}); loaded.current = uri; }
    if (r.timings || player.currentTime > 0) await player.seekTo(start).catch(() => {});
    player.setPlaybackRate(settings.speed);
    player.play();
    // Lock-screen controls keep Android playing in the background; they need the expo-audio plugin, so not in Expo Go
    if (!IN_EXPO_GO) try{
      player.setActiveForLockScreen(true, {title: `${surahInfo(s).en} · Ayah ${a}`, artist: r.name});
    }catch{}
  }, [player, repeat, settings.reciter, settings.speed]);

  const next = useCallback(() => { if (cur && cur.a < surahInfo(cur.s).ayahs) play(cur.s, cur.a + 1); }, [cur, play]);
  const prev = useCallback(() => { if (cur && cur.a > 1) play(cur.s, cur.a - 1); }, [cur, play]);
  const stop = useCallback(() => { req.current++; player.pause(); setCur(null); }, [player]);
  const toggle = useCallback(() => { if (status.playing) player.pause(); else player.play(); }, [player, status.playing]);
  const seekBy = useCallback((sec: number) => { player.seekTo(Math.max(0, status.currentTime + sec)); }, [player, status.currentTime]);

  // End of an ayah: repeat it, go on to the next one, or finish (which hides the recitation bar).
  // The listener is subscribed once; `onEnd` always holds the latest state.
  const onEnd = useRef(() => {}), onTick = useRef((_sec: number) => {});
  useEffect(() => {
    onEnd.current = () => {
      if (!cur) return;
      const tm = timed.current, start = tm ? (tm.t[cur.s - 1]?.[cur.a - 1] ?? 0) / 1000 : 0;
      if (left.current > 1){ left.current--; player.seekTo(start).then(() => player.play()); return; }
      const more = settings.autoPlay && cur.a < surahInfo(cur.s).ayahs;
      // In a surah file the next ayah simply follows: move on without seeking, so there is no gap
      if (more && tm){ left.current = repeat; setCur({s: cur.s, a: cur.a + 1}); setSpan(spanOf(tm, cur.s, cur.a + 1)); }
      else if (more) play(cur.s, cur.a + 1);
      else { if (tm) player.pause(); setCur(null); }
    };
    // In a surah file, reaching the next ayah's start ends this one
    onTick.current = (sec: number) => {
      const tm = timed.current;
      if (!tm || !cur) return;
      const next = tm.t[cur.s - 1]?.[cur.a];
      if (next != null && sec * 1000 >= next) onEnd.current();
    };
  });
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', s => { if (s.didJustFinish) onEnd.current(); else if (s.playing) onTick.current(s.currentTime); });
    return () => sub.remove();
  }, [player]);

  useEffect(() => { player.setPlaybackRate(settings.speed); }, [player, settings.speed]);

  const setSleep = useCallback((min: number) => {
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    setSleepMin(min);
    if (min) sleepTimer.current = setTimeout(() => { player.pause(); setSleepMin(0); }, min * 60000);
  }, [player]);

  const value = useMemo<Ctx>(() => ({
    cur, playing: status.playing, loading: !!cur && (status.isBuffering || !status.isLoaded), time: span ? Math.max(0, status.currentTime - span.start) : status.currentTime,
    duration: span ? (span.end ?? status.duration) - span.start : status.duration,
    repeat, sleep, play, toggle, next, prev, stop, seekBy, setRepeat: n => { setRepeat(n); left.current = n; }, setSleep,
  }), [cur, status.playing, status.isBuffering, status.isLoaded, status.currentTime, status.duration, span, repeat, sleep, play, toggle, next, prev, stop, seekBy, setSleep]);
  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}
export const usePlayer = () => useContext(PlayerCtx)!;
