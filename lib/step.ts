import type {SurahInfo} from './quran';
/** The ayah before/after s:a across surah boundaries (null at the ends). */
export function stepAyah(surahs: SurahInfo[], s: number, a: number, dir: number): {s: number; a: number} | null {
  a += dir;
  if (a < 1){ s--; if (s < 1) return null; a = surahs[s - 1]?.ayahs || 1; }
  else if (a > (surahs[s - 1]?.ayahs || 286)){ s++; if (s > 114) return null; a = 1; }
  return {s, a};
}
