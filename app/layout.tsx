import type {Metadata, Viewport} from 'next';
// Fonts are bundled with the app (no Google Fonts request at run time)
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/scheherazade-new/400.css';
import '@fontsource/scheherazade-new/700.css';
import '@fontsource/amiri-quran/400.css';
import '@fontsource/noto-nastaliq-urdu/400.css';
import '@fontsource/noto-nastaliq-urdu/600.css';
import './globals.css';
import AppProvider from '@/components/AppProvider';
import PlayerProvider from '@/components/PlayerProvider';
import Header from '@/components/Header';
import SettingsDrawer from '@/components/SettingsDrawer';
import TafseerDrawer from '@/components/TafseerDrawer';
import WordCard from '@/components/WordCard';
import TranslateBar from '@/components/TranslateBar';
import {readSettings} from '@/lib/server-settings';
import {getSurahList, type SurahInfo} from '@/lib/quran';

export const metadata: Metadata = {
  title: {default: 'Connecting Quran — Quran, Translation & Tafseer', template: '%s · Connecting Quran'},
  description: 'Read the Holy Quran with Urdu and English translations, tafseer, word-by-word meanings, grammar, recitation and quizzes.',
};
export const viewport: Viewport = {width: 'device-width', initialScale: 1, themeColor: '#1b1d5e'};


export default async function RootLayout({children}: LayoutProps<'/'>) {
  const {settings, hasCookie} = await readSettings();
  let surahs: SurahInfo[] = [];
  try{ surahs = await getSurahList(); }catch{ /* pages show their own error */ }
  return (
    <html lang="en" data-palette={settings.palette} data-theme={settings.theme === 'auto' ? undefined : settings.theme}
      style={{'--ar-size': settings.arSize + 'px', '--tr-size': settings.trSize + 'px'} as React.CSSProperties} suppressHydrationWarning>
      <body className={settings.script === 'indopak' ? 'ip' : ''}>
        <AppProvider initial={settings} hasCookie={hasCookie} surahs={surahs}>
          <PlayerProvider>
            <Header />
            <main className="mx-auto max-w-[1100px] px-4 pb-32 pt-5">{children}</main>
            <footer className="mx-auto max-w-[1100px] px-4 pb-8 text-center text-[13px] text-muted">
              Quran text and translations load from the AlQuran Cloud API. Indo-Pak text and word meanings load from the Quran.com API.
              Tafseer loads from the open-source tafsir_api project and QuranEnc (Rowwad Translation Center).
              Word grammar: <a href="https://corpus.quran.com" target="_blank" rel="noopener">Quranic Arabic Corpus</a> (GNU GPL).
            </footer>
            <SettingsDrawer />
            <TafseerDrawer />
            <WordCard />
            <TranslateBar />
          </PlayerProvider>
        </AppProvider>
      </body>
    </html>
  );
}
