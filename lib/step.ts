import type {SurahInfo} from './quran';
/** Study panel tabs. Videos keep their own address; other tabs are a ?tab= on the tafseer page. */
export type StudyTab = 'text' | 'more' | 'videos' | 'related';
export const STUDY_TABS: StudyTab[] = ['text', 'more', 'videos', 'related'];
export const studyHref = (t: StudyTab, s: number, a: number) => t === 'videos' ? `/videos/${s}/${a}` : `/tafseer/${s}/${a}${t === 'text' ? '' : `?tab=${t}`}`;
/** The ayah before/after s:a across surah boundaries (null at the ends). */
export function stepAyah(surahs: SurahInfo[], s: number, a: number, dir: number): {s: number; a: number} | null {
  a += dir;
  if (a < 1){ s--; if (s < 1) return null; a = surahs[s - 1]?.ayahs || 1; }
  else if (a > (surahs[s - 1]?.ayahs || 286)){ s++; if (s > 114) return null; a = 1; }
  return {s, a};
}
