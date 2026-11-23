/** Search the whole Quran's Arabic, Urdu and English on the phone (from the shipped search file; later, the site's search API). */
import {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Badge, Chip, Icon, T, TabHeader} from '@/components/ui';
import {gapMarks, loadSearch, surahInfo} from '@/lib/data';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';
import {openAyah} from '@/lib/nav';

type Scope = 'all' | 'en' | 'ur' | 'ar';
/** A searchable ayah, with its texts already normalised for matching. */
type Row = {s: number; a: number; ip: string; ur: string; en: string; nip: string; nur: string; len: string};
/** Enough results to scroll through; a broader search is better narrowed than listed in full. */
const MAX_SHOWN = 300;
/** Loose Arabic/Urdu matching: drop diacritics and unify letter shapes, as the site's highlight.ts does. */
const norm = (x: string) => x.replace(/[ً-ٰٟۖ-ۭـ]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/[ىي]/g, 'ی').replace(/ك/g, 'ک').replace(/[ةۃ]/g, 'ہ').replace(/ه/g, 'ہ');

export default function Search(){
  const {t} = useApp();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('Lord of the worlds');
  const [scope, setScope] = useState<Scope>('all');
  // The search file is read and prepared once, the first time Search opens
  const [rows, setRows] = useState<Row[]>();
  useEffect(() => {
    loadSearch().then(list => setRows(list.map(([s, a, ip, ur, en]) => ({s, a, ip, ur, en, nip: norm(ip), nur: norm(ur), len: en.toLowerCase()}))));
  }, []);

  const hits = useMemo(() => {
    const v = q.trim();
    if (v.length < 2 || !rows) return [];
    const lo = v.toLowerCase(), nv = norm(v), out: {row: Row; field: 'en' | 'ur' | 'ar'}[] = [];
    for (const row of rows){
      if ((scope === 'all' || scope === 'en') && row.len.includes(lo)) out.push({row, field: 'en'});
      else if ((scope === 'all' || scope === 'ur') && row.nur.includes(nv)) out.push({row, field: 'ur'});
      else if ((scope === 'all' || scope === 'ar') && row.nip.includes(nv)) out.push({row, field: 'ar'});
    }
    return out;
  }, [q, scope, rows]);

  /** English hits get the matched words marked; Urdu/Arabic are shown whole. */
  const marked = (text: string) => {
    const i = text.toLowerCase().indexOf(q.trim().toLowerCase());
    if (i < 0) return text;
    return <>{text.slice(0, i)}<Text style={{backgroundColor: t.highlight, fontFamily: F.sb}}>{text.slice(i, i + q.trim().length)}</Text>{text.slice(i + q.trim().length)}</>;
  };

  return (
    <FlatList data={hits.slice(0, MAX_SHOWN)} keyExtractor={h => `${h.row.s}:${h.row.a}`} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: 24, gap: 8}}
      ListHeaderComponent={<View style={{gap: 14, marginBottom: 6}}>
        <TabHeader title="Search" />
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, height: 50, paddingLeft: 14, paddingRight: 6, borderRadius: 14, borderWidth: 2, borderColor: t.brand, backgroundColor: t.surface}}>
          <Icon name="search" size={18} color={t.brand} />
          <TextInput value={q} onChangeText={setQ} placeholder="Words in English, Urdu or Arabic" placeholderTextColor={t.muted} autoCorrect={false}
            style={{flex: 1, fontFamily: F.m, fontSize: 16, color: t.text}} />
          {q ? <Pressable accessibilityLabel="Clear search" onPress={() => setQ('')} style={{width: 36, height: 36, borderRadius: 18, backgroundColor: t.surface2, alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="x" size={14} color={t.muted} stroke={2.5} /></Pressable> : null}
        </View>
        <View style={{flexDirection: 'row', gap: 6}}>
          {([['all', 'All'], ['en', 'English'], ['ur', 'Urdu'], ['ar', 'Arabic']] as const).map(([v, l]) => <Chip key={v} label={l} on={scope === v} onPress={() => setScope(v)} />)}
        </View>
        {!rows ? <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}><ActivityIndicator color={t.brand} /><T size={13} c={t.muted}>Preparing the whole Quran for search…</T></View>
          : <T size={13} c={t.muted}>{q.trim().length < 2 ? 'Type at least two letters'
            : `${hits.length} ayah${hits.length === 1 ? '' : 's'}${hits.length > MAX_SHOWN ? ` · showing the first ${MAX_SHOWN}; add words to narrow it` : ''}`}</T>}
      </View>}
      renderItem={({item: h}) => (
        <Pressable onPress={() => openAyah(h.row.s, h.row.a)} style={{padding: 14, paddingTop: 12, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, gap: 6}}>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
            <Badge label={`${h.row.s}:${h.row.a}`} /><T size={13} w="sb" c={t.muted}>{surahInfo(h.row.s).en}</T>
          </View>
          {h.field === 'en' ? <T size={15} style={{lineHeight: 23}}>{marked(h.row.en)}</T>
            : <Text numberOfLines={3} style={{fontFamily: h.field === 'ur' ? F.ur : F.ip, fontSize: h.field === 'ur' ? 18 : 22, lineHeight: h.field === 'ur' ? 40 : 46,
                color: t.text, textAlign: 'right', includeFontPadding: false}}>{h.field === 'ur' ? h.row.ur : gapMarks(h.row.ip)}</Text>}
        </Pressable>
      )} />
  );
}
