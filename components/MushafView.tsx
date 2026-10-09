'use client';
import {useRouter} from 'next/navigation';
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useApp} from './AppProvider';
import {usePlayer} from './PlayerProvider';
import {getLastRead, setLastRead} from './resume';
import {navStart} from './NavProgress';
import AyahText from './AyahText';
import SurahName from './SurahName';
import TajweedKey from './TajweedKey';
import {Icon} from './Icons';
import {arNum, JUZ_PAGE, SURAH_PAGE} from '@/lib/meta';
import type {AyahView, ViewMeta} from '@/lib/views';
import {abtn, cx, sel} from '@/lib/ui';

type Menu = {s: number; a: number; top: number; left: number} | null;

export default function MushafView({p, ayahs, meta}: {p: number; ayahs: AyahView[]; meta: ViewMeta}) {
  const router = useRouter();
  const {surahs, settings, bookmarks, toggleBookmark, openTafsir, toast} = useApp();
  const {cur, setQueue, toggle} = usePlayer();
  const [menu, setMenu] = useState<Menu>(null);
  const [pg, setPg] = useState(String(p));
  const [hl, setHl] = useState('');  // the ayah named by ?at= (e.g. a surah's first ayah when coming from the reader), if not first on the page
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => setPg(String(p)), [p]);

  const go = useCallback((n: number) => { n = Math.min(604, Math.max(1, n | 0)); if (n !== p){ navStart(`/mushaf/${n}`); router.push(`/mushaf/${n}`); } }, [p, router]);
  const queue = useMemo(() => ayahs.map(x => ({key: `${x.s}:${x.a}`, s: x.s, a: x.a, n: x.n, name: x.sname})), [ayahs]);
  useEffect(() => { setQueue(queue, {onEnd: p < 604 ? () => { navStart(`/mushaf/${p + 1}`); router.push(`/mushaf/${p + 1}`); } : undefined}); }, [queue, setQueue, p, router]);
  // the page's first ayah is where the reader is (Tafseer and the Mushaf link open there)
  // (kept as is when the last-read ayah is already on this page, e.g. coming from a surah)
  useEffect(() => {
    const lr = getLastRead(), at = location.search.match(/[?&]at=(\d+):(\d+)/);
    const named = at && ayahs.find(x => x.s === +at[1] && x.a === +at[2]), f = named || ayahs[0];
    if (f && (at || !ayahs.some(x => x.s === lr?.s && x.a === lr.a))) setLastRead({s: f.s, a: f.a, name: f.sname, page: p, juz: f.juz});
    // highlighted only when it's further down the page; at the top of the page it needs no pointing out
    setHl(named && named !== ayahs[0] ? `${named.s}:${named.a}` : '');
    if (at) history.replaceState(null, '', `/mushaf/${p}`);
  }, [ayahs, p]);
  useEffect(() => { [p + 1, p - 1].filter(n => n >= 1 && n <= 604).forEach(n => router.prefetch(`/mushaf/${n}`)); window.scrollTo(0, 0); }, [p, router]);
  // ← → keys turn pages (Arabic books open right-to-left)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) return;
      if (e.key === 'ArrowLeft') go(p + 1); if (e.key === 'ArrowRight') go(p - 1);
    };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [p, go]);
  // menu closes on outside click or scroll
  useEffect(() => {
    if (!menu) return;
    const off = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node) && !(e.target as Element).closest?.('.mayah')) setMenu(null); };
    const sc = () => setMenu(null);
    document.addEventListener('click', off); window.addEventListener('scroll', sc, {passive: true});
    return () => { document.removeEventListener('click', off); window.removeEventListener('scroll', sc); };
  }, [menu]);
  useEffect(() => {
    const el = menuRef.current; if (!el || !menu) return;
    el.style.left = Math.max(8, Math.min(menu.left - el.offsetWidth / 2, innerWidth - el.offsetWidth - 8)) + 'px';
    let top = menu.top - el.offsetHeight - 8; if (top < 70) top = menu.top + 8 + 34;
    el.style.top = Math.min(top, innerHeight - el.offsetHeight - 8) + 'px';
  }, [menu]);

  const showMenu = (el: HTMLElement, s: number, a: number) => {
    if (menu && menu.s === s && menu.a === a){ setMenu(null); return; }
    const r = el.getClientRects()[0] || el.getBoundingClientRect();
    setMenu({s, a, top: r.top, left: r.left + r.width / 2});
  };
  const touch = useRef<{x: number; y: number} | null>(null);
  const juz = ayahs[0]?.juz;
  const nums = [...new Set(ayahs.map(x => x.s))];
  const mkey = menu ? `${menu.s}:${menu.a}` : '', mbm = bookmarks.some(b => b.k === mkey);
  const navBtn = 'grid size-11 flex-none place-items-center rounded-full border border-line bg-surface text-brand disabled:cursor-default disabled:opacity-35 max-[760px]:hidden [&_svg]:size-[22px]';

  return (
    <div className={meta.ip ? '' : 'no-ip'}>
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        <select className={sel} id="mSurah" value="" onChange={e => e.target.value && go(SURAH_PAGE[+e.target.value - 1])}>
          <option value="">Go to surah…</option>{surahs.map(x => <option key={x.n} value={x.n}>{x.n}. {x.en}</option>)}</select>
        <select className={sel} id="mJuz" value="" onChange={e => e.target.value && go(JUZ_PAGE[+e.target.value - 1])}>
          <option value="">Go to juz…</option>{JUZ_PAGE.map((_, i) => <option key={i} value={i + 1}>Juz {i + 1}</option>)}</select>
        <form id="mPg" className="flex overflow-hidden rounded-[9px] border border-line bg-surface" onSubmit={e => { e.preventDefault(); go(+pg); }}>
          <input id="mPgIn" inputMode="numeric" value={pg} onChange={e => setPg(e.target.value)} aria-label="Page number" className="w-16 border-0 bg-transparent px-2 py-[7px] text-center text-ink outline-none" />
          <button className="border-0 bg-brand px-3 text-on-brand">Go</button>
        </form>
      </div>
      <div className="flex items-center justify-center gap-2">
        <button className={navBtn} id="mNext" disabled={p >= 604} aria-label="Next page" onClick={() => go(p + 1)}><Icon.left /></button>
        <article id="mPage" className="max-w-[640px] flex-1 touch-pan-y rounded-md bg-paper p-1.5 shadow-card md:p-2.5"
          onTouchStart={e => { touch.current = {x: e.touches[0].clientX, y: e.touches[0].clientY}; }}
          onTouchEnd={e => { const t = touch.current; if (!t) return; touch.current = null; const dx = e.changedTouches[0].clientX - t.x, dy = e.changedTouches[0].clientY - t.y;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx > 0 ? p + 1 : p - 1); }}>
          <div className="mframe flex min-h-[60vh] flex-col px-2.5 pb-1.5 pt-2 md:px-4 md:pb-2 md:pt-2.5">
            <div className="mb-1.5 flex justify-between border-b border-line pb-1.5 text-[13px] text-muted"><span>Juz {juz}</span><span className="flex flex-row-reverse items-center gap-1.5 text-lg text-brand">{nums.map((n, i) => <Fragment key={n}>{i > 0 && <span>·</span>}<SurahName n={n} prefix /></Fragment>)}</span></div>
            {meta.tajweed && <TajweedKey />}
            <div className="mtext flex-1" id="mText">
              {ayahs.map(ay => {
                const key = `${ay.s}:${ay.a}`;
                return (
                  <span key={key}>
                    {ay.a === 1 && <><div className="mtitle"><SurahName n={ay.s} prefix /></div>{ay.s !== 1 && ay.s !== 9 && <div className="bism !my-1 !text-[calc(var(--ar-size)*.9)]">{meta.bism}</div>}</>}
                    <span data-key={key} data-s={ay.s} data-a={ay.a} className={cx('mayah', (menu ? mkey === key : hl === key) && 'sel', cur === key && 'playing')}
                      onClick={e => { e.stopPropagation(); showMenu(e.currentTarget, ay.s, ay.a); }}>
                      <AyahText s={ay.s} a={ay.a} words={ay.words} wbw={settings.wbw && ay.words.some(w => w.k === 'w' && w.m)} className={cx('!text-[length:inherit]', meta.ip && 'is-ip')}
                        onAyah={() => { const el = document.querySelector(`.mayah[data-key="${key}"]`) as HTMLElement; if (el) showMenu(el, ay.s, ay.a); }} />
                    </span>{' '}
                  </span>
                );
              })}
            </div>
            <div className="mt-1.5 border-t border-line pt-1.5 text-center text-[13px] text-muted">{arNum(p)} · Page {p} of 604</div>
          </div>
        </article>
        <button className={navBtn} id="mPrev" disabled={p <= 1} aria-label="Previous page" onClick={() => go(p - 1)}><Icon.right /></button>
      </div>
      <p className="mt-2.5 text-center text-[13px] text-muted">Tap an ayah for options. Swipe or use ← → keys to turn pages.</p>
      {menu && (
        <div ref={menuRef} id="mMenu" className="fixed z-35 flex gap-0.5 rounded-xl border border-line bg-surface p-1.5 shadow-[0_8px_28px_rgba(0,0,0,.18)]" onClick={e => e.stopPropagation()}>
          <b className="self-center px-1.5 text-xs text-muted">{mkey}</b>
          <button className={abtn} data-m="play" onClick={() => { setMenu(null); toggle(mkey); }}><Icon.play /><span className="max-sm:hidden">Play</span></button>
          <button className={abtn} data-m="tafsir" onClick={() => { setMenu(null); openTafsir(menu.s, menu.a, 'text'); }}><Icon.book /><span className="max-sm:hidden">Tafseer</span></button>
          <button className={cx(abtn, mbm && '!text-accent')} data-m="bm" onClick={() => toggleBookmark(menu.s, menu.a)}>{mbm ? <Icon.markOn /> : <Icon.mark />}<span className="max-sm:hidden">{mbm ? 'Saved' : 'Bookmark'}</span></button>
          <button className={abtn} data-m="copy" onClick={() => { const ay = ayahs.find(x => x.s === menu.s && x.a === menu.a); setMenu(null);
            navigator.clipboard.writeText(`${ay?.copy}\n\n(Quran ${mkey})`).then(() => toast('Ayah copied'), () => toast('Could not copy')); }}><Icon.copy /><span className="max-sm:hidden">Copy</span></button>
          <button className={cx(abtn, 'font-semibold !text-yt')} data-m="videos" onClick={() => { setMenu(null); openTafsir(menu.s, menu.a, 'videos'); }}><Icon.yt /><span>Videos</span></button>
        </div>
      )}
    </div>
  );
}
