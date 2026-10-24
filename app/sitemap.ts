import type {MetadataRoute} from 'next';
import {QUIZ_PART} from '@/lib/meta';
import {SITE} from '@/lib/seo';
import {SURAHS} from '@/lib/surahs';

/**
 * Every page worth finding (about 7,200 addresses, under the 50,000 a sitemap may hold). Ayah addresses in the reader
 * (/surah/2/255) are left out: they show the whole surah, whose canonical is /surah/2. Tafseer pages are one per ayah.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const u = (path: string, priority?: number): MetadataRoute.Sitemap[number] => ({url: SITE + path, ...(priority ? {priority} : {})});
  const range = (n: number) => Array.from({length: n}, (_, i) => i + 1);
  return [
    u('/', 1), u('/juz', 0.6), u('/quiz', 0.5), u('/search', 0.5), u('/mushaf/1', 0.6),
    ...SURAHS.map(s => u(`/surah/${s.n}`, 0.9)),
    ...range(30).map(j => u(`/juz/${j}`, 0.7)),
    ...range(604).map(p => u(`/mushaf/${p}`, 0.5)),
    ...SURAHS.flatMap(s => range(s.ayahs).map(a => u(`/tafseer/${s.n}/${a}`, 0.8))),
    ...SURAHS.map(s => u(`/videos/${s.n}/1`, 0.5)),
    ...SURAHS.flatMap(s => range(Math.ceil(s.ayahs / QUIZ_PART)).map(p => u(`/quiz/${s.n}/${p}`, 0.3))),
  ];
}
