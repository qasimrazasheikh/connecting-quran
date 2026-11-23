/** Tafseer opened from an ayah (lights up the Tafseer tab). */
import {router, useLocalSearchParams} from 'expo-router';
import {View} from 'react-native';
import TafseerView from '@/components/TafseerView';
import {TopBar} from '@/components/ui';
import {useApp} from '@/lib/store';

export default function Tafseer(){
  const {s, a} = useLocalSearchParams<{s: string; a: string}>();
  const {t} = useApp();
  return (
    <View style={{flex: 1, backgroundColor: t.bg}}>
      <TopBar title="Tafseer" />
      <TafseerView s={+s} a={+a} top={8} onStep={x => router.setParams({a: String(x)})} />
    </View>
  );
}
