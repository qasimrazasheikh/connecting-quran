'use client';
import Link from 'next/link';
import {useEffect, useState} from 'react';
import {store, useApp} from './AppProvider';
import {Icon} from './Icons';
import {arNum, JUZ_START} from '@/lib/meta';
import {btn, cx, empty, grid, linkCard, numBadge} from '@/lib/ui';

type LastRead = {s: number; a: number; name: string};

export default function HomeList({tab}: {tab: 'surah' | 'juz'}) {
  const {surahs} = useApp();
  const [q, setQ] = useState('');
  const [lr, setLr] = useState<LastRead | null>(null);
  useEffect(() => setLr(store.get<LastRead | null>('lastRead', null)), []);
  const query = q.trim().toLowerCase();
  const tabCls = (on: boolean) => cx('rounded-full border px-4 py-2 text-sm font-medium no-underline', on ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-ink');
  const strip = (t: string) => t.replace(/^سُورَةُ\s*/, '');

  let list: React.ReactNode;
  if (!surahs.length) list = <div className={empty}>The surah list could not load. Check your internet connection and refresh.</div>;
  else if (tab === 'juz'){
    const items = JUZ_START.map(([s, a], i) => ({i: i + 1, s, a})).filter(j => !query || String(j.i) === query || surahs[j.s - 1].en.toLowerCase().includes(query));
    list = <div className={grid}>{items.map(j => (
      <Link key={j.i} className={linkCard} href={`/juz/${j.i}`}><div className={numBadge}>{j.i}</div>
        <div className="min-w-0 flex-1"><b className="block text-[15px]">Juz {j.i}</b><span className="text-[12.5px] text-muted">Starts {surahs[j.s - 1].en} {j.s}:{j.a}</span></div>
        <div className="font-amiri text-[22px] text-brand">{arNum(j.i)}</div></Link>))}</div>;
  } else {
    const qq = query.replace(/[^a-z]/g, '');
    const items = surahs.filter(s => !query || String(s.n) === query || (qq && s.en.toLowerCase().replace(/[^a-z]/g, '').includes(qq)) || s.mean.toLowerCase().includes(query) || s.ar.includes(q.trim()));
    list = items.length ? <div className={grid}>{items.map(s => (
      <Link key={s.n} className={linkCard} href={`/surah/${s.n}`}><div className={numBadge}>{s.n}</div>
        <div className="min-w-0 flex-1"><b className="block text-[15px]">{s.en}</b><span className="text-[12.5px] text-muted">{s.mean} · {s.ayahs} ayahs · {s.type}</span></div>
        <div className="font-amiri text-[22px] text-brand" dir="rtl">{strip(s.ar)}</div></Link>))}</div>
      : <div className={empty}>No surah matches “{q}”.</div>;
  }

  return (
    <>
      <section className="hero-bg hero-ring relative flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-2xl px-[18px] py-[22px] text-white md:px-6 md:py-7">
        <div>
          <h1 className="mb-1.5 mt-0 text-[28px] font-bold tracking-tight">Read the Holy Quran</h1>
          <p className="m-0 max-w-[520px] opacity-90">Arabic text with Urdu and English translations, and tafseer for every ayah. Pick a Surah or Juz to begin.</p>
          <Link className={cx(btn, 'mt-3.5 !border-white !bg-white !text-hero1')} href="/mushaf"><Icon.book /> Open Mushaf (Arabic only)</Link>
        </div>
        <div className="font-ar text-[34px] leading-relaxed text-accent2 [text-shadow:0_2px_20px_rgba(0,0,0,.25)]" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
      </section>
      {lr && <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-line bg-surface px-4 py-3.5 shadow-card">
        <div className={numBadge}><Icon.book /></div>
        <div><b className="block">Continue reading</b><span className="text-sm text-muted">Surah {lr.name} · Ayah {lr.a}</span></div>
        <Link className={cx(btn, 'ml-auto')} href={`/surah/${lr.s}/${lr.a}`}>Resume</Link>
      </div>}
      <div className="mb-3.5 mt-6 flex flex-wrap items-center gap-1.5">
        <Link className={tabCls(tab === 'surah')} href="/">Surah</Link>
        <Link className={tabCls(tab === 'juz')} href="/juz">Juz</Link>
        <input id="q" value={q} onChange={e => setQ(e.target.value)} placeholder={tab === 'juz' ? 'Filter juz…' : 'Search surah by name or number…'}
          className="w-full min-w-0 rounded-full border border-line bg-surface px-3.5 py-2 text-ink outline-none focus:border-brand md:ml-auto md:w-auto md:min-w-[220px]" />
      </div>
      {list}
    </>
  );
}
