'use client';
import {useApp} from './AppProvider';
import SurahSearch from './SurahSearch';
import {cx, sel} from '@/lib/ui';

/** Surah box to type in + ayah dropdown, showing the current position; choosing a surah goes to its first ayah. */
export default function AyahPicker({s, a, onGo, idPrefix, className}: {s: number; a: number; onGo: (s: number, a: number) => void; idPrefix: string; className?: string}) {
  const {surahs} = useApp();
  const count = surahs[s - 1]?.ayahs || a;
  return (
    <>
      <SurahSearch s={s} onPick={n => onGo(n, 1)} id={`${idPrefix}Surah`} className={className} />
      <select className={cx(sel, className)} id={`${idPrefix}Ayah`} aria-label="Ayah" value={a} onChange={e => onGo(s, +e.target.value)}>
        {Array.from({length: count}, (_, i) => <option key={i} value={i + 1}>Ayah {i + 1}</option>)}</select>
    </>
  );
}
