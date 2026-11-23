/** Mushaf tab: pick a surah (or carry on from the last page read) to open it as Mushaf pages. */
import {router} from 'expo-router';
import {useMemo} from 'react';
import {FlatList, Pressable, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon, T, TabHeader} from '@/components/ui';
import {pageOf, SURAHS, surahInfo, type SurahInfo} from '@/lib/data';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';

const openPage = (p: number) => router.push({pathname: '/page', params: {p}});

export default function MushafList(){
  const {t, history} = useApp();
  const insets = useSafeAreaInsets();
  const last = history[0], lastPage = last ? pageOf(last.s, last.a) : undefined;
  // First page of each surah, from the page index (no surah needs loading for the list)
  const first = useMemo(() => new Map(SURAHS.map(s => [s.n, pageOf(s.n, 1)])), []);

  const row = ({item: s}: {item: SurahInfo}) => {
    const p = first.get(s.n);
    return (
      <Pressable onPress={() => openPage(p!)} style={{flexDirection: 'row', alignItems: 'center', gap: 12, height: 64, paddingHorizontal: 14,
        backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.surface2}}>
        <View style={{width: 38, height: 38, borderRadius: 10, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center'}}>
          <T size={14} w="sb" c={t.brand}>{s.n}</T>
        </View>
        <View style={{flex: 1}}>
          <T size={15} w="sb">{s.en}</T>
          <T size={12.5} c={t.muted} lines={1}>Page {p} · {s.ayahs} ayahs</T>
        </View>
        <Text style={{fontFamily: F.names, fontSize: 32, color: t.brand2, includeFontPadding: false}}>{String(s.n).padStart(3, '0')}</Text>
      </Pressable>
    );
  };

  return (
    <FlatList data={SURAHS} keyExtractor={s => String(s.n)} renderItem={row}
      contentContainerStyle={{paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: 20}}
      ListHeaderComponent={<View style={{gap: 14, paddingBottom: 12}}>
        <TabHeader title="Mushaf" />
        {last && lastPage && (
          <Pressable onPress={() => openPage(lastPage)} style={{padding: 16, borderRadius: 18, backgroundColor: t.hero, flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <View style={{flex: 1, gap: 2}}>
              <T size={12} w="sb" c="#f6cf6a" style={{letterSpacing: 1}}>CONTINUE IN THE MUSHAF</T>
              <T size={18} w="b" c={t.heroText}>Page {lastPage} · {surahInfo(last.s).en}</T>
            </View>
            <Icon name="arrow" size={20} color="#f6cf6a" />
          </Pressable>
        )}
      </View>} />
  );
}
