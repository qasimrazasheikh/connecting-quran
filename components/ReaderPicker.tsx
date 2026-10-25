'use client';
import {useRouter} from 'next/navigation';
import {useEffect, useState, type ReactNode} from 'react';
import AyahPicker from './AyahPicker';
import {navStart} from './NavProgress';
import {LAST_READ_EVENT, type LastRead} from './resume';
import {showAyah} from './show-ayah';

/**
 * Surah + ayah dropdowns for the surah reader. They follow the ayah being read; an ayah in this surah is scrolled to directly.
 * `children` (e.g. the translations button) sit at the right end of the same bar.
 */
export default function ReaderPicker({s, focus, children}: {s: number; focus?: number; children?: ReactNode}) {
  const router = useRouter();
  const [a, setA] = useState(focus || 1);
  useEffect(() => setA(focus || 1), [s, focus]);
  useEffect(() => {
    const on = (e: Event) => { const lr = (e as CustomEvent<LastRead>).detail; if (lr.s === s) setA(lr.a); };
    window.addEventListener(LAST_READ_EVENT, on); return () => window.removeEventListener(LAST_READ_EVENT, on);
  }, [s]);
  const go = async (ss: number, aa: number) => {
    // an ayah of this surah is shown in place (rendering its batch first if needed); another surah is a new page
    const el = ss === s ? await showAyah(`${s}:${aa}`) : null;
    if (!el){ const u = aa === 1 ? `/surah/${ss}` : `/surah/${ss}/${aa}`; navStart(u); router.push(u); return; }
    setA(aa); history.replaceState(null, '', `/surah/${s}/${aa}`);
    el.scrollIntoView({block: 'start'}); el.classList.add('hl'); setTimeout(() => el.classList.remove('hl'), 2500);
  };
  return <div className="mb-3 flex flex-wrap items-center gap-2"><AyahPicker s={s} a={a} onGo={go} idPrefix="r" />{children && <div className="ml-auto flex items-center gap-2">{children}</div>}</div>;
}
