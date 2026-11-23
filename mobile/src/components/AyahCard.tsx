/** One ayah: number, actions, Arabic (tap a word for its card), Urdu and English translations. */
import {router} from 'expo-router';
import {memo} from 'react';
import {Pressable, Text, View} from 'react-native';
import {BASE, endMark, gapMarks, uthBody, wordTokens, type Ayah} from '@/lib/data';
import {useApp, type Settings} from '@/lib/store';
import {F, type Theme} from '@/lib/theme';
import {Icon, T} from './ui';

/** Line heights per script: Nastaliq needs far more room than Naskh, or Android clips the marks. */
export const arLine = (st: Settings) => Math.round(st.arSize * (st.script === 'indopak' ? 2.15 : 1.95));
export const arFont = (st: Settings) => st.script === 'indopak' ? F.ip : F.uth;
/** Indo-Pak text with its ayah-end stop sign put back after the last word (gapMarks places it in the gap). */
export const arText = (ayah: Ayah, st: Settings) => st.script === 'indopak' ? gapMarks(ayah.ipStop ? `${ayah.ip} ${ayah.ipStop}` : ayah.ip) : uthBody(ayah.uth);

/** The Arabic of one ayah with each word tappable, or word-by-word blocks when that setting is on. */
export function ArabicText({s, ayah, st, t, color}: {s: number; ayah: Ayah; st: Settings; t: Theme; color?: string}){
  const {word, setWord} = useApp();
  const text = arText(ayah, st), toks = wordTokens(text, ayah.w.length);
  // The word whose card is open is highlighted (the card clears it when it closes)
  const key = (i: number) => `${s}:${ayah.a}:${i}`;
  const openWord = (i: number) => { setWord(key(i)); router.push({pathname: '/word', params: {s, a: ayah.a, i}}); };
  const base = {fontFamily: arFont(st), fontSize: st.arSize, lineHeight: arLine(st), color: color ?? t.text, includeFontPadding: false} as const;
  const end = <Text style={{fontFamily: F.uth, color: t.mark}}>{endMark(ayah.a)}</Text>;

  if (st.wbw && toks) return (
    <View style={{flexDirection: 'row-reverse', flexWrap: 'wrap', rowGap: 4, columnGap: 10}}>
      {toks.map((w, i) => (
        <Pressable key={i} onPress={() => openWord(i)} style={{alignItems: 'center', borderRadius: 8, paddingHorizontal: 2, backgroundColor: word === key(i) ? t.highlight : undefined}}>
          <Text style={base}>{w}</Text>
          <Text style={st.wbwLang === 'ur'
            ? {fontFamily: F.ur, fontSize: 13, lineHeight: 26, color: t.muted, includeFontPadding: false}
            : {fontFamily: F.r, fontSize: 11.5, color: t.muted, maxWidth: 110, textAlign: 'center'}}>{ayah.w[i][st.wbwLang]}</Text>
        </Pressable>
      ))}
      <Text style={[base, {alignSelf: 'flex-start'}]}>{end}</Text>
    </View>
  );
  return (
    <Text style={[base, {writingDirection: 'rtl', textAlign: 'right'}]}>
      {toks ? toks.map((w, i) => <Text key={i} onPress={() => openWord(i)} suppressHighlighting={false} style={word === key(i) ? {backgroundColor: t.highlight} : undefined}>{w}{w.includes(BASE) ? '  ' : ' '}</Text>) : text + ' '}
      {end}
    </Text>
  );
}

type Props = {s: number; ayah: Ayah; playing: boolean; marked: boolean; onPlay: (a: number) => void};
export const AyahCard = memo(function AyahCard({s, ayah, playing, marked, onPlay}: Props){
  const {t, settings: st, toggleMark} = useApp();
  const openActions = () => router.push({pathname: '/actions', params: {s, a: ayah.a}});
  return (
    <Pressable onLongPress={openActions} delayLongPress={350} style={{
      marginHorizontal: 12, marginBottom: 10, padding: 14, paddingTop: 10, borderRadius: 16, gap: 8,
      backgroundColor: playing ? t.soft : t.surface, borderWidth: 1.5, borderColor: playing ? t.brand : t.line,
    }}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 2}}>
        <View style={{height: 28, paddingHorizontal: 10, borderRadius: 8, backgroundColor: playing ? t.surface : t.soft, justifyContent: 'center'}}>
          <T size={12.5} w="sb" c={t.brand}>{s}:{ayah.a}</T>
        </View>
        {playing && <T size={12} w="sb" c={t.brand} style={{marginLeft: 6}}>Playing</T>}
        <View style={{flex: 1}} />
        <Pressable onPress={() => router.push({pathname: '/tafseer', params: {s, a: ayah.a}})}
          style={{height: 32, paddingHorizontal: 10, borderRadius: 8, backgroundColor: playing ? t.surface : t.soft, justifyContent: 'center'}}>
          <T size={13} w="sb" c={t.brand}>Tafseer</T>
        </Pressable>
        <Pressable accessibilityLabel={`Play ayah ${ayah.a}`} onPress={() => onPlay(ayah.a)} style={{width: 40, height: 40, alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="play" size={19} color={t.muted} />
        </Pressable>
        <Pressable accessibilityLabel={marked ? 'Remove bookmark' : 'Bookmark'} onPress={() => toggleMark(s, ayah.a)} style={{width: 40, height: 40, alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="bookmark" size={19} color={marked ? t.mark : t.muted} fill={marked ? t.mark : undefined} />
        </Pressable>
        <Pressable accessibilityLabel="Ayah actions" onPress={openActions} style={{width: 36, height: 40, alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="more" size={19} color={t.muted} />
        </Pressable>
      </View>
      <ArabicText s={s} ayah={ayah} st={st} t={t} />
      {st.showUr && <Text style={{fontFamily: F.ur, fontSize: st.trSize + 3, lineHeight: Math.round((st.trSize + 3) * 2.2), color: t.text, writingDirection: 'rtl', textAlign: 'right', includeFontPadding: false}}>{ayah.ur}</Text>}
      {st.showEn && <T size={st.trSize - 1} c={t.muted} style={{lineHeight: Math.round((st.trSize - 1) * 1.55)}}>{ayah.en}</T>}
    </Pressable>
  );
});
