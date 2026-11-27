/**
 * Surah reader: ayah cards, follows the reciter, remembers the reading place. The list starts at the opened ayah, so
 * it shows at once (ayah heights aren't known in advance, so scrolling to it was slow and landed a little off); the
 * ayahs before it are added above as the reader scrolls up.
 */
import {router, useLocalSearchParams} from 'expo-router';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View, type ListViewToken} from 'react-native';
import {arFont, AyahCard} from '@/components/AyahCard';
import GoToAyah from '@/components/GoToAyah';
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

  const [picking, setPicking] = useState(false);
  // The first ayah in the list; earlier ones are added once the reader drags (a list opened mid-surah is "at its start")
  const [base, setBase] = useState(Math.max(0, start - 1));
  const [dragged, setDragged] = useState(false);
  const shown = useMemo(() => ayahs.slice(base), [ayahs, base]);
  const goTo = useCallback((ay: number, animated = true) => {
    if (ay - 1 < base || ay > ayahs.length) return;
    list.current?.scrollToIndex({index: ay - 1 - base, animated, viewPosition: 0.1});
  }, [ayahs.length, base]);
  // Follow the reciter (a recitation stepped back above the list's start moves the start up to it, during render)
  if (st.follow && playingHere && playingHere - 1 < base) setBase(playingHere - 1);
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
      <TopBar title={info.en} onTitle={() => setPicking(true)} sub={`Juz ${ayahs[0]?.j} · Page ${ayahs[0]?.p} · ${info.rev}`} right={<>
        <IconBtn name="headphones" label="Open player" onPress={() => { if (!p.cur) p.play(s, 1); router.push('/player'); }} />
        <Pressable accessibilityLabel="Text and translation settings" onPress={() => router.push('/settings')} style={{width: 44, height: 44, alignItems: 'center', justifyContent: 'center'}}>
          <T size={16} w="sb">Aa</T>
        </Pressable>
      </>} />
      <FlatList ref={list} data={shown} keyExtractor={x => String(x.a)} ListHeaderComponent={base === 0 ? header : undefined}
        onScrollBeginDrag={() => { if (!dragged) setDragged(true); }}
        onStartReached={() => { if (dragged && base > 0) setBase(b => Math.max(0, b - 15)); }} onStartReachedThreshold={1}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}
        ListEmptyComponent={<ActivityIndicator color={t.brand} style={{padding: 40}} />}
        renderItem={({item}) => <AyahCard s={s} ayah={item} playing={item.a === playingHere} marked={markedSet.has(item.a)} onPlay={onPlay} />}
        extraData={[playingHere, markedSet, st]} initialNumToRender={8} windowSize={9} removeClippedSubviews
        onViewableItemsChanged={onViewable} viewabilityConfig={{itemVisiblePercentThreshold: 40}}
        onScrollToIndexFailed={e => { list.current?.scrollToOffset({offset: e.averageItemLength * e.index, animated: false}); setTimeout(() => goTo(base + e.index + 1, false), 120); }}
        contentContainerStyle={{paddingBottom: 24}} />
      <GoToAyah visible={picking} s={s} a={start} onPick={(ns, na) => router.setParams({n: String(ns), a: String(na)})} onClose={() => setPicking(false)} />
    </View>
  );
}
