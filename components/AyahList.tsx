'use client';
import Link from 'next/link';
import {Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {useApp} from './AppProvider';
import {setLastRead} from './resume';
import {SHOW_AYAH_EVENT} from './show-ayah';
import {usePlayer} from './PlayerProvider';
import AyahText from './AyahText';
import SurahName from './SurahName';
import {Icon} from './Icons';
import type {AyahView, ViewMeta} from '@/lib/views';
import {abtn, cx, tafBtn} from '@/lib/ui';

async function copyText(text: string, msg: string, toast: (m: string) => void){
  try{ await navigator.clipboard.writeText(text); toast(msg); }catch{ toast('Could not copy'); }
}

function AyahCard({ay, meta}: {ay: AyahView; meta: ViewMeta}) {
  const {settings, bookmarks, toggleBookmark, openTafsir, toast} = useApp();
  const {cur, playing, toggle} = usePlayer();
  const key = `${ay.s}:${ay.a}`, isCur = cur === key, bm = bookmarks.some(b => b.k === key);
  const copy = () => copyText([ay.copy, ...ay.trans.map(t => t.text)].join('\n\n') + `\n\n(Quran ${key})`, 'Ayah copied', toast);
  const link = () => copyText(`${location.origin}/surah/${ay.s}/${ay.a}`, 'Link copied', toast);
  return (
    <article id={`a-${ay.s}-${ay.a}`} data-key={key} data-s={ay.s} data-a={ay.a}
      className={cx('ayah mb-2.5 scroll-mt-20 rounded-2xl border border-line bg-surface p-3.5 shadow-card md:px-[18px] md:py-4', isCur && 'playing')}>
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <span className="rounded-full bg-brand-soft px-[9px] py-[3px] text-[13px] font-semibold text-brand">{key}</span>
        <span className="flex-1" />
        {/* on phones the actions take their own full-width row under the ayah number, so the labelled Tafseer fits */}
        <div className="flex items-center gap-1.5 max-sm:w-full max-sm:justify-between max-sm:gap-0 max-sm:[&>button]:px-1.5">
          <button className={abtn} data-act="play" title="Play recitation" onClick={() => toggle(key)}>{isCur && playing ? <Icon.pause /> : <Icon.play />}<span className="max-md:hidden">{isCur && playing ? 'Pause' : 'Play'}</span></button>
          <button className={tafBtn} data-act="tafsir" title="Read the tafseer of this ayah" onClick={() => openTafsir(ay.s, ay.a, 'text')}><Icon.book /><span>Tafseer</span></button>
          <button className={cx(abtn, 'font-semibold !text-yt')} data-act="videos" title="Video lectures on this surah" onClick={() => openTafsir(ay.s, ay.a, 'videos')}><Icon.yt /><span>Videos</span></button>
          <button className={cx(abtn, bm && '!text-accent')} data-act="bm" title="Bookmark" onClick={() => toggleBookmark(ay.s, ay.a)}>{bm ? <Icon.markOn /> : <Icon.mark />}</button>
          <button className={abtn} data-act="copy" title="Copy" onClick={copy}><Icon.copy /></button>
          <button className={abtn} data-act="link" title="Copy link" onClick={link}><Icon.link /></button>
        </div>
      </div>
      {settings.showAr && <div className="atext my-1.5 mb-2.5" dir="rtl"><AyahText s={ay.s} a={ay.a} words={ay.words} wbw={settings.wbw && ay.words.some(w => w.k === 'w' && w.m)} className={cx('block', meta.ip && 'is-ip')} /></div>}
      {ay.trans.map((t, i) => (
        <div key={i} className="mt-2 border-t border-dashed border-line pt-2">
          <div className="mb-0.5 text-left text-[11.5px] uppercase tracking-wider text-muted" dir="ltr">{t.name}</div>
          <div className={cx('tr-text', t.lang === 'ur' && 'urdu')} dir={t.dir}>{t.text}</div>
        </div>
      ))}
    </article>
  );
}

/** Lists up to this long render whole; longer ones (Al-Baqarah has 286 ayahs, a juz up to ~560) render in batches. */
const ALL_UNDER = 40, BATCH = 20;
type Win = [number, number]; // rendered ayahs: indexes lo (inclusive) to hi (exclusive)

/** The plain text of ayahs not rendered yet, so search engines and screen readers still get the whole surah. */
const PlainText = ({items}: {items: AyahView[]}) => items.length ? (
  <div className="sr-only">{items.map(ay => <div key={ay.s + ':' + ay.a}>
    <p>{`${ay.s}:${ay.a}`}</p><p lang="ar" dir="rtl">{ay.copy}</p>{ay.trans.map((t, i) => <p key={i} lang={t.lang} dir={t.dir}>{t.text}</p>)}
  </div>)}</div>
) : null;

/**
 * List of ayah cards for a surah or juz. Registers the audio queue, remembers the last ayah read, and jumps to a chosen ayah.
 * Long lists start with one batch (from the chosen ayah, if any) and grow as the reader nears either end; the whole list
 * stays in memory, so a batch appears at once. showAyah() (player, ayah picker) renders a card on request.
 */
export default function AyahList({ayahs, meta, mode, focus}: {ayahs: AyahView[]; meta: ViewMeta; mode: 'surah' | 'juz'; focus?: number}) {
  const {surahs} = useApp();
  const {setQueue} = usePlayer();
  const queue = useMemo(() => ayahs.map(x => ({key: `${x.s}:${x.a}`, s: x.s, a: x.a, n: x.n, name: x.sname})), [ayahs]);
  useEffect(() => { setQueue(queue); }, [queue, setQueue]);

  const first = (): Win => {
    if (ayahs.length <= ALL_UNDER) return [0, ayahs.length];
    const f = focus && mode === 'surah' ? Math.max(0, ayahs.findIndex(x => x.a === focus)) : 0;
    return [f, Math.min(ayahs.length, f + BATCH)];
  };
  // a new surah, juz or chosen ayah starts a fresh window (set during render, so the first paint is already right)
  const [st, setSt] = useState(() => ({ayahs, focus, win: first()}));
  if (st.ayahs !== ayahs || st.focus !== focus) setSt({ayahs, focus, win: first()});
  const [lo, hi] = st.win;
  const setWin = (w: Win) => setSt(s => (s.win[0] === w[0] && s.win[1] === w[1] ? s : {...s, win: w}));

  // growing upwards adds height above what the reader is looking at: keep the first card where it was (measured after
  // layout, so browsers that already anchor the scroll — Chrome, Firefox — need no correction and Safari gets one)
  const anchor = useRef<{el: HTMLElement; top: number} | null>(null);
  useLayoutEffect(() => {
    const a = anchor.current; anchor.current = null;
    if (a && a.el.isConnected) window.scrollBy(0, a.el.getBoundingClientRect().top - a.top);
  }, [lo]);
  const grow = (dir: -1 | 1) => {
    if (dir < 0 && lo > 0){
      const el = document.querySelector<HTMLElement>('#ayahs article.ayah');
      if (el) anchor.current = {el, top: el.getBoundingClientRect().top};
      setWin([Math.max(0, lo - BATCH), hi]);
    }
    if (dir > 0 && hi < ayahs.length) setWin([lo, Math.min(ayahs.length, hi + BATCH)]);
  };
  // sentinels at both ends: a fresh observer per window reports at once, so short batches keep growing until the ends are out of reach
  const topRef = useRef<HTMLDivElement>(null), endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!('IntersectionObserver' in window) || (lo === 0 && hi === ayahs.length)) return;
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) grow(en.target === topRef.current ? -1 : 1); }), {rootMargin: '1200px 0px'});
    if (topRef.current) io.observe(topRef.current);
    if (endRef.current) io.observe(endRef.current);
    return () => io.disconnect();
  }, [lo, hi, ayahs]); // eslint-disable-line react-hooks/exhaustive-deps
  // showAyah(): a card near the window extends it; a far one starts a new window there
  useEffect(() => {
    const on = (e: Event) => {
      const i = ayahs.findIndex(x => `${x.s}:${x.a}` === (e as CustomEvent<string>).detail);
      if (i < 0 || (i >= lo && i < hi)) return;
      if (i >= lo - BATCH && i < hi + BATCH) setWin([Math.min(lo, i), Math.max(hi, i + 1)]);
      else setWin([i, Math.min(ayahs.length, i + BATCH)]);
    };
    window.addEventListener(SHOW_AYAH_EVENT, on); return () => window.removeEventListener(SHOW_AYAH_EVENT, on);
  }, [ayahs, lo, hi]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target as HTMLElement, s = +el.dataset.s!, a = +el.dataset.a!, ay = ayahs.find(x => x.s === s && x.a === a);
      setLastRead({s, a, name: surahs[s - 1]?.en || 'Surah ' + s, page: ay?.page, juz: ay?.juz});
    }), {rootMargin: '-30% 0px -60% 0px'});
    document.querySelectorAll('article.ayah').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [ayahs, surahs, lo, hi]);

  useEffect(() => {
    if (!focus || mode !== 'surah') { window.scrollTo(0, 0); return; }
    const el = document.getElementById(`a-${ayahs[0]?.s}-${focus}`); if (!el) return;
    el.classList.add('hl'); requestAnimationFrame(() => el.scrollIntoView({block: 'start'}));
    const t = setTimeout(() => el.classList.remove('hl'), 2500);
    return () => clearTimeout(t);
  }, [focus, mode, ayahs]);

  return (
    <>
      <PlainText items={ayahs.slice(0, lo)} />
      <div ref={topRef} aria-hidden />
      <div id="ayahs" className={meta.ip ? '' : 'no-ip'}>
        {ayahs.slice(lo, hi).map((ay, j) => { const i = lo + j; return (
          <Fragment key={ay.s + ':' + ay.a}>
            {mode === 'juz' && (i === 0 || ayahs[i - 1].s !== ay.s) && <>
              <div className="mb-2.5 mt-[22px] flex items-center justify-between rounded-xl bg-[linear-gradient(90deg,var(--brandSoft),transparent)] px-3.5 py-2.5 font-semibold text-brand">
                <Link href={`/surah/${ay.s}`}>{ay.s}. {ay.sname}</Link><span className="text-[22px]"><SurahName n={ay.s} prefix /></span>
              </div>
              {ay.a === 1 && ay.s !== 1 && ay.s !== 9 && <div className="bism">{meta.bism}</div>}
            </>}
            <AyahCard ay={ay} meta={meta} />
          </Fragment>
        ); })}
      </div>
      <div ref={endRef} aria-hidden />
      {hi < ayahs.length && <div className="grid place-items-center py-6"><div className="spin" /></div>}
      <PlainText items={ayahs.slice(hi)} />
    </>
  );
}
