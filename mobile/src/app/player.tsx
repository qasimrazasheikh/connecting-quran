/** Full player: the ayah being recited, progress, controls, speed / repeat / sleep timer, follow-in-reader. */
import {router} from 'expo-router';
import {ActivityIndicator, Pressable, ScrollView, Switch, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {arFont, arText} from '@/components/AyahCard';
import {Icon, T} from '@/components/ui';
import {useReciter} from '@/lib/api';
import {endMark, surahInfo, useSurah} from '@/lib/data';
import {usePlayer} from '@/lib/player';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';

const BG = '#0b0d1d', CARD = '#131731', LINE = '#262c52', TXT = '#e9ebf8', MUTED = '#a2a8c6', GOLD = '#f4c04e';
const mmss = (x: number) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
const cycle = <V,>(list: V[], v: V) => list[(list.indexOf(v) + 1) % list.length];

export default function Player(){
  const {settings: st, set} = useApp();
  const p = usePlayer();
  const insets = useSafeAreaInsets();
  const cur = p.cur ?? {s: 1, a: 1};
  const ayah = useSurah(cur.s)?.[cur.a - 1], total = surahInfo(cur.s).ayahs;
  const reciter = useReciter(st.reciter);
  const opts: {value: string; label: string; on: boolean; press: () => void}[] = [
    {value: `${st.speed}×`, label: 'Speed', on: st.speed !== 1, press: () => set({speed: cycle([0.75, 1, 1.25, 1.5], st.speed)})},
    {value: p.repeat === 1 ? 'Off' : `${p.repeat}×`, label: 'Repeat ayah', on: p.repeat > 1, press: () => p.setRepeat(cycle([1, 3, 5], p.repeat))},
    {value: p.sleep ? `${p.sleep}m` : 'Off', label: 'Sleep timer', on: !!p.sleep, press: () => p.setSleep(cycle([0, 15, 30, 60], p.sleep))},
    {value: reciter.name.split(' ')[0], label: 'Reciter', on: false, press: () => router.push('/settings')},
  ];

  return (
    <ScrollView style={{flex: 1, backgroundColor: BG}} contentContainerStyle={{paddingTop: insets.top + 6, paddingHorizontal: 20, paddingBottom: 24, gap: 18}}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <Pressable accessibilityLabel="Close player" onPress={() => router.back()} style={{width: 44, height: 44, alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="down" size={24} color={TXT} />
        </Pressable>
        <T size={13} w="sb" c={MUTED} style={{flex: 1, textAlign: 'center', letterSpacing: 1}}>NOW PLAYING</T>
        <View style={{width: 44}} />
      </View>

      <View style={{padding: 20, borderRadius: 24, backgroundColor: CARD, borderWidth: 1, borderColor: LINE, alignItems: 'center', gap: 8}}>
        <Text style={{fontFamily: F.names, fontSize: 54, color: GOLD, includeFontPadding: false}}>{String(cur.s).padStart(3, '0')}</Text>
        {ayah ? <>
          <Text style={{fontFamily: arFont(st), fontSize: 28, lineHeight: 60, color: TXT, textAlign: 'center', includeFontPadding: false}}>
            {arText(ayah, st)} <Text style={{fontFamily: F.uth, color: GOLD}}>{endMark(cur.a)}</Text>
          </Text>
          <T size={15} c="#c3c8e0" style={{textAlign: 'center'}}>{ayah.en}</T>
        </> : <ActivityIndicator color={GOLD} style={{padding: 30}} />}
      </View>

      <View>
        <T size={20} w="b" c={TXT}>{surahInfo(cur.s).en} · Ayah {cur.a}</T>
        <T size={14} c="#c6cbff">{reciter.name}</T>
      </View>

      <View style={{gap: 6}}>
        <View style={{height: 6, borderRadius: 3, backgroundColor: LINE, overflow: 'hidden'}}>
          <View style={{width: `${p.duration ? Math.min(100, p.time / p.duration * 100) : 0}%`, height: '100%', backgroundColor: GOLD}} />
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <T size={12} c={MUTED}>Ayah {cur.a} of {total}</T>
          <T size={12} c={MUTED}>{mmss(p.time)} / {mmss(p.duration || 0)}</T>
        </View>
      </View>

      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4}}>
        <Pressable accessibilityLabel="Previous ayah" onPress={p.prev} style={{width: 56, height: 56, alignItems: 'center', justifyContent: 'center'}}><Icon name="prev" size={28} color={TXT} /></Pressable>
        <Pressable accessibilityLabel="Back 5 seconds" onPress={() => p.seekBy(-5)} style={{width: 48, height: 48, alignItems: 'center', justifyContent: 'center'}}><T w="sb" size={13} c={TXT}>−5s</T></Pressable>
        <Pressable accessibilityLabel={p.playing ? 'Pause' : 'Play'} onPress={() => p.cur ? p.toggle() : p.play(cur.s, cur.a)}
          style={{width: 76, height: 76, borderRadius: 38, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center'}}>
          {p.loading && !p.playing ? <ActivityIndicator color={BG} /> : <Icon name={p.playing ? 'pause' : 'play'} size={30} color={BG} />}
        </Pressable>
        <Pressable accessibilityLabel="Forward 5 seconds" onPress={() => p.seekBy(5)} style={{width: 48, height: 48, alignItems: 'center', justifyContent: 'center'}}><T w="sb" size={13} c={TXT}>+5s</T></Pressable>
        <Pressable accessibilityLabel="Next ayah" onPress={p.next} style={{width: 56, height: 56, alignItems: 'center', justifyContent: 'center'}}><Icon name="next" size={28} color={TXT} /></Pressable>
      </View>

      <View style={{flexDirection: 'row', gap: 8}}>
        {opts.map(o => (
          <Pressable key={o.label} onPress={o.press} style={{flex: 1, height: 64, borderRadius: 14, borderWidth: 1, borderColor: o.on ? '#9ea8ff' : LINE,
            backgroundColor: o.on ? '#1f2552' : CARD, alignItems: 'center', justifyContent: 'center'}}>
            <T size={15} w="b" c={o.on ? GOLD : TXT} lines={1}>{o.value}</T>
            <T size={11} c={MUTED}>{o.label}</T>
          </Pressable>
        ))}
      </View>

      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: CARD}}>
        <View style={{flex: 1}}>
          <T size={14} w="sb" c={TXT}>Follow in reader</T>
          <T size={12} c={MUTED}>Scroll to the ayah being recited</T>
        </View>
        <Switch value={st.follow} onValueChange={v => set({follow: v})} trackColor={{true: '#3d3fc4', false: LINE}} thumbColor={st.follow ? GOLD : '#ccc'} />
      </View>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: CARD}}>
        <View style={{flex: 1}}>
          <T size={14} w="sb" c={TXT}>Play the next ayah</T>
          <T size={12} c={MUTED}>Carry on to the end of the surah</T>
        </View>
        <Switch value={st.autoPlay} onValueChange={v => set({autoPlay: v})} trackColor={{true: '#3d3fc4', false: LINE}} thumbColor={st.autoPlay ? GOLD : '#ccc'} />
      </View>
    </ScrollView>
  );
}
