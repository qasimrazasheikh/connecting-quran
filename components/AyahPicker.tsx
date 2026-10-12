'use client';
import {useApp} from './AppProvider';
import {cx, sel} from '@/lib/ui';

/** Surah + ayah dropdowns showing the current position; choosing a surah goes to its first ayah. */
export default function AyahPicker({s, a, onGo, idPrefix, className}: {s: number; a: number; onGo: (s: number, a: number) => void; idPrefix: string; className?: string}) {
  const {surahs} = useApp();
  const count = surahs[s - 1]?.ayahs || a;
  return (
    <>
      <select className={cx(sel, className)} id={`${idPrefix}Surah`} aria-label="Surah" value={s} onChange={e => onGo(+e.target.value, 1)}>
        {surahs.map(x => <option key={x.n} value={x.n}>{x.n}. {x.en}</option>)}</select>
      <select className={cx(sel, className)} id={`${idPrefix}Ayah`} aria-label="Ayah" value={a} onChange={e => onGo(s, +e.target.value)}>
        {Array.from({length: count}, (_, i) => <option key={i} value={i + 1}>Ayah {i + 1}</option>)}</select>
    </>
  );
}
