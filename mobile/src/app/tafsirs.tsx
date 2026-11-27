/** Every tafseer the website offers, by language, with search (English names match too); choosing one goes back. */
import {router} from 'expo-router';
import {useMemo, useState} from 'react';
import {Pressable, SectionList, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Icon, T, TopBar} from '@/components/ui';
import {useMeta, type TafsirMeta} from '@/lib/api';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';

const LANGS = [['urdu', 'Urdu'], ['english', 'English'], ['arabic', 'Arabic']] as const;
/** Fonts for a work's own name: Nastaliq for Urdu, the Hafs font for Arabic. */
export const tafsirFont = (lang: string) => lang === 'urdu' ? F.ur : lang === 'arabic' ? F.uth : F.sb;

/** Choosing a work: it opens, and joins the quick chips on the Tafseer screen (the last five chosen). */
export function useChooseTafsir(){
  const {settings: st, set} = useApp();
  return (slug: string) => set({tafsir: slug, tafsirs: [slug, ...st.tafsirs.filter(x => x !== slug)].slice(0, 5)});
}

export default function Tafsirs(){
  const {t, settings: st} = useApp();
  const insets = useSafeAreaInsets();
  const meta = useMeta(), choose = useChooseTafsir();
  const [q, setQ] = useState('');
  const sections = useMemo(() => {
    const v = q.trim().toLowerCase();
    const hit = (x: TafsirMeta) => !v || `${x.name} ${x.en} ${x.author}`.toLowerCase().includes(v);
    return LANGS.map(([lang, title]) => ({title, data: meta.tafsirs.filter(x => x.lang === lang && hit(x))})).filter(x => x.data.length);
  }, [meta.tafsirs, q]);

  return (
    <View style={{flex: 1, backgroundColor: t.bg}}>
      <TopBar title="Choose a tafseer" sub={`${meta.tafsirs.length} works`} />
      <View style={{paddingHorizontal: 12, paddingBottom: 8}}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingLeft: 14, paddingRight: 6, borderRadius: 14, borderWidth: 1.5, borderColor: t.line, backgroundColor: t.surface}}>
          <Icon name="search" size={18} color={t.muted} />
          <TextInput value={q} onChangeText={setQ} placeholder="Name or author, in English or Urdu" placeholderTextColor={t.muted} autoCorrect={false}
            style={{flex: 1, fontFamily: F.m, fontSize: 15, color: t.text}} />
          {q ? <Pressable accessibilityLabel="Clear search" onPress={() => setQ('')} style={{width: 36, height: 36, alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="x" size={14} color={t.muted} stroke={2.5} /></Pressable> : null}
        </View>
      </View>
      <SectionList sections={sections} keyExtractor={x => x.slug} keyboardShouldPersistTaps="handled" stickySectionHeadersEnabled
        contentContainerStyle={{paddingHorizontal: 12, paddingBottom: insets.bottom + 90}}
        ListEmptyComponent={<T c={t.muted} style={{textAlign: 'center', padding: 30}}>No tafseer matches “{q}”.</T>}
        renderSectionHeader={({section}) => (
          <T size={11} w="sb" c={t.brand} style={{letterSpacing: 1, paddingTop: 12, paddingBottom: 6, backgroundColor: t.bg}}>{section.title.toUpperCase()} · {section.data.length}</T>
        )}
        renderItem={({item: x}) => {
          const on = x.slug === st.tafsir, rtl = x.lang !== 'english';
          return (
            <Pressable onPress={() => { choose(x.slug); router.back(); }} style={{flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 6, borderRadius: 14,
              backgroundColor: on ? t.soft : t.surface, borderWidth: on ? 1.5 : 1, borderColor: on ? t.brand : t.line}}>
              <View style={{flex: 1}}>
                <Text style={{fontFamily: tafsirFont(x.lang), fontSize: rtl ? 19 : 15, lineHeight: rtl ? 38 : 21, color: t.text, textAlign: rtl ? 'right' : 'left', includeFontPadding: false}}>{x.name}</Text>
                {!!x.author && <Text numberOfLines={1} style={{fontFamily: rtl ? tafsirFont(x.lang) : F.r, fontSize: rtl ? 13.5 : 12.5, lineHeight: rtl ? 28 : 18, color: t.muted, textAlign: rtl ? 'right' : 'left', includeFontPadding: false}}>{x.author}</Text>}
                {rtl && !!x.en && <T size={12} c={t.muted} lines={1}>{x.en}</T>}
              </View>
              {on && <Icon name="check" size={20} color={t.brand} stroke={2.4} />}
            </Pressable>
          );
        }} />
    </View>
  );
}
