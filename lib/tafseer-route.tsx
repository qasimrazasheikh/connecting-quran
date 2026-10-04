import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import TafseerPage from '@/components/TafseerPage';
import {readSettings} from './server-settings';
import {getSurahList} from './quran';
import {ayahQuote} from './views';

/** Shared by /tafseer/[s]/[a] and /videos/[s]/[a]. */
export async function parseAyah(params: Promise<{s: string; a: string}>) {
  const {s: ss, a: as} = await params;
  const s = /^\d{1,3}$/.test(ss) ? +ss : 0, a = /^\d{1,3}$/.test(as) ? +as : 0;
  if (s < 1 || s > 114 || a < 1) notFound();
  let surahs; try{ surahs = await getSurahList(); }catch{ surahs = null; }
  if (surahs && a > surahs[s - 1].ayahs) notFound();
  return {s, a, name: surahs?.[s - 1]?.en || `Surah ${s}`};
}
export async function tafseerMeta(params: Promise<{s: string; a: string}>, tab: 'text' | 'videos'): Promise<Metadata> {
  const {s, a, name} = await parseAyah(params);
  return tab === 'videos'
    ? {title: `Video lectures · ${name} ${s}:${a}`, description: `Dr Israr Ahmed and Nouman Ali Khan lectures on Surah ${name}.`}
    : {title: `Tafseer of ${name} ${s}:${a}`, description: `Read several Urdu, English and Arabic tafseers of Quran ${s}:${a} (Surah ${name}).`};
}
export async function TafseerRoute({params, tab}: {params: Promise<{s: string; a: string}>; tab: 'text' | 'videos'}) {
  const {s, a} = await parseAyah(params);
  const {settings} = await readSettings();
  const quote = await ayahQuote(s, a, settings).catch(() => null);
  return <TafseerPage s={s} a={a} tab={tab} quote={quote} />;
}
