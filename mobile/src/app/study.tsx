/** Tafseer tab: opens at the last-read ayah. */
import {useState} from 'react';
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import TafseerView from '@/components/TafseerView';
import {useApp} from '@/lib/store';

export default function Study(){
  const {t, history} = useApp();
  const insets = useSafeAreaInsets();
  const last = history[0] ?? {s: 1, a: 1};
  const [at, setAt] = useState(last);
  // Follow the reading place when it moves (adjusting state during render, not in an effect)
  const [seen, setSeen] = useState(`${last.s}:${last.a}`);
  if (seen !== `${last.s}:${last.a}`){ setSeen(`${last.s}:${last.a}`); setAt(last); }
  return (
    <View style={{flex: 1, backgroundColor: t.bg}}>
      <TafseerView s={at.s} a={at.a} top={insets.top + 12} onStep={a => setAt({...at, a})} />
    </View>
  );
}
