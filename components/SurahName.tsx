'use client';
import {useEffect, useState} from 'react';
import {useApp} from './AppProvider';
import {cx} from '@/lib/ui';

// one check for the whole page: did quran.com's surah-name font load?
let fontOk: Promise<boolean> | null = null;
const checkFont = () => (fontOk ??= document.fonts
  ? document.fonts.load('24px surahnames', '001').then(f => f.length > 0, () => false)
  : Promise.resolve(false));

/**
 * Arabic surah name in quran.com's calligraphy: their font draws the text "001"…"114" as the surah's name and "surah" as سورة.
 * Sized relative to the surrounding text (the calligraphy runs small). Falls back to the plain Arabic name if the font can't load.
 */
export default function SurahName({n, prefix = false, className}: {n: number; prefix?: boolean; className?: string}) {
  const {surahs} = useApp();
  const [ok, setOk] = useState(true);
  useEffect(() => { let live = true; checkFont().then(v => { if (live) setOk(v); }); return () => { live = false; }; }, []);
  const ar = surahs[n - 1]?.ar || '', plain = prefix ? ar : ar.replace(/^سُورَةُ\s*/, '');
  if (!ok) return <span className={cx('font-amiri', className)} dir="rtl">{plain}</span>;
  // [number][surah] reads as "سورة <name>" (the glyphs are laid out left to right)
  return (
    <span className={cx('inline-block whitespace-nowrap font-sn text-[1.35em] leading-none', className)} translate="no" role="img" aria-label={plain}>
      <span>{String(n).padStart(3, '0')}</span>{prefix && <span>surah</span>}
    </span>
  );
}
