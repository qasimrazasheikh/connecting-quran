/** Mushaf tab: pick a surah or a page (search by name, number or page), or carry on from the last Mushaf page read. */
import {router} from 'expo-router';
import {useMemo, useState} from 'react';
import {FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon, T, TabHeader} from '@/components/ui';
import {PAGE_COUNT, pageOf, pageRuns, SURAHS, surahInfo, type SurahInfo} from '@/lib/data';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';

const openPage = (p: number) => router.push({pathname: '/page', params: {p}});

export default function MushafList(){
  const {t, mushaf} = useApp();
  const insets = useSafeAreaInsets();
  const lastPage = mushaf?.p, lastSurah = lastPage ? pageRuns(lastPage)[0]?.[0] ?? 1 : 1;
  const [q, setQ] = useState('');
  // "baqara" or "2" filter the surahs; a number up to 604 (or "p 128" / "page 128") also offers that page
  const v = q.trim().toLowerCase(), pm = v.match(/^(?:p(?:age)?\s*)?(\d{1,3})$/), askPage = pm && +pm[1] >= 1 && +pm[1] <= PAGE_COUNT ? +pm[1] : 0;
  const list = useMemo(() => {
    const w = v.replace(/^p(age)?\s*(?=\d)/, '').replace(/[^a-z0-9]/g, '');
    return w ? SURAHS.filter(s => String(s.n) === w || s.en.toLowerCase().replace(/[^a-z]/g, '').includes(w)) : SURAHS;
  }, [v]);
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
    <FlatList data={list} keyExtractor={s => String(s.n)} renderItem={row} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: 20}}
      ListHeaderComponent={<View style={{gap: 14, paddingBottom: 12}}>
        <TabHeader title="Mushaf" />
        {lastPage && !q && (
          <Pressable onPress={() => openPage(lastPage)} style={{padding: 16, borderRadius: 18, backgroundColor: t.hero, flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <View style={{flex: 1, gap: 2}}>
              <T size={12} w="sb" c="#f6cf6a" style={{letterSpacing: 1}}>CONTINUE IN THE MUSHAF</T>
              <T size={18} w="b" c={t.heroText}>Page {lastPage} · {surahInfo(lastSurah).en}</T>
            </View>
            <Icon name="arrow" size={20} color="#f6cf6a" />
          </Pressable>
        )}
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface}}>
          <Icon name="search" size={18} color={t.muted} />
          <TextInput value={q} onChangeText={setQ} onSubmitEditing={() => { if (askPage && !/^\d+$/.test(v)) openPage(askPage); else if (list.length === 1) openPage(pageOf(list[0].n, 1)); else if (askPage) openPage(askPage); }}
            placeholder="Surah name, number or page" placeholderTextColor={t.muted} returnKeyType="go" autoCorrect={false}
            style={{flex: 1, fontFamily: F.r, fontSize: 15, color: t.text}} />
          {q ? <Pressable accessibilityLabel="Clear search" onPress={() => setQ('')} style={{width: 32, height: 32, alignItems: 'center', justifyContent: 'center'}}><Icon name="x" size={14} color={t.muted} stroke={2.5} /></Pressable> : null}
        </View>
        {askPage > 0 && (
          <Pressable onPress={() => openPage(askPage)} style={{flexDirection: 'row', alignItems: 'center', gap: 12, height: 56, paddingHorizontal: 14, borderRadius: 14, backgroundColor: t.soft}}>
            <Icon name="mushaf" size={20} color={t.brand} />
            <T size={15} w="sb" c={t.brand} style={{flex: 1}}>Go to page {askPage}</T>
            <T size={12.5} c={t.muted}>{surahInfo(pageRuns(askPage)[0]?.[0] ?? 1).en}</T>
          </Pressable>
        )}
      </View>} />
  );
}
