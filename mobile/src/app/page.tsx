/**
 * Mushaf pages (opened from the Mushaf tab's surah list), one under another: scroll down for the next page.
 * Full view: only the page shows. A tap anywhere brings the controls back for a few seconds; a long-press on an ayah
 * selects it and shows its translation in a panel at the bottom.
 */
import {activateKeepAwakeAsync, deactivateKeepAwake} from 'expo-keep-awake';
import {router, useFocusEffect, useLocalSearchParams} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, ScrollView, Text, View, type GestureResponderEvent, type ListViewToken} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {arFont, arText} from '@/components/AyahCard';
import JustifiedRtl from '@/components/JustifiedRtl';
import {Icon, T, TopBar} from '@/components/ui';
import {ayahNow, endMark, FATIHAH, PAGE_COUNT, pageOf, pageRuns, surahInfo, usePage, uthBody, type Ayah} from '@/lib/data';
import {openAyah} from '@/lib/nav';
import {usePlayer} from '@/lib/player';
import {useApp, type Settings} from '@/lib/store';
import {F, type Theme} from '@/lib/theme';

/** How long the controls stay after a tap. */
const SHOW_MS = 4000;
/** The translation panel takes at most this share of the screen, docked at the bottom. */
const PANEL = 0.4;
/** A page counts as the current one once a third of it is on screen. */
const VIEWABLE = {itemVisiblePercentThreshold: 33};

/** One page in its gold frame, with its number under it. A long-press reports the ayah and where on screen it was pressed. */
const PageView = memo(function PageView({page, st, t, sel, onSel, onTap}:
  {page: number; st: Settings; t: Theme; sel: string; onSel: (k: string, y: number) => void; onTap: () => void}){
  const items = usePage(page);
  // While its surahs load, a page holds roughly its final height so scrolling doesn't jump
  if (!items) return <View style={{height: 700, alignItems: 'center', justifyContent: 'center'}}><ActivityIndicator color={t.brand} /></View>;
  // Consecutive ayahs of one surah flow as one paragraph; a surah's first ayah starts a new block with its header
  const blocks: {s: number; head: boolean; ayahs: Ayah[]}[] = [];
  for (const {s, ayah} of items){
    const last = blocks[blocks.length - 1];
    if (last && last.s === s && ayah.a !== 1) last.ayahs.push(ayah); else blocks.push({s, head: ayah.a === 1, ayahs: [ayah]});
  }
  const size = st.arSize - 3, bism = st.script === 'indopak' ? FATIHAH[0].ip : uthBody(FATIHAH[0].uth);
  return (
    <View style={{paddingBottom: 6}}>
      <Pressable onPress={onTap} style={{padding: 5, borderWidth: 1.5, borderColor: t.mark, borderRadius: 14, backgroundColor: t.surface}}>
        <View style={{padding: 12, paddingTop: 8, borderWidth: 1, borderColor: t.dark ? t.line : '#e8d9a8', borderRadius: 10, gap: 6}}>
          {blocks.map((b, i) => (
            <View key={i} style={{gap: 4}}>
              {b.head && <View style={{height: 54, borderRadius: 8, backgroundColor: t.soft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14}}>
                <T size={11} w="sb" c={t.brand}>{surahInfo(b.s).ayahs} ayahs</T>
                <Text style={{fontFamily: F.names, fontSize: 44, color: t.brand2, includeFontPadding: false}}>{String(b.s).padStart(3, '0')}</Text>
                <T size={11} w="sb" c={t.brand}>{surahInfo(b.s).rev}</T>
              </View>}
              {b.head && b.s !== 1 && b.s !== 9 && <Text style={{fontFamily: arFont(st), fontSize: size - 1, lineHeight: Math.round(size * 2), textAlign: 'center', color: t.text, includeFontPadding: false}}>{bism}</Text>}
              <JustifiedRtl style={{fontFamily: arFont(st), fontSize: size, lineHeight: Math.round(size * (st.script === 'indopak' ? 2.25 : 2)), color: t.text, includeFontPadding: false}}
                segs={b.ayahs.flatMap(ay => {
                  const k = `${b.s}:${ay.a}`, onLongPress = (e: GestureResponderEvent) => onSel(k, e.nativeEvent.pageY), hl = sel === k ? {backgroundColor: t.highlight} : undefined;
                  return [
                    {key: k, text: arText(ay, st) + ' ', style: hl, onPress: onTap, onLongPress},
                    {key: k + 'e', text: endMark(ay.a) + ' ', style: {fontFamily: F.uth, color: t.mark, ...hl}, onPress: onTap, onLongPress},
                  ];
                })} />
            </View>
          ))}
        </View>
      </Pressable>
      <T size={11.5} w="sb" c={t.muted} style={{textAlign: 'center', paddingVertical: 8}}>Page {page}</T>
    </View>
  );
});

/** The selected ayah's translation, in a panel docked at the bottom; the ayah itself stays highlighted on the page above. */
function TranslationPanel({s, a, ayah, h, bottom, t}: {s: number; a: number; ayah: Ayah; h: number; bottom: number; t: Theme}){
  return (
    <View style={{position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: h * PANEL, padding: 16, paddingBottom: bottom + 12, gap: 6,
      borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: t.player,
      elevation: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: {width: 0, height: -4}}}>
      <View style={{flexDirection: 'row', alignItems: 'center'}}>
        <T size={12} w="sb" c="#f4c04e" style={{flex: 1}}>{surahInfo(s).en} {s}:{a}</T>
        <Pressable onPress={() => openAyah(s, a)} style={{paddingHorizontal: 8, height: 32, justifyContent: 'center'}}><T size={13} w="sb" c={t.heroMuted}>Open in reader</T></Pressable>
        <Pressable onPress={() => router.push({pathname: '/tafseer', params: {s, a}})} style={{paddingHorizontal: 8, height: 32, justifyContent: 'center'}}><T size={13} w="sb" c={t.heroMuted}>Tafseer ›</T></Pressable>
      </View>
      <ScrollView style={{flexGrow: 0}}>
        <Text style={{fontFamily: F.ur, fontSize: 18, lineHeight: 40, color: t.playerText, textAlign: 'right', includeFontPadding: false}}>{ayah.ur}</Text>
      </ScrollView>
    </View>
  );
}

/** Keeps the screen on while a Mushaf page is open. (Done by hand: on the web, releasing the lock before it finished
 *  taking hold throws, which useKeepAwake doesn't catch.) */
function useStayAwake(){
  useEffect(() => {
    const tag = 'mushaf', on = activateKeepAwakeAsync(tag).catch(() => {});
    return () => { on.then(() => deactivateKeepAwake(tag)).catch(() => {}); };
  }, []);
}

export default function MushafPage(){
  useStayAwake();
  const {t, settings: st, history, setImmersive, tips, tipSeen} = useApp();
  const player = usePlayer();
  const insets = useSafeAreaInsets();
  const {p} = useLocalSearchParams<{p?: string}>();
  const all = useMemo(() => Array.from({length: PAGE_COUNT}, (_, i) => i + 1), []);
  const list = useRef<FlatList<number>>(null);
  // Open at the asked-for page, else where the reader left off
  const startPage = p ? +p : history[0] ? pageOf(history[0].s, history[0].a) : 1;
  const startIdx = Math.min(PAGE_COUNT, Math.max(1, startPage)) - 1;
  const [idx, setIdx] = useState(startIdx);
  // The long-pressed ayah ("s:a"), whose translation shows in the bottom panel
  const [sel, setSel] = useState('');
  const [h, setH] = useState(0);
  // The list starts at the opened page (page heights aren't known in advance, so a long scroll to it would land
  // wrongly); earlier pages are added above it as the reader scrolls up, keeping the view steady.
  const [base, setBase] = useState(startIdx);
  const shown = useMemo(() => all.slice(base), [all, base]);
  // A list opened at a page counts as "at its start", so earlier pages are only added once the reader drags it
  const [dragged, setDragged] = useState(false);
  // A new target page (from an ayah's "Mushaf page" action): start the list there again (reset during render)
  const [target, setTarget] = useState(startIdx);
  if (target !== startIdx){ setTarget(startIdx); setIdx(startIdx); setBase(startIdx); setSel(''); setDragged(false); }
  const page = all[idx], [ps, pa] = pageRuns(page)[0] ?? [1, 1];
  // The selected ayah is on screen, so its surah is already in memory
  const [ss, sa] = sel.split(':').map(Number), chosen = ss ? ayahNow(ss, sa) : undefined;
  // The page at the top of the screen is the current page (FlatList needs this callback to stay the same function)
  const onViewable = useCallback(({viewableItems}: {viewableItems: ListViewToken[]}) => {
    const first = viewableItems.find(v => v.isViewable)?.item as number | undefined;
    if (first) setIdx(first - 1);
  }, []);
  // Long-press: select the ayah, and if it would sit behind the translation panel, scroll it up into the open part
  const offset = useRef(0);
  const select = useCallback((k: string, y: number) => {
    const next = sel === k ? '' : k;
    setSel(next);
    if (next && y > h * (1 - PANEL) - 40) setTimeout(() => list.current?.scrollToOffset({offset: offset.current + y - h * 0.3, animated: true}), 50);
  }, [sel, h]);
  // Pages are heavy to lay out (Nastaliq shaping), so the list builds only the pages near the screen, a couple at a time

  // Full view: the controls show after a tap and step aside again by themselves
  const [controls, setControls] = useState(false);
  const tip = !tips.includes('mushaf');
  // A tap on the text can reach both the text and the page frame around it; one tap must toggle only once
  const lastTap = useRef(0);
  const onTap = useCallback(() => {
    if (Date.now() - lastTap.current < 350) return;
    lastTap.current = Date.now();
    if (tip) tipSeen('mushaf');
    // With a translation open, a tap just closes it
    if (sel){ setSel(''); return; }
    setControls(c => !c);
  }, [tip, tipSeen, sel]);
  useEffect(() => {
    if (!controls) return;
    const timer = setTimeout(() => setControls(false), SHOW_MS);
    return () => clearTimeout(timer);
  }, [controls, idx]);
  // The tab and recitation bars step aside while this screen is in front and in full view
  useFocusEffect(useCallback(() => { setImmersive(!controls); return () => setImmersive(false); }, [controls, setImmersive]));

  return (
    <View style={{flex: 1, backgroundColor: t.bg}} onLayout={e => setH(e.nativeEvent.layout.height)}>
      <StatusBar hidden={!controls} />
      <FlatList ref={list} data={shown} keyExtractor={String} showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => { if (!dragged) setDragged(true); }}
        onStartReached={() => { if (dragged && base > 0) setBase(b => Math.max(0, b - 10)); }} onStartReachedThreshold={1.5}
        maintainVisibleContentPosition={{minIndexForVisible: 0}}
        windowSize={5} initialNumToRender={2} maxToRenderPerBatch={2} removeClippedSubviews
        onViewableItemsChanged={onViewable} viewabilityConfig={VIEWABLE}
        scrollEventThrottle={32} onScroll={e => { offset.current = e.nativeEvent.contentOffset.y; }}
        contentContainerStyle={{padding: 12, paddingTop: insets.top + 8}}
        // Room under the last page while the panel is open, so even its last line can be scrolled clear of the panel
        ListFooterComponent={<View style={{height: sel ? h * PANEL + 24 : 16}} />}
        renderItem={({item}) => <PageView page={item} st={st} t={t} sel={item === chosen?.p ? sel : ''} onSel={select} onTap={onTap} />} />

      {controls && <>
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, elevation: 6, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8}}>
          <TopBar title={surahInfo(ps).en} sub={`Page ${page} of ${PAGE_COUNT}${ayahNow(ps, pa) ? ` · Juz ${ayahNow(ps, pa)!.j}` : ''}`} />
        </View>
        <View style={{paddingHorizontal: 16, paddingVertical: 8, gap: 6, backgroundColor: t.bg}}>
          <View style={{height: 6, borderRadius: 3, backgroundColor: t.line, overflow: 'hidden', transform: [{scaleX: -1}]}}>
            <View style={{width: `${Math.max(1, page / PAGE_COUNT * 100)}%`, height: '100%', backgroundColor: t.brand}} />
          </View>
          <T size={11.5} c={t.muted} style={{textAlign: 'center'}}>Page {page} of {PAGE_COUNT}</T>
        </View>
      </>}

      {chosen && <TranslationPanel s={ss} a={sa} ayah={chosen} h={h} bottom={controls ? 0 : insets.bottom} t={t} />}

      {/* In full view a playing recitation keeps one small control */}
      {!controls && player.cur && (
        <Pressable accessibilityLabel={player.playing ? 'Pause recitation' : 'Resume recitation'} onPress={player.toggle}
          style={{position: 'absolute', left: 16, bottom: insets.bottom + 16, width: 48, height: 48, borderRadius: 24, backgroundColor: t.player,
            alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8}}>
          <Icon name={player.playing ? 'pause' : 'play'} size={18} color="#f4c04e" />
        </Pressable>
      )}
      {tip && !controls && (
        <View pointerEvents="none" style={{position: 'absolute', left: 24, right: 24, bottom: insets.bottom + 24, padding: 12, borderRadius: 14, backgroundColor: t.player}}>
          <T size={13} c={t.playerText} style={{textAlign: 'center'}}>Tap to show controls · long-press an ayah for its translation</T>
        </View>
      )}
    </View>
  );
}
