'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {useApp} from './AppProvider';
import AyahPicker from './AyahPicker';
import TafseerPanel from './TafseerPanel';
import {navStart} from './NavProgress';
import {arNum} from '@/lib/meta';
import {IP_END} from '@/lib/text';
import {stepAyah, studyHref, type StudyTab} from '@/lib/step';
import {btnGhost, cx} from '@/lib/ui';

type Quote = {ar: string; ip: boolean; trans: {name: string; lang: string; dir: 'rtl' | 'ltr'; text: string}[]} | null;

export default function TafseerPage({s, a, tab, quote}: {s: number; a: number; tab: StudyTab; quote: Quote}) {
  const router = useRouter();
  const {surahs, setTafTab} = useApp();
  useEffect(() => { setTafTab(tab); }, [tab, setTafTab]);
  const go = (ss: number, aa: number) => { const u = studyHref(tab, ss, aa); navStart(u); router.push(u); };
  const step = (d: number) => { const p = stepAyah(surahs, s, a, d); if (p) go(p.s, p.a); };
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AyahPicker s={s} a={a} onGo={go} idPrefix="tp" />
      </div>
      <div className={cx('mb-4 rounded-xl bg-surface2 px-4 py-3', quote && !quote.ip && 'no-ip')} id="tpQuote">
        {quote ? <>
          <div className={cx('q-ar', quote.ip && 'is-ip')} style={{fontSize: 'calc(var(--ar-size) - 4px)', lineHeight: 2}}>{quote.ar}{!IP_END.test(quote.ar.split(' ').pop() || '') && <> <span className="endmark">{arNum(a)}</span></>}</div>
          {quote.trans.map((t, i) => <div key={i} className="mt-2 border-t border-dashed border-line pt-2"><div className="mb-0.5 text-[11.5px] uppercase tracking-wider text-muted">{t.name}</div><div className={cx('tr-text', t.lang === 'ur' && 'urdu')} dir={t.dir}>{t.text}</div></div>)}
        </> : <span className="text-muted">Ayah text could not be loaded.</span>}
      </div>
      <TafseerPanel s={s} a={a} tab={tab} onTab={t => { setTafTab(t); router.replace(studyHref(t, s, a), {scroll: false}); }} />
      <div className="mt-5 flex justify-between gap-2.5">
        <button className={btnGhost} id="tpPrev" disabled={s === 1 && a === 1} onClick={() => step(-1)}>← Previous ayah</button>
        <Link className={cx(btnGhost, 'max-sm:hidden')} href={`/surah/${s}/${a}`}>Read in surah</Link>
        <button className={btnGhost} id="tpNext" disabled={s === 114 && a === 6} onClick={() => step(1)}>Next ayah →</button>
      </div>
    </section>
  );
}
