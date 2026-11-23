/** The recitation bar above the tabs: shown from the first press of play until it is closed (×) or the recitation ends. */
import {router} from 'expo-router';
import {ActivityIndicator, Pressable, View} from 'react-native';
import {RECITERS, surahInfo} from '@/lib/data';
import {usePlayer} from '@/lib/player';
import {useApp} from '@/lib/store';
import {Icon, T} from './ui';

export default function MiniPlayer({style}: {style?: object}){
  const {t, settings} = useApp();
  const p = usePlayer();
  if (!p.cur) return null;
  const info = surahInfo(p.cur.s);
  return (
    <View style={[{marginHorizontal: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, paddingLeft: 12, borderRadius: 16,
      backgroundColor: t.player, elevation: 8, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: {width: 0, height: 6}}, style]}>
      <Pressable onPress={() => router.push('/player')} style={{flex: 1}} accessibilityLabel="Open player">
        <T size={14} w="sb" c={t.playerText} lines={1}>{info.en} · {p.cur.a}</T>
        <T size={12} c={t.playerMuted} lines={1}>{RECITERS.find(r => r.id === settings.reciter)?.name}{settings.speed !== 1 ? ` · ${settings.speed}×` : ''}</T>
      </Pressable>
      <Pressable accessibilityLabel="Previous ayah" onPress={p.prev} style={{width: 44, height: 44, alignItems: 'center', justifyContent: 'center'}}>
        <Icon name="prev" size={20} color={t.playerText} />
      </Pressable>
      <Pressable accessibilityLabel={p.playing ? 'Pause' : 'Play'} onPress={p.toggle}
        style={{width: 44, height: 44, borderRadius: 22, backgroundColor: t.dark ? t.accent : '#f4c04e', alignItems: 'center', justifyContent: 'center'}}>
        {p.loading && !p.playing ? <ActivityIndicator color="#0b0d1d" /> : <Icon name={p.playing ? 'pause' : 'play'} size={18} color="#0b0d1d" />}
      </Pressable>
      <Pressable accessibilityLabel="Next ayah" onPress={p.next} style={{width: 44, height: 44, alignItems: 'center', justifyContent: 'center'}}>
        <Icon name="next" size={20} color={t.playerText} />
      </Pressable>
      <Pressable accessibilityLabel="Stop and close" onPress={p.stop} style={{width: 36, height: 44, alignItems: 'center', justifyContent: 'center'}}>
        <Icon name="x" size={16} color={t.playerMuted} stroke={2.2} />
      </Pressable>
    </View>
  );
}
