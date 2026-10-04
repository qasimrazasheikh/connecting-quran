'use client';
import Link from 'next/link';
import {Fragment, useEffect, useMemo} from 'react';
import {store, useApp} from './AppProvider';
import {usePlayer} from './PlayerProvider';
import AyahText from './AyahText';
import {Icon} from './Icons';
import type {AyahView, ViewMeta} from '@/lib/views';
import {abtn, cx} from '@/lib/ui';

async function copyText(text: string, msg: string, toast: (m: string) => void){
  try{ await navigator.clipboard.writeText(text); toast(msg); }catch{ toast('Could not copy'); }
}

function AyahCard({ay, meta}: {ay: AyahView; meta: ViewMeta}) {
  const {settings, bookmarks, toggleBookmark, openTafsir, toast} = useApp();
  const {cur, playing, toggle} = usePlayer();
  const key = `${ay.s}:${ay.a}`, isCur = cur === key, bm = bookmarks.some(b => b.k === key);
  const copy = () => copyText([ay.ar, ...ay.trans.map(t => t.text)].join('\n\n') + `\n\n(Quran ${key})`, 'Ayah copied', toast);
  const link = () => copyText(`${location.origin}/surah/${ay.s}/${ay.a}`, 'Link copied', toast);
  return (
    <article id={`a-${ay.s}-${ay.a}`} data-key={key} data-s={ay.s} data-a={ay.a}
      className={cx('ayah mb-2.5 scroll-mt-20 rounded-2xl border border-line bg-surface p-3.5 shadow-card md:px-[18px] md:py-4', isCur && 'playing')}>
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="rounded-full bg-brand-soft px-[9px] py-[3px] text-[13px] font-semibold text-brand">{key}</span>
        <span className="flex-1" />
        <button className={abtn} data-act="play" title="Play recitation" onClick={() => toggle(key)}>{isCur && playing ? <Icon.pause /> : <Icon.play />}<span className="max-md:hidden">{isCur && playing ? 'Pause' : 'Play'}</span></button>
        <button className={abtn} data-act="tafsir" title="Tafseer" onClick={() => openTafsir(ay.s, ay.a, 'text')}><Icon.book /><span className="max-md:hidden">Tafseer</span></button>
        <button className={cx(abtn, 'font-semibold !text-yt')} data-act="videos" title="Video lectures on this surah" onClick={() => openTafsir(ay.s, ay.a, 'videos')}><Icon.yt /><span>Videos</span></button>
        <button className={cx(abtn, bm && '!text-accent')} data-act="bm" title="Bookmark" onClick={() => toggleBookmark(ay.s, ay.a)}>{bm ? <Icon.markOn /> : <Icon.mark />}</button>
        <button className={abtn} data-act="copy" title="Copy" onClick={copy}><Icon.copy /></button>
        <button className={abtn} data-act="link" title="Copy link" onClick={link}><Icon.link /></button>
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

/** List of ayah cards for a surah or juz. Registers the audio queue, remembers the last ayah read, and jumps to a chosen ayah. */
export default function AyahList({ayahs, meta, mode, focus}: {ayahs: AyahView[]; meta: ViewMeta; mode: 'surah' | 'juz'; focus?: number}) {
  const {surahs} = useApp();
  const {setQueue} = usePlayer();
  const queue = useMemo(() => ayahs.map(x => ({key: `${x.s}:${x.a}`, s: x.s, a: x.a, n: x.n, name: x.sname})), [ayahs]);
  useEffect(() => { setQueue(queue); }, [queue, setQueue]);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target as HTMLElement, s = +el.dataset.s!, a = +el.dataset.a!;
      store.set('lastRead', {s, a, name: surahs[s - 1]?.en || 'Surah ' + s});
    }), {rootMargin: '-30% 0px -60% 0px'});
    document.querySelectorAll('article.ayah').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [ayahs, surahs]);

  useEffect(() => {
    if (!focus || mode !== 'surah') { window.scrollTo(0, 0); return; }
    const el = document.getElementById(`a-${ayahs[0]?.s}-${focus}`); if (!el) return;
    el.classList.add('hl'); requestAnimationFrame(() => el.scrollIntoView({block: 'start'}));
    const t = setTimeout(() => el.classList.remove('hl'), 2500);
    return () => clearTimeout(t);
  }, [focus, mode, ayahs]);

  return (
    <div id="ayahs" className={meta.ip ? '' : 'no-ip'}>
      {ayahs.map((ay, i) => (
        <Fragment key={ay.s + ':' + ay.a}>
          {mode === 'juz' && (i === 0 || ayahs[i - 1].s !== ay.s) && <>
            <div className="mb-2.5 mt-[22px] flex items-center justify-between rounded-xl bg-[linear-gradient(90deg,var(--brandSoft),transparent)] px-3.5 py-2.5 font-semibold text-brand">
              <Link href={`/surah/${ay.s}`}>{ay.s}. {ay.sname}</Link><span className="font-amiri text-[22px]" dir="rtl">{surahs[ay.s - 1]?.ar}</span>
            </div>
            {ay.a === 1 && ay.s !== 1 && ay.s !== 9 && <div className="bism">{meta.bism}</div>}
          </>}
          <AyahCard ay={ay} meta={meta} />
        </Fragment>
      ))}
    </div>
  );
}
