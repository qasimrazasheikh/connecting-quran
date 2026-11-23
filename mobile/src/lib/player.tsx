/** Recitation player: plays a surah ayah by ayah (one file per ayah), with repeat, speed and a sleep timer. */
import {setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';
import {isRunningInExpoGo} from 'expo';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {audioUrl, ayahNumber, RECITERS, surahInfo} from './data';
import {useApp} from './store';

const IN_EXPO_GO = isRunningInExpoGo();
type Cur = {s: number; a: number} | null;
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
  const [sleep, setSleepMin] = useState(0);
  const left = useRef(1), sleepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Background playback starts a service Expo Go doesn't have (it reports an error), so only in a real build
    setAudioModeAsync({playsInSilentMode: true, shouldPlayInBackground: !IN_EXPO_GO, interruptionMode: 'doNotMix'}).catch(() => {});
  }, []);

  const play = useCallback((s: number, a: number) => {
    if (a < 1 || a > surahInfo(s).ayahs) return;
    left.current = repeat;
    setCur({s, a});
    player.replace({uri: audioUrl(settings.reciter, ayahNumber(s, a))});
    player.setPlaybackRate(settings.speed);
    player.play();
    // Lock-screen controls keep Android playing in the background; they need the expo-audio plugin, so not in Expo Go
    if (!IN_EXPO_GO) try{
      player.setActiveForLockScreen(true, {title: `${surahInfo(s).en} · Ayah ${a}`, artist: RECITERS.find(r => r.id === settings.reciter)?.name ?? ''});
    }catch{}
  }, [player, repeat, settings.reciter, settings.speed]);

  const next = useCallback(() => { if (cur && cur.a < surahInfo(cur.s).ayahs) play(cur.s, cur.a + 1); }, [cur, play]);
  const prev = useCallback(() => { if (cur && cur.a > 1) play(cur.s, cur.a - 1); }, [cur, play]);
  const stop = useCallback(() => { player.pause(); setCur(null); }, [player]);
  const toggle = useCallback(() => { if (status.playing) player.pause(); else player.play(); }, [player, status.playing]);
  const seekBy = useCallback((sec: number) => { player.seekTo(Math.max(0, status.currentTime + sec)); }, [player, status.currentTime]);

  // End of an ayah: repeat it, go on to the next one, or finish (which hides the recitation bar).
  // The listener is subscribed once; `onEnd` always holds the latest state.
  const onEnd = useRef(() => {});
  useEffect(() => {
    onEnd.current = () => {
      if (!cur) return;
      if (left.current > 1){ left.current--; player.seekTo(0).then(() => player.play()); return; }
      if (settings.autoPlay && cur.a < surahInfo(cur.s).ayahs) play(cur.s, cur.a + 1);
      else setCur(null);
    };
  });
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', s => { if (s.didJustFinish) onEnd.current(); });
    return () => sub.remove();
  }, [player]);

  useEffect(() => { player.setPlaybackRate(settings.speed); }, [player, settings.speed]);

  const setSleep = useCallback((min: number) => {
    if (sleepTimer.current) clearTimeout(sleepTimer.current);
    setSleepMin(min);
    if (min) sleepTimer.current = setTimeout(() => { player.pause(); setSleepMin(0); }, min * 60000);
  }, [player]);

  const value = useMemo<Ctx>(() => ({
    cur, playing: status.playing, loading: !!cur && (status.isBuffering || !status.isLoaded), time: status.currentTime, duration: status.duration,
    repeat, sleep, play, toggle, next, prev, stop, seekBy, setRepeat: n => { setRepeat(n); left.current = n; }, setSleep,
  }), [cur, status.playing, status.isBuffering, status.isLoaded, status.currentTime, status.duration, repeat, sleep, play, toggle, next, prev, stop, seekBy, setSleep]);
  return <PlayerCtx.Provider value={value}>{children}</PlayerCtx.Provider>;
}
export const usePlayer = () => useContext(PlayerCtx)!;
