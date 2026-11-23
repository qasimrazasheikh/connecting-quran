import {Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold} from '@expo-google-fonts/inter';
import {useFonts} from 'expo-font';
import {Stack} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {StatusBar} from 'expo-status-bar';
import {useEffect} from 'react';
import {View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import TabBar from '@/components/TabBar';
import {PlayerProvider} from '@/lib/player';
import {AppProvider, useApp} from '@/lib/store';

SplashScreen.preventAutoHideAsync();

function Root(){
  const {t, ready} = useApp();
  const [fonts] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
    IndoPak: require('@/assets/fonts/IndoPak.ttf'), UthmanicHafs: require('@/assets/fonts/UthmanicHafs.ttf'),
    MehrNastaliq: require('@/assets/fonts/MehrNastaliq.ttf'), SurahNames: require('@/assets/fonts/SurahNames.ttf'),
  });
  useEffect(() => { if (fonts && ready) SplashScreen.hideAsync(); }, [fonts, ready]);
  if (!fonts || !ready) return null;
  const sheet = {presentation: 'transparentModal', animation: 'slide_from_bottom', contentStyle: {backgroundColor: 'transparent'}} as const;
  const tab = {animation: 'fade'} as const;
  // One stack for every screen; the tab bar is drawn under it so it stays on every screen
  return (
    <View style={{flex: 1, backgroundColor: t.bg}}>
      <StatusBar style={t.dark ? 'light' : 'dark'} />
      <View style={{flex: 1}}>
        <Stack screenOptions={{headerShown: false, contentStyle: {backgroundColor: t.bg}}}>
          {['index', 'mushaf', 'study', 'search', 'saved'].map(name => <Stack.Screen key={name} name={name} options={tab} />)}
          <Stack.Screen name="welcome" options={{animation: 'fade', gestureEnabled: false}} />
          <Stack.Screen name="player" options={{animation: 'slide_from_bottom'}} />
          <Stack.Screen name="word" options={sheet} />
          <Stack.Screen name="actions" options={sheet} />
        </Stack>
      </View>
      <TabBar />
    </View>
  );
}

export default function Layout(){
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <AppProvider>
          <PlayerProvider>
            <Root />
          </PlayerProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
