/** Ayah actions (bottom sheet, from long-press or ⋯): play, repeat, tafseer, bookmark, copy, share, Mushaf. */
import * as Clipboard from 'expo-clipboard';
import {router, useLocalSearchParams} from 'expo-router';
import {useState} from 'react';
import {ActivityIndicator, Pressable, Share, Text, View} from 'react-native';
import {arFont, arText} from '@/components/AyahCard';
import {Badge, Icon, Sheet, T, type IconName} from '@/components/ui';
import {SITE, useTranslations} from '@/lib/api';
import {endMark, surahInfo, useSurah, type Ayah} from '@/lib/data';
import {usePlayer} from '@/lib/player';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';

export default function Actions(){
  const q = useLocalSearchParams<{s: string; a: string}>();
  const s = +q.s, a = +q.a;
  const ayah = useSurah(s)?.[a - 1];
  if (!ayah) return <Sheet label="Ayah actions"><ActivityIndicator style={{padding: 40}} /></Sheet>;
  return <ActionList s={s} a={a} ayah={ayah} />;
}

function ActionList({s, a, ayah}: {s: number; a: number; ayah: Ayah}){
  const {t, settings: st, isMarked, toggleMark, setWord} = useApp();
  const p = usePlayer();
  const info = surahInfo(s);
  const lines = useTranslations(s, st.trans)(ayah).map(l => l.text).filter(Boolean);
  const text = `${arText(ayah, st)}\n\n${lines.map(l => l + '\n\n').join('')}${info.en} ${s}:${a} · ${SITE}/surah/${s}/${a}`;
  const go = (fn: () => void) => () => { router.back(); fn(); };
  const [copied, setCopied] = useState(false);

  const items: {label: string; icon: IconName; on?: boolean; run: () => void}[] = [
    {label: 'Play from here', icon: 'play', on: true, run: go(() => p.play(s, a))},
    {label: 'Repeat ayah ×3', icon: 'repeat', run: go(() => { p.setRepeat(3); p.play(s, a); })},
    {label: 'Tafseer', icon: 'tafseer', run: go(() => router.push({pathname: '/tafseer', params: {s, a}}))},
    {label: isMarked(s, a) ? 'Bookmarked' : 'Bookmark', icon: 'bookmark', run: () => toggleMark(s, a)},
    {label: 'Word card', icon: 'lines', run: go(() => { setWord(`${s}:${a}:0`); router.push({pathname: '/word', params: {s, a, i: 0}}); })},
    {label: 'Share', icon: 'share', run: () => Share.share({message: text})},
    {label: copied ? 'Copied' : 'Copy', icon: copied ? 'check' : 'copy', run: () => Clipboard.setStringAsync(text).then(() => setCopied(true))},
    {label: 'Mushaf page', icon: 'mushaf', run: go(() => router.navigate({pathname: '/page', params: {p: ayah.p}}))},
  ];
  return (
    <Sheet label={`Actions for ayah ${s}:${a}`}>
      <View style={{gap: 2}}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}><T size={17} w="b">{info.en}</T><Badge label={`${s}:${a}`} /></View>
        <Text numberOfLines={2} style={{fontFamily: arFont(st), fontSize: 22, lineHeight: 46, color: t.text, textAlign: 'right', includeFontPadding: false}}>
          {arText(ayah, st)} <Text style={{fontFamily: F.uth, color: t.mark}}>{endMark(a)}</Text>
        </Text>
      </View>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
        {items.map(x => (
          <Pressable key={x.label} onPress={x.run} style={({pressed}) => ({width: '23.5%', height: 78, borderRadius: 16, alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: x.on ? t.brand : t.bg, opacity: pressed ? 0.7 : 1})}>
            <Icon name={x.icon} size={22} color={x.on ? t.onBrand : x.icon === 'bookmark' && isMarked(s, a) ? t.mark : t.text}
              fill={x.icon === 'bookmark' && isMarked(s, a) ? t.mark : undefined} />
            <T size={11.5} w="sb" c={x.on ? t.onBrand : t.text} style={{textAlign: 'center'}}>{x.label}</T>
          </Pressable>
        ))}
      </View>
    </Sheet>
  );
}
