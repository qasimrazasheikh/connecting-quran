/** Surah reader: ayah cards, follows the reciter, remembers the reading place. */
import {router, useLocalSearchParams} from 'expo-router';
import {useCallback, useEffect, useMemo, useRef} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View, type ListViewToken} from 'react-native';
import {arFont, AyahCard} from '@/components/AyahCard';
import {Icon, IconBtn, T, TopBar} from '@/components/ui';
import {FATIHAH, surahInfo, useSurah, uthBody, type Ayah} from '@/lib/data';
import {usePlayer} from '@/lib/player';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';

/** If the params change in place (navigating to the reader that is already open), a new surah or ayah gets a fresh reader. */
export default function ReaderRoute(){
  const {n, a} = useLocalSearchParams<{n: string; a?: string}>();
  return <Reader key={`${n}:${a ?? ''}`} s={+n} start={a ? +a : 1} />;
}

function Reader({s, start}: {s: number; start: number}){
  const {t, settings: st, marks, read} = useApp();
  const p = usePlayer();
  const list = useRef<FlatList<Ayah>>(null);
  const loaded = useSurah(s), ayahs = useMemo(() => loaded ?? [], [loaded]);
  const info = surahInfo(s);
  const playingHere = p.cur?.s === s ? p.cur.a : 0;

  const goTo = useCallback((ay: number, animated = true) => {
    if (ay > 0 && ay <= ayahs.length) list.current?.scrollToIndex({index: ay - 1, animated, viewPosition: 0.1});
  }, [ayahs.length]);
  // Jump to the asked-for ayah once the surah has loaded
  useEffect(() => { if (loaded && start > 1) setTimeout(() => goTo(start, false), 50); }, [!!loaded]); // eslint-disable-line react-hooks/exhaustive-deps
  // Follow the reciter
  useEffect(() => { if (st.follow && playingHere) goTo(playingHere); }, [playingHere]); // eslint-disable-line react-hooks/exhaustive-deps

  // The first ayah on screen is the reading place
  // (FlatList needs this to stay the same function: `read` and `s` don't change while the screen is open)
  const onViewable = useCallback(({viewableItems}: {viewableItems: ListViewToken[]}) => {
    const first = viewableItems.find(v => v.isViewable)?.item as Ayah | undefined;
    if (first) read(s, first.a);
  }, [read, s]);

  const onPlay = useCallback((ay: number) => p.play(s, ay), [p, s]);
  const bism = s !== 1 && s !== 9 ? (st.script === 'indopak' ? FATIHAH[0].ip : uthBody(FATIHAH[0].uth)) : '';
  const markedSet = useMemo(() => new Set(marks.filter(m => m.s === s).map(m => m.a)), [marks, s]);

  const header = (
    <View style={{margin: 12, marginTop: 10, padding: 14, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, alignItems: 'center'}}>
      <Text style={{fontFamily: F.names, fontSize: 54, color: t.brand, includeFontPadding: false}}>{String(s).padStart(3, '0')}</Text>
      <T size={13} c={t.muted}>{info.meaning} · {info.rev} · {info.ayahs} ayahs</T>
      {bism ? <Text style={{fontFamily: arFont(st), fontSize: st.arSize - 2, lineHeight: Math.round(st.arSize * 2), color: t.text, marginTop: 6, includeFontPadding: false}}>{bism}</Text> : null}
      <Pressable onPress={() => p.play(s, 1)} style={{marginTop: 10, height: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: t.brand, flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <Icon name="play" size={16} color={t.onBrand} /><T size={14} w="sb" c={t.onBrand}>Play surah</T>
      </Pressable>
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: t.bg}}>
      <TopBar title={info.en} sub={`Juz ${ayahs[0]?.j} · Page ${ayahs[0]?.p} · ${info.rev}`} right={<>
        <IconBtn name="headphones" label="Open player" onPress={() => { if (!p.cur) p.play(s, 1); router.push('/player'); }} />
        <Pressable accessibilityLabel="Text and translation settings" onPress={() => router.push('/settings')} style={{width: 44, height: 44, alignItems: 'center', justifyContent: 'center'}}>
          <T size={16} w="sb">Aa</T>
        </Pressable>
      </>} />
      <FlatList ref={list} data={ayahs} keyExtractor={x => String(x.a)} ListHeaderComponent={header}
        ListEmptyComponent={<ActivityIndicator color={t.brand} style={{padding: 40}} />}
        renderItem={({item}) => <AyahCard s={s} ayah={item} playing={item.a === playingHere} marked={markedSet.has(item.a)} onPlay={onPlay} />}
        extraData={[playingHere, markedSet, st]} initialNumToRender={8} windowSize={9} removeClippedSubviews
        onViewableItemsChanged={onViewable} viewabilityConfig={{itemVisiblePercentThreshold: 40}}
        onScrollToIndexFailed={e => { list.current?.scrollToOffset({offset: e.averageItemLength * e.index, animated: false}); setTimeout(() => goTo(e.index + 1, false), 120); }}
        contentContainerStyle={{paddingBottom: 24}} />
    </View>
  );
}
