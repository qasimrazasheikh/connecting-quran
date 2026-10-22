'use client';
import {useRouter} from 'next/navigation';
import {Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition} from 'react';
import {useApp} from './AppProvider';
import {usePlayer} from './PlayerProvider';
import {getLastRead, setLastRead} from './resume';
import {navStart} from './NavProgress';
import AyahText from './AyahText';
import SurahName from './SurahName';
import AyahPicker from './AyahPicker';
import PageLoading from './PageLoading';
import TajweedKey from './TajweedKey';
import {Icon} from './Icons';
import {arNum, JUZ_PAGE, SURAH_PAGE} from '@/lib/meta';
import type {AyahView, TransText, ViewMeta} from '@/lib/views';
import {abtn, btnGhost, cx, sel, tafBtn} from '@/lib/ui';

type Menu = {s: number; a: number; top: number; left: number} | null;

/** One translation, as shown in the Mushaf's popovers and ayah menu. */
const TransBody = ({t}: {t: TransText}) => <div className={cx('text-[15px] leading-relaxed', t.lang === 'ur' && 'urdu !text-[18px] !leading-[2.1]')} dir={t.dir}>{t.text}</div>;

/** A translation popover by one ayah of the page: under it, or above when there's no room; `follow` keeps it there on scroll. */
function TransPop({k, t, follow}: {k: string; t: TransText; follow?: boolean}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const el = document.querySelector(`.mayah[data-key="${k}"]`), box = ref.current; if (!el || !box) return;
      const r = el.getBoundingClientRect(), h = box.offsetHeight, w = box.offsetWidth;
      let top = r.bottom + 8; if (top + h > innerHeight - 96) top = Math.max(8, r.top - h - 8);   // 96: clear of the audio player
      box.style.top = top + 'px'; box.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)) + 'px';
    };
    place(); if (!follow) return;
    addEventListener('scroll', place, {passive: true}); addEventListener('resize', place);
    return () => { removeEventListener('scroll', place); removeEventListener('resize', place); };
  }, [k, follow]);
  return (
    <div ref={ref} role="tooltip" id="mTransPop" className="pointer-events-none fixed z-30 w-max max-w-[min(92vw,440px)] rounded-xl border border-line bg-surface px-3.5 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,.18)]">
      <div className="mb-0.5 text-[11px] uppercase tracking-wider text-muted">{k} · {t.name}</div>
      <TransBody t={t} />
    </div>
  );
}

/** `at`: the ayah named by ?at= (from the server, so it survives the address being tidied to /mushaf/<page>). */
export default function MushafView({p, ayahs, meta, at}: {p: number; ayahs: AyahView[]; meta: ViewMeta; at: string}) {
  const router = useRouter();
  const {surahs, settings, bookmarks, toggleBookmark, openTafsir, toast} = useApp();
  const {cur, playing, setQueue, toggle} = usePlayer();
  const [menu, setMenu] = useState<Menu>(null);
  const [pos, setPos] = useState({s: ayahs[0]?.s ?? 1, a: ayahs[0]?.a ?? 1}); // shown in the surah/ayah dropdowns
  const [hover, setHover] = useState('');  // ayah under the mouse (hover-capable screens), for its translation
  const [hl, setHl] = useState('');  // the ayah named by ?at= (e.g. a surah's first ayah when coming from the reader), if not first on the page
  const menuRef = useRef<HTMLDivElement>(null);

  // pending until the new page has rendered; meanwhile the site's usual loading screen shows
  const [pending, startNav] = useTransition();
  const nav = useCallback((u: string) => { navStart(u); scrollTo(0, 0); startNav(() => router.push(u)); }, [router]);
  const go = useCallback((n: number) => { n = Math.min(604, Math.max(1, n | 0)); if (n !== p) nav(`/mushaf/${n}`); }, [p, nav]);
  const queue = useMemo(() => ayahs.map(x => ({key: `${x.s}:${x.a}`, s: x.s, a: x.a, n: x.n, name: x.sname})), [ayahs]);
  useEffect(() => { setQueue(queue, {onEnd: p < 604 ? () => { navStart(`/mushaf/${p + 1}`); router.push(`/mushaf/${p + 1}`); } : undefined}); }, [queue, setQueue, p, router]);
  // the page's first ayah is where the reader is (Tafseer and the Mushaf link open there)
  // (kept as is when the last-read ayah is already on this page, e.g. coming from a surah)
  useEffect(() => {
    const lr = getLastRead();
    const named = at ? ayahs.find(x => `${x.s}:${x.a}` === at) : undefined, f = named || ayahs[0];
    const keep = !at && ayahs.some(x => x.s === lr?.s && x.a === lr.a);
    if (f && !keep) setLastRead({s: f.s, a: f.a, name: f.sname, page: p, juz: f.juz});
    if (f) setPos(keep && lr ? {s: lr.s, a: lr.a} : {s: f.s, a: f.a});
    // highlighted only when it's further down the page; at the top of the page it needs no pointing out
    setHl(named && named !== ayahs[0] ? `${named.s}:${named.a}` : '');
    if (/[?&]at=/.test(location.search)) history.replaceState(null, '', `/mushaf/${p}`);
  }, [ayahs, p, at]);
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
  const tr = (k: string) => ayahs.find(x => `${x.s}:${x.a}` === k)?.trans[0];
  // one popover at a time: the ayah menu (which carries the translation itself) wins, then hover, then the ayah being recited
  const popKey = menu ? '' : settings.mTrans && hover ? hover : settings.recTrans && playing && cur && tr(cur) ? cur : '';
  const mTr = menu && settings.mTrans ? tr(mkey) : undefined;
  const navBtn = 'grid size-11 flex-none place-items-center rounded-full border border-line bg-surface text-brand disabled:cursor-default disabled:opacity-35 max-[760px]:hidden [&_svg]:size-[22px]';

  // page turns above and below the page (the side arrows are hidden on small screens); next is on the left, as in a Mushaf
  const pager = (
    <div className="mx-auto flex max-w-[640px] justify-between gap-2.5">
      <button className={btnGhost} disabled={p >= 604} onClick={() => go(p + 1)}>← Next page</button>
      <button className={btnGhost} disabled={p <= 1} onClick={() => go(p - 1)}>Previous page →</button>
    </div>
  );
  if (pending) return <PageLoading />;
  return (
    <div className={meta.ip ? '' : 'no-ip'}>
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
        {/* the ayah's page opens with it highlighted (the server finds the page for ?at=) */}
        <AyahPicker s={pos.s} a={pos.a} idPrefix="m" onGo={(s, a) => nav(a === 1 ? `/mushaf/${SURAH_PAGE[s - 1]}?at=${s}:1` : `/mushaf?at=${s}:${a}`)} />
        <select className={sel} id="mJuz" aria-label="Juz" value={juz ?? ''} onChange={e => go(JUZ_PAGE[+e.target.value - 1])}>
          {JUZ_PAGE.map((_, i) => <option key={i} value={i + 1}>Juz {i + 1}</option>)}</select>
      </div>
      <div className="mb-3">{pager}</div>
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
                      onClick={e => { e.stopPropagation(); setHover(''); showMenu(e.currentTarget, ay.s, ay.a); }}
                      onMouseEnter={() => { if (matchMedia('(hover: hover)').matches) setHover(key); }} onMouseLeave={() => setHover(h => (h === key ? '' : h))}>
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
      <div className="mt-3">{pager}</div>
      <p className="mt-2.5 text-center text-[13px] text-muted">Tap an ayah for options. Swipe or use ← → keys to turn pages.</p>
      {menu && (
        <div ref={menuRef} id="mMenu" className="fixed z-35 max-w-[min(94vw,460px)] rounded-xl border border-line bg-surface p-1.5 shadow-[0_8px_28px_rgba(0,0,0,.18)]" onClick={e => e.stopPropagation()}>
          {mTr && <div className="max-h-[40vh] overflow-y-auto border-b border-line px-2 pb-2 pt-1"><TransBody t={mTr} /></div>}
          <div className={cx('flex gap-0.5', mTr && 'pt-1')}>
            <b className="self-center px-1.5 text-xs text-muted">{mkey}</b>
            <button className={abtn} data-m="play" onClick={() => { setMenu(null); toggle(mkey); }}><Icon.play /><span className="max-sm:hidden">Play</span></button>
            <button className={tafBtn} data-m="tafsir" title="Read the tafseer of this ayah" onClick={() => { setMenu(null); openTafsir(menu.s, menu.a, 'text'); }}><Icon.book /><span>Tafseer</span></button>
            <button className={cx(abtn, mbm && '!text-accent')} data-m="bm" onClick={() => toggleBookmark(menu.s, menu.a)}>{mbm ? <Icon.markOn /> : <Icon.mark />}<span className="max-sm:hidden">{mbm ? 'Saved' : 'Bookmark'}</span></button>
            <button className={abtn} data-m="copy" onClick={() => { const ay = ayahs.find(x => x.s === menu.s && x.a === menu.a); setMenu(null);
              navigator.clipboard.writeText(`${ay?.copy}\n\n(Quran ${mkey})`).then(() => toast('Ayah copied'), () => toast('Could not copy')); }}><Icon.copy /><span className="max-sm:hidden">Copy</span></button>
            <button className={cx(abtn, 'font-semibold !text-yt')} data-m="videos" onClick={() => { setMenu(null); openTafsir(menu.s, menu.a, 'videos'); }}><Icon.yt /><span>Videos</span></button>
          </div>
        </div>
      )}
      {popKey && <TransPop key={popKey} k={popKey} t={tr(popKey)!} follow={popKey !== hover} />}
    </div>
  );
}
