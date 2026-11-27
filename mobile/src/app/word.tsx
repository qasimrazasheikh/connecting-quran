/** Word card (bottom sheet): meaning, transliteration, root, lemma and grammar of one word. */
import {useAudioPlayer} from 'expo-audio';
import {router, useLocalSearchParams} from 'expo-router';
import {useEffect, useMemo} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {arFont, arText} from '@/components/AyahCard';
import {Badge, Btn, Sheet, T} from '@/components/ui';
import {surahInfo, useMorph, useSurah, wordTokens, type Ayah, type Morph} from '@/lib/data';
import {wordAudio} from '@/lib/api';
import {describeSeg} from '@/lib/grammar';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';


/** The surah and its grammar load first (they are usually already in memory from the reader). */
export default function WordCard(){
  const q = useLocalSearchParams<{s: string; a: string; i: string}>();
  const s = +q.s, a = +q.a, i = +q.i;
  const ayah = useSurah(s)?.[a - 1], morph = useMorph(s);
  if (!ayah || !morph) return <Sheet label="Word details"><ActivityIndicator style={{padding: 40}} /></Sheet>;
  return <WordDetails s={s} a={a} i={i} ayah={ayah} morph={morph} />;
}

function WordDetails({s, a, i, ayah, morph}: {s: number; a: number; i: number; ayah: Ayah; morph: Morph}){
  const {t, settings: st, setWord} = useApp();
  const w = ayah.w[i];
  // The reader highlights this word while the card is open; clear it when the card closes
  useEffect(() => () => setWord(''), [setWord]);
  const shown = wordTokens(arText(ayah, st), ayah.w.length)?.[i] ?? w.ip;
  const audio = useAudioPlayer(wordAudio(s, a, i + 1));

  const segs = useMemo(() => (morph[`${a}:${i + 1}`] ?? []).map(([text, pos, tags]) => describeSeg({text, pos, tags: tags.split('|')})), [morph, a, i]);
  // The stem is the segment that carries the root (or the last one); prefixes and suffixes are listed after it
  const stem = segs.find(x => x.root) ?? segs[segs.length - 1];
  const chips = stem ? [stem.name, ...stem.details, ...segs.filter(x => x !== stem).map(x => x.name)] : [];
  const step = (d: number) => { setWord(`${s}:${a}:${i + d}`); router.setParams({i: String(i + d)}); };

  return (
    <Sheet label="Word details">
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 14}}>
        <View style={{flex: 1, gap: 2}}>
          <T size={12} c={t.muted}>{surahInfo(s).en} {s}:{a} · word {i + 1} of {ayah.w.length}</T>
          <T size={20} w="sb">{w.tr}</T>
          <T size={15} c={t.muted}>{w.en}</T>
        </View>
        <Text style={{fontFamily: arFont(st), fontSize: 42, lineHeight: 84, color: t.brand2, includeFontPadding: false}}>{shown}</Text>
      </View>
      <View style={{flexDirection: 'row', gap: 10}}>
        <Btn label="Hear word" icon="speaker" style={{flex: 1}} onPress={() => { audio.seekTo(0); audio.play(); }} />
        <Btn label="Ayah tafseer" ghost style={{flex: 1}} onPress={() => { router.back(); router.push({pathname: '/tafseer', params: {s, a}}); }} />
      </View>
      <ScrollView style={{flexGrow: 0}} contentContainerStyle={{gap: 14}}>
        <View style={{flexDirection: 'row', gap: 10}}>
          <View style={{flex: 1, padding: 12, borderRadius: 14, backgroundColor: t.bg, gap: 2}}>
            <T size={12} c={t.muted}>Urdu meaning</T>
            <Text style={{fontFamily: F.ur, fontSize: 19, lineHeight: 40, color: t.text, textAlign: 'right', includeFontPadding: false}}>{w.ur}</Text>
          </View>
          <View style={{flex: 1, padding: 12, borderRadius: 14, backgroundColor: t.bg, gap: 2}}>
            <T size={12} c={t.muted}>Root · lemma</T>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={{fontFamily: F.uth, fontSize: 22, lineHeight: 40, color: t.text}}>{stem?.root ? [...stem.root].join(' ') : '—'}</Text>
              <Text style={{fontFamily: F.uth, fontSize: 22, lineHeight: 40, color: t.text}}>{stem?.lemma || ''}</Text>
            </View>
          </View>
        </View>
        {chips.length > 0 && <View style={{gap: 8}}>
          <T size={12} w="sb" c={t.muted} style={{letterSpacing: 1}}>GRAMMAR</T>
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 6}}>
            {chips.map((c, k) => <Badge key={k} label={c} />)}
          </View>
        </View>}
      </ScrollView>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: t.line}}>
        <Pressable disabled={i === 0} onPress={() => step(-1)} style={{height: 48, justifyContent: 'center', opacity: i === 0 ? 0.35 : 1}}><T w="sb" c={t.brand}>Previous word</T></Pressable>
        <Pressable disabled={i >= ayah.w.length - 1} onPress={() => step(1)} style={{height: 48, justifyContent: 'center', opacity: i >= ayah.w.length - 1 ? 0.35 : 1}}><T w="sb" c={t.brand}>Next word</T></Pressable>
      </View>
    </Sheet>
  );
}
