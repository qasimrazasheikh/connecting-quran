/** First run: script, translations, reciter. Everything can be changed later in Settings. */
import {useAudioPlayer} from 'expo-audio';
import {router} from 'expo-router';
import {useState} from 'react';
import {Pressable, ScrollView, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Btn, Icon, T} from '@/components/ui';
import {audioUrl, FATIHAH, RECITERS, uthBody} from '@/lib/data';
import {useApp} from '@/lib/store';
import {F} from '@/lib/theme';

export default function Welcome(){
  const {t, settings: st, set, finishOnboarding} = useApp();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const sample = useAudioPlayer(null);
  const ayah = FATIHAH[1];
  const card = (on: boolean) => ({padding: 14, borderRadius: 18, borderWidth: on ? 2 : 1, borderColor: on ? t.brand : t.line, backgroundColor: t.surface});
  const done = () => { sample.pause(); finishOnboarding(); router.replace('/'); };

  return (
    <View style={{flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16, paddingHorizontal: 20}}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
        {[0, 1, 2].map(i => <View key={i} style={{height: 6, width: i === step ? 28 : 8, borderRadius: 3, backgroundColor: i <= step ? t.brand : t.line}} />)}
        <View style={{flex: 1}} />
        <Pressable onPress={done} style={{padding: 12}}><T w="sb" c={t.brand}>Skip</T></Pressable>
      </View>

      <ScrollView contentContainerStyle={{gap: 16, paddingVertical: 12}}>
        {step === 0 && <>
          <View style={{width: 64, height: 64, borderRadius: 18, backgroundColor: '#1b1d5e', alignItems: 'center', justifyContent: 'center'}}><Icon name="book" size={32} color="#f6cf6a" /></View>
          <T size={28} w="b" style={{lineHeight: 36}}>Welcome to Connecting Quran</T>
          <T size={16} c={t.muted}>Choose how the Arabic text looks. You can change this any time in Settings.</T>
          {([['indopak', 'Indo-Pak', 'as printed in Pakistan and India', F.ip, ayah.ip], ['uthmani', 'Uthmani', 'Madinah Mushaf style', F.uth, uthBody(ayah.uth)]] as const).map(([v, name, note, font, ar]) => (
            <Pressable key={v} onPress={() => set({script: v})} style={card(st.script === v)}>
              <T size={16} w="sb">{name} <T size={13} c={t.muted}>· {note}</T></T>
              <Text style={{fontFamily: font, fontSize: 28, lineHeight: 60, color: t.text, textAlign: 'right', includeFontPadding: false}}>{ar}</Text>
            </Pressable>
          ))}
        </>}

        {step === 1 && <>
          <T size={28} w="b">Translations</T>
          <T size={16} c={t.muted}>They show under every ayah. More translations come with the full app.</T>
          {([['showUr', 'Fateh Muhammad Jalandhry', 'Urdu'], ['showEn', 'Saheeh International', 'English']] as const).map(([k, name, lang]) => (
            <Pressable key={k} onPress={() => set({[k]: !st[k]})} style={[card(st[k]), {flexDirection: 'row', alignItems: 'center', gap: 12}]}>
              <View style={{width: 24, height: 24, borderRadius: 7, backgroundColor: st[k] ? t.brand : t.surface, borderWidth: 1.5, borderColor: st[k] ? t.brand : t.muted, alignItems: 'center', justifyContent: 'center'}}>
                {st[k] && <Icon name="check" size={14} color="#fff" stroke={3} />}
              </View>
              <View style={{flex: 1}}><T size={15} w="sb">{name}</T><T size={13} c={t.muted}>{lang}</T></View>
            </Pressable>
          ))}
        </>}

        {step === 2 && <>
          <T size={28} w="b">Choose a reciter</T>
          <T size={16} c={t.muted}>Tap play to hear Al-Fatihah 1:2.</T>
          {RECITERS.map(r => (
            <Pressable key={r.id} onPress={() => set({reciter: r.id})} style={[card(st.reciter === r.id), {flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10}]}>
              <T size={15} w="sb" style={{flex: 1}}>{r.name}</T>
              <Pressable accessibilityLabel={`Hear ${r.name}`} onPress={() => { set({reciter: r.id}); sample.replace({uri: audioUrl(r.id, 2)}); sample.play(); }}
                style={{width: 44, height: 44, borderRadius: 22, backgroundColor: t.soft, alignItems: 'center', justifyContent: 'center'}}>
                <Icon name="play" size={16} color={t.brand} />
              </Pressable>
            </Pressable>
          ))}
          <T size={13} c={t.muted}>Your reading place, bookmarks and settings stay on this phone.</T>
        </>}
      </ScrollView>

      <View style={{flexDirection: 'row', gap: 10}}>
        {step > 0 && <Btn label="Back" ghost onPress={() => setStep(step - 1)} />}
        <Btn label={step < 2 ? 'Continue' : 'Start reading'} style={{flex: 1}} onPress={() => step < 2 ? setStep(step + 1) : done()} />
      </View>
    </View>
  );
}
