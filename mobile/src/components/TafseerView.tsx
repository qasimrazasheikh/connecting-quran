/** Tafseer for one ayah, read live from connectingquran.com's API (the same notes the website shows). */
import {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {endMark, SITE, surahInfo, TAFSIRS, useSurah} from '@/lib/data';
import {usePlayer} from '@/lib/player';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';
import {arFont, arText} from './AyahCard';
import {Btn, Chip, IconBtn, T} from './ui';

/** The API returns plain text, sometimes with simple HTML; keep the paragraphs. */
const plain = (h: string) => h.replace(/<br\s*\/?>|<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();

export default function TafseerView({s, a, onStep, top}: {s: number; a: number; onStep: (a: number) => void; top?: number}){
  const {t, settings: st, set} = useApp();
  const p = usePlayer();
  const [tab, setTab] = useState<'tafseer' | 'related' | 'videos'>('tafseer');
  const cur = TAFSIRS.find(x => x.slug === st.tafsir) ?? TAFSIRS[0];
  const [lang, setLang] = useState<'ur' | 'en'>(cur.lang);
  const [res, setRes] = useState<{key: string; text?: string; error?: string}>({key: ''});
  const key = `${cur.slug}/${s}/${a}`;
  const ayah = useSurah(s)?.[a - 1], total = surahInfo(s).ayahs;

  useEffect(() => {
    let live = true;
    fetch(`${SITE}/api/tafsir/${key}`).then(r => r.json()).then(d => live && setRes({key, text: d.text ? plain(d.text) : undefined, error: d.error}))
      .catch(() => live && setRes({key, error: 'Could not reach connectingquran.com. Check the connection.'}));
    return () => { live = false; };
  }, [key]);

  const ur = cur.lang === 'ur';
  return (
    <View style={{flex: 1}}>
      <ScrollView contentContainerStyle={{padding: 12, paddingTop: top ?? 12, gap: 12, paddingBottom: 100}}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
          <View style={{flex: 1}}>
            <T size={17} w="b">{surahInfo(s).en} {s}:{a}</T>
            <T size={12} c={t.muted}>Tafseer · ayah {a} of {total}</T>
          </View>
          <IconBtn name="back" label="Previous ayah" bordered onPress={() => a > 1 && onStep(a - 1)} />
          <IconBtn name="fwd" label="Next ayah" bordered onPress={() => a < total && onStep(a + 1)} />
        </View>

        <View style={{flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: t.line}}>
          {(['tafseer', 'related', 'videos'] as const).map(x => (
            <Pressable key={x} onPress={() => setTab(x)} style={{flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2.5, borderBottomColor: tab === x ? t.brand : 'transparent'}}>
              <T size={14} w={tab === x ? 'sb' : 'm'} c={tab === x ? t.brand : t.muted}>{x === 'tafseer' ? 'Tafseer' : x === 'related' ? 'Related ayahs' : 'Videos'}</T>
            </Pressable>
          ))}
        </View>

        {ayah && <View style={{padding: 12, borderRadius: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, gap: 2}}>
          <Text style={{fontFamily: arFont(st), fontSize: 24, lineHeight: 52, color: t.text, textAlign: 'right', includeFontPadding: false}}>
            {arText(ayah, st)} <Text style={{fontFamily: F.uth, color: t.mark}}>{endMark(a)}</Text>
          </Text>
          <T size={14} c={t.muted}>{ayah.en}</T>
        </View>}

        {tab !== 'tafseer' ? (
          <View style={{padding: 24, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: t.line, alignItems: 'center'}}>
            <T c={t.muted} style={{textAlign: 'center'}}>{tab === 'related' ? 'Related ayahs' : 'Video lectures'} come in version 1.1. On the website they are already in the Study panel.</T>
          </View>
        ) : <>
          <View style={{flexDirection: 'row', gap: 6, alignItems: 'center'}}>
            <T size={12} c={t.muted} style={{marginRight: 4}}>Language</T>
            <Chip label="اردو" font={F.ur} on={lang === 'ur'} onPress={() => setLang('ur')} />
            <Chip label="English" on={lang === 'en'} onPress={() => setLang('en')} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 8}}>
            {TAFSIRS.filter(x => x.lang === lang).map(x => <Chip key={x.slug} label={x.name} font={x.lang === 'ur' ? F.ur : undefined} on={x.slug === cur.slug} onPress={() => set({tafsir: x.slug})} />)}
          </ScrollView>
          <View style={{padding: 16, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, gap: 10}}>
            <View style={{flexDirection: ur ? 'row-reverse' : 'row', alignItems: 'center', gap: 8}}>
              <Text style={{fontFamily: ur ? F.ur : F.b, fontSize: ur ? 20 : 16, lineHeight: ur ? 40 : 22, color: t.brand2, includeFontPadding: false}}>{cur.name}</Text>
              <Text style={{fontFamily: ur ? F.ur : F.r, fontSize: ur ? 15 : 13, lineHeight: ur ? 32 : 18, color: t.muted, includeFontPadding: false}}>{cur.author}</Text>
            </View>
            {res.key !== key ? <ActivityIndicator color={t.brand} style={{padding: 30}} />
              : res.text ? <Text style={ur
                  ? {fontFamily: F.ur, fontSize: st.trSize + 4, lineHeight: Math.round((st.trSize + 4) * 2.3), color: t.text, textAlign: 'right', writingDirection: 'rtl', includeFontPadding: false}
                  : {fontFamily: F.r, fontSize: st.trSize, lineHeight: Math.round(st.trSize * 1.6), color: t.text}}>{res.text}</Text>
              : <T c={t.muted}>{res.error || 'No tafseer for this ayah in this work.'}</T>}
          </View>
        </>}
      </ScrollView>
      <View style={{position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 12, 
        backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.line}}>
        <Btn label="Listen to ayah" icon="play" style={{flex: 1}} onPress={() => p.play(s, a)} />
      </View>
    </View>
  );
}
