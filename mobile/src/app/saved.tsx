/** Bookmarks and reading history, kept on the phone. */
import {useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Badge, Icon, Segmented, T, TabHeader} from '@/components/ui';
import {gapMarks, surahInfo, useSurah} from '@/lib/data';
import {ago, useApp} from '@/lib/store';
import {F} from '@/lib/theme';
import {openAyah} from '@/lib/nav';

/** The start of a saved ayah's Arabic, shown once its surah has loaded. */
function AyahLine({s, a}: {s: number; a: number}){
  const {t} = useApp();
  const ayah = useSurah(s)?.[a - 1];
  if (!ayah) return null;
  return <Text numberOfLines={1} style={{fontFamily: F.ip, fontSize: 22, lineHeight: 46, color: t.text, textAlign: 'right', includeFontPadding: false}}>{gapMarks(ayah.ip)}</Text>;
}

export default function Saved(){
  const {t, marks, history, toggleMark} = useApp();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<'marks' | 'history'>('marks');
  const rows = tab === 'marks' ? marks : history;

  return (
    <ScrollView contentContainerStyle={{paddingTop: insets.top, paddingHorizontal: 16, paddingBottom: 24, gap: 12}}>
      <TabHeader title="Saved" />
      <Segmented value={tab} onChange={setTab} options={[{v: 'marks', label: `Bookmarks · ${marks.length}`}, {v: 'history', label: 'History'}]} />
      {rows.length === 0 && (
        <View style={{padding: 28, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: t.line, alignItems: 'center', gap: 8}}>
          <Icon name="bookmark" size={26} color={t.muted} />
          <T c={t.muted} style={{textAlign: 'center'}}>{tab === 'marks' ? 'Tap the bookmark on any ayah to keep it here.' : 'Surahs you read will show here.'}</T>
        </View>
      )}
      {rows.map(m => {
        return (
          <Pressable key={`${m.s}:${m.a}`} onPress={() => openAyah(m.s, m.a)} onLongPress={() => tab === 'marks' && toggleMark(m.s, m.a)}
            style={{padding: 14, paddingTop: 12, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line, gap: 4}}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              {tab === 'marks' && <Icon name="bookmark" size={16} color={t.mark} fill={t.mark} />}
              <T size={15} w="sb">{surahInfo(m.s).en}</T>
              <Badge label={`${m.s}:${m.a}`} />
              <View style={{flex: 1}} />
              <T size={12} c={t.muted}>{ago(m.at)}</T>
            </View>
            <AyahLine s={m.s} a={m.a} />
          </Pressable>
        );
      })}
      <View style={{flexDirection: 'row', gap: 8, alignItems: 'flex-start'}}>
        <Icon name="phone" size={16} color={t.muted} />
        <T size={12.5} c={t.muted} style={{flex: 1}}>Bookmarks are kept on this phone.{tab === 'marks' ? ' Long-press one to remove it.' : ''}</T>
      </View>
    </ScrollView>
  );
}
