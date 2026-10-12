'use client';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import AyahPicker from './AyahPicker';
import {navStart} from './NavProgress';
import {LAST_READ_EVENT, type LastRead} from './resume';

/** Surah + ayah dropdowns for the surah reader. They follow the ayah being read; an ayah in this surah is scrolled to directly. */
export default function ReaderPicker({s, focus}: {s: number; focus?: number}) {
  const router = useRouter();
  const [a, setA] = useState(focus || 1);
  useEffect(() => setA(focus || 1), [s, focus]);
  useEffect(() => {
    const on = (e: Event) => { const lr = (e as CustomEvent<LastRead>).detail; if (lr.s === s) setA(lr.a); };
    window.addEventListener(LAST_READ_EVENT, on); return () => window.removeEventListener(LAST_READ_EVENT, on);
  }, [s]);
  const go = (ss: number, aa: number) => {
    const el = ss === s ? document.getElementById(`a-${s}-${aa}`) : null;
    if (!el){ const u = aa === 1 ? `/surah/${ss}` : `/surah/${ss}/${aa}`; navStart(u); router.push(u); return; }
    setA(aa); history.replaceState(null, '', `/surah/${s}/${aa}`);
    el.scrollIntoView({block: 'start'}); el.classList.add('hl'); setTimeout(() => el.classList.remove('hl'), 2500);
  };
  return <div className="mb-3 flex flex-wrap items-center gap-2"><AyahPicker s={s} a={a} onGo={go} idPrefix="r" /></div>;
}
