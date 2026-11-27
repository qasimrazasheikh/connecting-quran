/** Settings with a live preview: script, sizes, translations, word by word, reciter, colours, theme. */
import {Pressable, ScrollView, Switch, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {arFont, arText, TransText} from '@/components/AyahCard';
import {Icon, Segmented, T, TopBar} from '@/components/ui';
import {useMeta} from '@/lib/api';
import {endMark, FATIHAH} from '@/lib/data';
import {DEFAULTS, useApp, type Settings} from '@/lib/store';
import {F, PALETTES, theme} from '@/lib/theme';

export default function SettingsScreen(){
  const {t, settings: st, set} = useApp();
  const insets = useSafeAreaInsets();
  const meta = useMeta();
  const flipTr = (id: string) => set({trans: st.trans.includes(id) ? st.trans.filter(x => x !== id) : [...st.trans, id]});
  const sample = FATIHAH[1];
  const card = {padding: 14, paddingVertical: 4, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1, borderColor: t.line} as const;
  const row = {flexDirection: 'row', alignItems: 'center', minHeight: 56, borderBottomWidth: 1, borderBottomColor: t.surface2, gap: 12} as const;

  const toggle = (label: string, sub: string, k: keyof Settings, last?: boolean) => (
    <View style={[row, last && {borderBottomWidth: 0}]}>
      <View style={{flex: 1}}><T size={15} w="m">{label}</T><T size={12} c={t.muted}>{sub}</T></View>
      <Switch value={!!st[k]} onValueChange={v => set({[k]: v})} trackColor={{true: t.brand, false: t.line}} thumbColor="#fff" />
    </View>
  );
  const stepper = (label: string, k: 'arSize' | 'trSize', min: number, max: number) => (
    <View style={row}>
      <T size={15} w="m" style={{flex: 1}}>{label}</T>
      <Pressable accessibilityLabel={`Smaller ${label}`} onPress={() => set({[k]: Math.max(min, st[k] - 2)})} style={{width: 44, height: 40, borderRadius: 10, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center'}}><T w="b">A−</T></Pressable>
      <T size={14} c={t.muted} style={{width: 28, textAlign: 'center'}}>{st[k]}</T>
      <Pressable accessibilityLabel={`Larger ${label}`} onPress={() => set({[k]: Math.min(max, st[k] + 2)})} style={{width: 44, height: 40, borderRadius: 10, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center'}}><T w="b">A+</T></Pressable>
    </View>
  );

  return (
    <View style={{flex: 1, backgroundColor: t.bg}}>
      <TopBar title="Settings" />
      <ScrollView contentContainerStyle={{padding: 12, gap: 12, paddingBottom: insets.bottom + 24}}>
        <View style={{padding: 14, borderRadius: 16, backgroundColor: t.surface, borderWidth: 1.5, borderColor: t.brand}}>
          <T size={11} w="sb" c={t.brand} style={{letterSpacing: 1}}>PREVIEW</T>
          <Text style={{fontFamily: arFont(st), fontSize: st.arSize, lineHeight: Math.round(st.arSize * 2.1), color: t.text, textAlign: 'right', includeFontPadding: false}}>
            {arText(sample, st)} <Text style={{fontFamily: F.uth, color: t.mark}}>{endMark(2)}</Text>
          </Text>
          <TransText s={1} ayah={sample} />
        </View>

        <View style={card}>
          <View style={[row, {justifyContent: 'space-between'}]}>
            <T size={15} w="m">Script</T>
            <View style={{width: 200}}><Segmented value={st.script} onChange={v => set({script: v})} options={[{v: 'indopak', label: 'Indo-Pak'}, {v: 'uthmani', label: 'Uthmani'}]} /></View>
          </View>
          {stepper('Arabic size', 'arSize', 20, 44)}
          {stepper('Translation size', 'trSize', 12, 24)}
          {toggle('Word by word', 'Meaning under each Arabic word', 'wbw')}
          {st.wbw && <View style={[row, {justifyContent: 'space-between'}]}>
            <T size={15} w="m">Word meanings in</T>
            <View style={{width: 160}}><Segmented value={st.wbwLang} onChange={v => set({wbwLang: v})} options={[{v: 'ur', label: 'Urdu'}, {v: 'en', label: 'English'}]} /></View>
          </View>}
        </View>

        <View style={card}>
          <T size={15} w="m" style={{paddingTop: 12}}>Translations</T>
          <T size={12} c={t.muted} style={{paddingBottom: 6}}>Shown under each ayah in the order you pick them. Jalandhry and Saheeh International are inside the app; the others download a surah at a time and then work offline.</T>
          {([['ur', 'Urdu'], ['en', 'English']] as const).map(([lang, label]) => <View key={lang}>
            <T size={11} w="sb" c={t.brand} style={{letterSpacing: 1, paddingTop: 10, paddingBottom: 2}}>{label.toUpperCase()}</T>
            {meta.translations.filter(x => x.lang === lang).map(x => {
              const i = st.trans.indexOf(x.id);
              return (
                <Pressable key={x.id} onPress={() => flipTr(x.id)} style={[row, {minHeight: 48}]}>
                  <T size={15} style={{flex: 1}}>{x.english}</T>
                  {i >= 0 && <View style={{minWidth: 24, height: 24, borderRadius: 12, backgroundColor: t.brand, alignItems: 'center', justifyContent: 'center'}}><T size={12} w="b" c={t.onBrand}>{i + 1}</T></View>}
                </Pressable>
              );
            })}
          </View>)}
        </View>

        <View style={card}>
          <T size={15} w="m" style={{paddingTop: 12, paddingBottom: 6}}>Reciter</T>
          {meta.reciters.map(r => (
            <Pressable key={r.id} onPress={() => set({reciter: r.id})} style={[row, {minHeight: 48}]}>
              <T size={15} style={{flex: 1}}>{r.name}</T>
              {st.reciter === r.id && <Icon name="check" size={20} color={t.brand} stroke={2.4} />}
            </Pressable>
          ))}
          {toggle('Play the next ayah', 'Carry on to the end of the surah', 'autoPlay')}
          {toggle('Follow in reader', 'Scroll to the ayah being recited', 'follow', true)}
        </View>

        <View style={[card, {paddingVertical: 12, gap: 12}]}>
          <T size={15} w="m">Colours</T>
          <View style={{flexDirection: 'row', gap: 8}}>
            {PALETTES.map(p => {
              const pt = theme(p.id, false), on = st.palette === p.id;
              return (
                <Pressable key={p.id} onPress={() => set({palette: p.id})} style={{flex: 1, height: 68, borderRadius: 12, borderWidth: on ? 2 : 1, borderColor: on ? t.brand : t.line,
                  alignItems: 'center', justifyContent: 'center', gap: 6}}>
                  <View style={{flexDirection: 'row', gap: 4}}>
                    <View style={{width: 18, height: 18, borderRadius: 9, backgroundColor: pt.brand}} /><View style={{width: 18, height: 18, borderRadius: 9, backgroundColor: pt.accent}} />
                  </View>
                  <T size={12.5} w="m">{p.name}</T>
                </Pressable>
              );
            })}
          </View>
          <Segmented value={st.mode} onChange={v => set({mode: v})} options={[{v: 'auto', label: 'Auto'}, {v: 'light', label: 'Light'}, {v: 'dark', label: 'Dark'}]} />
        </View>

        <Pressable onPress={() => set(DEFAULTS)} style={{alignSelf: 'center', padding: 12}}><T size={14} w="sb" c={t.brand}>Reset to defaults</T></Pressable>
      </ScrollView>
    </View>
  );
}
