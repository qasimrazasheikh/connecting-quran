import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import TafseerPage from '@/components/TafseerPage';
import type {StudyTab} from './step';
import {readSettings} from './server-settings';
import {getSurahList} from './quran';
import {ayahQuote} from './views';
import {seo} from './seo';

/** Shared by /tafseer/[s]/[a] and /videos/[s]/[a]. */
export async function parseAyah(params: Promise<{s: string; a: string}>) {
  const {s: ss, a: as} = await params;
  const s = /^\d{1,3}$/.test(ss) ? +ss : 0, a = /^\d{1,3}$/.test(as) ? +as : 0;
  if (s < 1 || s > 114 || a < 1) notFound();
  let surahs; try{ surahs = await getSurahList(); }catch{ surahs = null; }
  if (surahs && a > surahs[s - 1].ayahs) notFound();
  return {s, a, name: surahs?.[s - 1]?.en || `Surah ${s}`};
}
export async function tafseerMeta(params: Promise<{s: string; a: string}>, tab: StudyTab): Promise<Metadata> {
  const {s, a, name} = await parseAyah(params);
  // the lectures are per surah, so every ayah's video address names the surah's first as the page to index;
  // a tafseer page's ?tab= views name the plain tafseer address
  return tab === 'videos'
    ? seo(`/videos/${s}/1`, `Video lectures · Surah ${name}`, `Dr Israr Ahmed and Nouman Ali Khan lectures on Surah ${name}.`)
    : seo(`/tafseer/${s}/${a}`, `Tafseer of ${name} ${s}:${a}`, `Read several Urdu, English and Arabic tafseers of Quran ${s}:${a} (Surah ${name}).`);
}
export async function TafseerRoute({params, tab}: {params: Promise<{s: string; a: string}>; tab: StudyTab}) {
  const {s, a, name} = await parseAyah(params);
  const {settings} = await readSettings();
  const quote = await ayahQuote(s, a, settings).catch(() => null);
  return <><h1 className="sr-only">{tab === 'videos' ? 'Video lectures' : 'Tafseer'} · {name} {s}:{a}</h1><TafseerPage s={s} a={a} tab={tab} quote={quote} /></>;
}
