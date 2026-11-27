/**
 * "Go to" sheet, like the website's surah and ayah selects: surahs on the left (with search), the chosen surah's ayah
 * numbers on the right. Typing "2:255" and pressing go jumps straight there.
 */
import {useMemo, useState} from 'react';
import {FlatList, Modal, Pressable, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {SURAHS, surahInfo} from '@/lib/data';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';
import {Icon, T} from './ui';

const ROW = 52;

export default function GoToAyah({visible, s, a, onPick, onClose}: {visible: boolean; s: number; a: number; onPick: (s: number, a: number) => void; onClose: () => void}){
  const {t} = useApp();
  const insets = useSafeAreaInsets();
  const [sel, setSel] = useState(s);
  const [q, setQ] = useState('');
  // Opening again starts at the surah being read (reset during render, not in an effect)
  const [was, setWas] = useState(visible);
  if (was !== visible){ setWas(visible); if (visible){ setSel(s); setQ(''); } }

  const list = useMemo(() => {
    const v = q.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return v && !/:/.test(q) ? SURAHS.filter(x => String(x.n) === v || x.en.toLowerCase().replace(/[^a-z]/g, '').includes(v)) : SURAHS;
  }, [q]);
  const ayahs = useMemo(() => Array.from({length: surahInfo(sel).ayahs}, (_, i) => i + 1), [sel]);
  const pick = (ps: number, pa: number) => { onClose(); onPick(ps, pa); };
  const jump = () => {
    const m = q.match(/^\s*(\d{1,3})\s*[:.]\s*(\d{1,3})\s*$/);
    if (m && +m[1] >= 1 && +m[1] <= 114 && +m[2] >= 1 && +m[2] <= surahInfo(+m[1]).ayahs) pick(+m[1], +m[2]);
    else if (list.length === 1) setSel(list[0].n);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.45)'}} />
      <View style={{height: '80%', backgroundColor: t.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: insets.bottom}}>
        <View style={{flexDirection: 'row', alignItems: 'center', padding: 12, paddingBottom: 8}}>
          <T size={17} w="b" style={{flex: 1}}>Go to</T>
          <Pressable accessibilityLabel="Close" onPress={onClose} style={{width: 40, height: 40, alignItems: 'center', justifyContent: 'center'}}><Icon name="x" size={20} color={t.muted} /></Pressable>
        </View>
        <View style={{marginHorizontal: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.surface}}>
          <Icon name="search" size={18} color={t.muted} />
          <TextInput value={q} onChangeText={setQ} onSubmitEditing={jump} placeholder="Surah name, number or 2:255" placeholderTextColor={t.muted}
            returnKeyType="go" autoCorrect={false} style={{flex: 1, fontFamily: F.r, fontSize: 15, color: t.text}} />
        </View>
        <View style={{flex: 1, flexDirection: 'row', borderTopWidth: 1, borderTopColor: t.line}}>
          <FlatList style={{flex: 1.3, borderRightWidth: 1, borderRightColor: t.line}} data={list} keyExtractor={x => String(x.n)} keyboardShouldPersistTaps="handled"
            initialScrollIndex={q ? 0 : Math.max(0, s - 3)} getItemLayout={(_, i) => ({length: ROW, offset: ROW * i, index: i})}
            renderItem={({item: x}) => (
              <Pressable onPress={() => setSel(x.n)} style={{height: ROW, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, backgroundColor: x.n === sel ? t.soft : undefined}}>
                <T size={13} w="sb" c={t.brand} style={{width: 28}}>{x.n}</T>
                <T size={14.5} w={x.n === sel ? 'sb' : 'm'} lines={1} style={{flex: 1}}>{x.en}</T>
              </Pressable>
            )} />
          <View style={{flex: 1}}>
            <T size={11} w="sb" c={t.muted} style={{letterSpacing: 1, padding: 10, paddingBottom: 4}}>AYAH · {surahInfo(sel).en.toUpperCase()}</T>
            <FlatList key={sel} data={ayahs} keyExtractor={String} numColumns={4} keyboardShouldPersistTaps="handled" contentContainerStyle={{padding: 6}}
              renderItem={({item: n}) => {
                const on = sel === s && n === a;
                return (
                  <Pressable onPress={() => pick(sel, n)} style={{flex: 1, margin: 3, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: on ? t.brand : t.surface, borderWidth: 1, borderColor: on ? t.brand : t.line}}>
                    <T size={14} w="sb" c={on ? t.onBrand : t.text}>{n}</T>
                  </Pressable>
                );
              }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
