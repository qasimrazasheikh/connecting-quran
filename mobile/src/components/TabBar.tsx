/**
 * Bottom tabs: Quran · Mushaf · Tafseer · Search · Saved, drawn under the screen stack so they stay on every screen
 * (expo-router's tab navigator can't reach hidden tabs like the reader). Inner screens light up the tab they belong to.
 * The recitation bar sits on top while something is playing.
 */
import {router, usePathname, type Href} from 'expo-router';
import {Pressable, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useApp} from '@/lib/store';
import MiniPlayer from './MiniPlayer';
import {Icon, T, type IconName} from './ui';

const TABS: {href: Href; label: string; icon: IconName; owns: RegExp}[] = [
  {href: '/', label: 'Quran', icon: 'book', owns: /^\/(surah\/.*)?$/},
  {href: '/mushaf', label: 'Mushaf', icon: 'mushaf', owns: /^\/(mushaf|page)/},
  {href: '/study', label: 'Tafseer', icon: 'tafseer', owns: /^\/(study|tafseer)/},
  {href: '/search', label: 'Search', icon: 'search', owns: /^\/search/},
  {href: '/saved', label: 'Saved', icon: 'bookmark', owns: /^\/saved/},
];

export default function TabBar(){
  const {t, immersive} = useApp();
  const insets = useSafeAreaInsets();
  const path = usePathname();
  if (path === '/welcome' || immersive) return null;
  return (
    <View>
      {path !== '/player' && <MiniPlayer />}
      <View style={{flexDirection: 'row', backgroundColor: t.surface, borderTopWidth: 1, borderTopColor: t.line, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10)}}>
        {TABS.map(tab => {
          const on = tab.owns.test(path), c = on ? t.brand : t.muted;
          return (
            // A tab already on the stack is gone back to; otherwise it is opened
            <Pressable key={tab.label} accessibilityRole="tab" accessibilityState={{selected: on}} onPress={() => router.navigate(tab.href)}
              style={{flex: 1, alignItems: 'center', gap: 3, minHeight: 44}}>
              <Icon name={tab.icon} color={c} />
              <T size={11} w={on ? 'sb' : 'm'} c={c}>{tab.label}</T>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
