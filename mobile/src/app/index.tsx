/** Home: continue reading, find a surah, the surah list. */
import {Redirect, router} from 'expo-router';
import {useMemo, useState} from 'react';
import {FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon, IconBtn, Segmented, T} from '@/components/ui';
import {juzStart, SURAHS, surahInfo, type SurahInfo} from '@/lib/data';
import {ago, useApp} from '@/lib/store';
import {openAyah} from '@/lib/nav';
import {F} from '@/lib/theme';

const p3 = (n: number) => String(n).padStart(3, '0');

/** The app opens here: first run goes to the welcome setup. */
export default function HomeRoute(){
  const {onboarded} = useApp();
  return onboarded ? <Home /> : <Redirect href="/welcome" />;
}

function Home(){
  const {t, history} = useApp();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'surah' | 'juz'>('surah');
  const last = history[0];

  const list = useMemo(() => {
    const v = q.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return v ? SURAHS.filter(s => String(s.n) === v || s.en.toLowerCase().replace(/[^a-z]/g, '').includes(v)) : SURAHS;
  }, [q]);
  // "2:255" jumps straight to the ayah
  const jump = () => { const m = q.match(/^\s*(\d{1,3})\s*[:.]\s*(\d{1,3})\s*$/); if (m && +m[1] >= 1 && +m[1] <= 114 && +m[2] >= 1 && +m[2] <= surahInfo(+m[1]).ayahs) openAyah(+m[1], +m[2]); };

  const header = (
    <View style={{gap: 16, paddingBottom: 12}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 8}}>
        <View style={{width: 36, height: 36, borderRadius: 10, backgroundColor: '#1b1d5e', alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="book" size={20} color="#f6cf6a" />
        </View>
        <T size={18} w="b" style={{flex: 1}}>Connecting Quran</T>
        <IconBtn name="sliders" label="Settings" bordered onPress={() => router.push('/settings')} />
      </View>

      <Pressable onPress={() => openAyah(last?.s ?? 1, last?.a)} style={{padding: 18, borderRadius: 20, backgroundColor: t.hero, gap: 10}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <T size={12} w="sb" c="#f6cf6a" style={{letterSpacing: 1}}>{last ? 'CONTINUE READING' : 'START READING'}</T>
          {last && <T size={12} c={t.heroMuted}>{ago(last.at)}</T>}
        </View>
        <View style={{flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between'}}>
          <View>
            <T size={22} w="b" c={t.heroText}>{surahInfo(last?.s ?? 1).en}</T>
            <T size={14} c={t.heroMuted}>{last ? `Ayah ${last.a} of ${surahInfo(last.s).ayahs}` : 'The Opener · 7 ayahs'}</T>
          </View>
          <Text style={{fontFamily: F.names, fontSize: 44, color: '#f6cf6a', includeFontPadding: false}}>{p3(last?.s ?? 1)}</Text>
        </View>
        {last && <View style={{height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden'}}>
          <View style={{width: `${Math.round(last.a / surahInfo(last.s).ayahs * 100)}%`, height: '100%', backgroundColor: '#f4c04e'}} />
        </View>}
        <View style={{alignSelf: 'flex-start', height: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#f4c04e', flexDirection: 'row', alignItems: 'center', gap: 6}}>
          <T size={14} w="sb" c="#0b0d1d">{last ? 'Resume' : 'Open Al-Fatihah'}</T><Icon name="arrow" size={16} color="#0b0d1d" />
        </View>
      </Pressable>

      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface}}>
        <Icon name="search" size={18} color={t.muted} />
        <TextInput value={q} onChangeText={setQ} onSubmitEditing={jump} placeholder="Surah name, number or 2:255" placeholderTextColor={t.muted}
          returnKeyType="go" style={{flex: 1, fontFamily: F.r, fontSize: 15, color: t.text}} />
      </View>
      <Segmented value={mode} onChange={setMode} options={[{v: 'surah', label: 'Surah'}, {v: 'juz', label: 'Juz'}]} />
    </View>
  );

  const row = ({item: s}: {item: SurahInfo}) => {
    return (
      <Pressable onPress={() => openAyah(s.n)} style={{flexDirection: 'row', alignItems: 'center', gap: 12, height: 64, paddingHorizontal: 14,
        backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.surface2}}>
        <View style={{width: 38, height: 38, borderRadius: 10, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center'}}>
          <T size={14} w="sb" c={t.brand}>{s.n}</T>
        </View>
        <View style={{flex: 1}}>
          <T size={15} w="sb">{s.en}</T>
          <T size={12.5} c={t.muted} lines={1}>{s.meaning} · {s.rev} · {s.ayahs} ayahs</T>
        </View>
        <Text style={{fontFamily: F.names, fontSize: 32, color: t.brand2, includeFontPadding: false}}>{p3(s.n)}</Text>
      </Pressable>
    );
  };

  const juz = Array.from({length: 30}, (_, i) => i + 1);
  return mode === 'surah' ? (
    <FlatList data={list} keyExtractor={s => String(s.n)} renderItem={row} ListHeaderComponent={header} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: 20}} />
  ) : (
    <FlatList data={juz} keyExtractor={String} ListHeaderComponent={header} contentContainerStyle={{paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: 20}}
      renderItem={({item: j}) => {
        // Each juz opens in the reader at its first ayah
        const [js, ja] = juzStart(j);
        return (
          <Pressable onPress={() => openAyah(js, ja)} style={{flexDirection: 'row', alignItems: 'center', gap: 12, height: 60, paddingHorizontal: 14,
            backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.surface2}}>
            <View style={{width: 38, height: 38, borderRadius: 10, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center'}}><T size={14} w="sb" c={t.brand}>{j}</T></View>
            <View style={{flex: 1}}>
              <T size={15} w="sb">Juz {j}</T>
              <T size={12.5} c={t.muted}>Starts at {surahInfo(js).en} {js}:{ja}</T>
            </View>
          </Pressable>
        );
      }} />
  );
}
