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
import {arNum, JUZ_PAGE, SURAH_PAGE} from '@/lib/meta';
import type {AyahView, TransText, ViewMeta} from '@/lib/views';
import {abtn, btnGhost, cx, sel, tafBtn} from '@/lib/ui';
import {Icon} from './Icons';

type Menu = {s: number; a: number; top: number; left: number} | null;
type Pg = {p: number; ayahs: AyahView[]};

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

/** Where the page in view counts as "current": this far down the window below the header and tools bar. */
const READ_LINE = 0.35;

/**
 * The Mushaf as one endless column of pages: it opens on page `p` (rendered by the server) and loads the next page as
 * the reader nears the bottom, the previous one near the top. The address follows the page in view, so a refresh or a
 * bookmark reopens there. `at`: the ayah named by ?at= (from the server, so it survives the address being tidied).
 */
export default function MushafView({p, ayahs, meta, at}: {p: number; ayahs: AyahView[]; meta: ViewMeta; at: string}) {
  const router = useRouter();
  const {settings, bookmarks, toggleBookmark, openTafsir, toast} = useApp();
  const {cur, playing, setQueue, toggle, stop} = usePlayer();
  const [pages, setPages] = useState<Pg[]>([{p, ayahs}]);
  const [curP, setCurP] = useState(p);   // the page in view
  const [loadErr, setLoadErr] = useState('');
  const [menu, setMenu] = useState<Menu>(null);
  const [pos, setPos] = useState({s: ayahs[0]?.s ?? 1, a: ayahs[0]?.a ?? 1}); // shown in the surah/ayah dropdowns
  const [hover, setHover] = useState('');  // ayah under the mouse (hover-capable screens), for its translation
  const [hl, setHl] = useState('');  // the ayah named by ?at= (e.g. a surah's first ayah when coming from the reader), if not first on the page
  const menuRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef(pages); pagesRef.current = pages;

  // The tools bar sticks under the site header, slides away while scrolling down and back on scrolling up. --mtop (header
  // + bar) is where a page's top goes when it is jumped to, and below it the reading line.
  const rootRef = useRef<HTMLDivElement>(null), barRef = useRef<HTMLDivElement>(null);
  const [hdr, setHdr] = useState(64), [barOff, setBarOff] = useState(false);
  useEffect(() => {
    const h = document.querySelector('header'), bar = barRef.current; if (!h || !bar) return;
    const size = () => { const hb = h.getBoundingClientRect().height; setHdr(hb); rootRef.current?.style.setProperty('--mtop', `${hb + bar.offsetHeight + 8}px`); };
    const ro = new ResizeObserver(size); ro.observe(h); ro.observe(bar); size();
    let y = scrollY;
    // only the reader's own scrolling moves it (not lining a page up on opening, or a jump)
    const sc = () => { const d = scrollY - y; if (Math.abs(d) > 6){ if (!opening.current && !leaving.current) setBarOff(d > 0 && scrollY > 300); y = scrollY; } };
    addEventListener('scroll', sc, {passive: true});
    return () => { ro.disconnect(); removeEventListener('scroll', sc); };
  }, []);
  const topOf = () => parseFloat(rootRef.current?.style.getPropertyValue('--mtop') || '0') || 120;

  // a new address or a settings refresh (new props from the server): start again from that page. `gen` drops answers
  // to requests made before it; `loading` keeps one request per page. Until the reader scrolls, pages loading above
  // keep the opened page lined up under the bar (`opening`); after that they keep whatever is being read in place.
  // `leaving`: a jump to another address is under way; the page in view must not rewrite the address meanwhile
  const gen = useRef(0), loading = useRef(new Set<number>()), opening = useRef(true), leaving = useRef(false);
  useEffect(() => {
    gen.current++; loading.current.clear(); setLoadErr(''); opening.current = true; leaving.current = false; setBarOff(false);
    setPages([{p, ayahs}]); setCurP(p); window.scrollTo(0, 0);
  }, [p, ayahs]);
  useEffect(() => {
    const user = () => { opening.current = false; };
    const keys = (e: KeyboardEvent) => { if (/^(Arrow|Page|Home|End| )/.test(e.key)) user(); };
    addEventListener('wheel', user, {passive: true}); addEventListener('touchmove', user, {passive: true}); addEventListener('keydown', keys);
    return () => { removeEventListener('wheel', user); removeEventListener('touchmove', user); removeEventListener('keydown', keys); };
  }, []);

  // a page added above the ones shown pushes them down: scroll by as much, so the text being read stays put
  const anchor = useRef<{p: number; top: number} | null>(null);
  const load = useCallback(async (n: number) => {
    if (n < 1 || n > 604 || loading.current.has(n) || pagesRef.current.some(x => x.p === n)) return;
    loading.current.add(n); const g = gen.current;
    try{
      const r = await fetch(`/api/mushaf/${n}`), j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      if (g !== gen.current) return;
      const first = pagesRef.current[0];
      if (first && n < first.p){ const el = document.getElementById(`mp-${first.p}`); if (el) anchor.current = {p: first.p, top: el.getBoundingClientRect().top}; }
      setLoadErr('');
      setPages(ps => ps.some(x => x.p === n) ? ps : [...ps, {p: n, ayahs: j.ayahs as AyahView[]}].sort((x, y) => x.p - y.p));
    }catch(e){ if (g === gen.current){ loading.current.delete(n); setLoadErr(`Could not load page ${n}. ${(e as Error).message}`); } }
  }, []);
  useLayoutEffect(() => {
    const a = anchor.current; if (!a) return; anchor.current = null;
    const el = document.getElementById(`mp-${opening.current ? p : a.p}`); if (!el) return;
    window.scrollBy(0, el.getBoundingClientRect().top - (opening.current ? topOf() : a.top));
  }, [pages, p]);

  // load the neighbours while they are still well out of sight
  const topRef = useRef<HTMLDivElement>(null), endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const ps = pagesRef.current;
      if (e.target === endRef.current) load(ps[ps.length - 1].p + 1); else load(ps[0].p - 1);
    }), {rootMargin: '2500px 0px'});   // about two pages ahead, so a quick scroll rarely meets the spinner
    [topRef.current, endRef.current].forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, [pages, load]);

  // the page in view: the last one whose top has passed the reading line
  useEffect(() => {
    let raf = 0;
    const find = () => {
      raf = 0; if (leaving.current) return;
      let n = pagesRef.current[0]?.p;
      const line = topOf() + (innerHeight - topOf()) * READ_LINE;
      for (const el of document.querySelectorAll<HTMLElement>('[data-page]')){ if (el.getBoundingClientRect().top <= line) n = +el.dataset.page!; else break; }
      if (n) setCurP(n);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(find); };
    addEventListener('scroll', on, {passive: true}); addEventListener('resize', on);
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);

  // the page in view sets the address, the dropdowns and where the reader is (Tafseer and the Mushaf link open there).
  // The last-read ayah is kept when it is on this page already (e.g. coming from a surah); ?at= names it on arrival.
  useEffect(() => {
    const pg = pages.find(x => x.p === curP); if (!pg || leaving.current) return;
    const lr = getLastRead();
    const named = curP === p && at ? pg.ayahs.find(x => `${x.s}:${x.a}` === at) : undefined, f = named || pg.ayahs[0];
    const keep = !named && pg.ayahs.some(x => x.s === lr?.s && x.a === lr.a);
    if (f && !keep) setLastRead({s: f.s, a: f.a, name: f.sname, page: curP, juz: f.juz});
    if (f) setPos(keep && lr ? {s: lr.s, a: lr.a} : {s: f.s, a: f.a});
    if (location.pathname !== `/mushaf/${curP}` || location.search) history.replaceState(null, '', `/mushaf/${curP}`);
  }, [curP, pages, p, at]);
  // highlighted only when it's further down its page; at the top of the page it needs no pointing out
  useEffect(() => { const named = at ? ayahs.find(x => `${x.s}:${x.a}` === at) : undefined; setHl(named && named !== ayahs[0] ? at : ''); }, [ayahs, at]);

  // jumps: a page already shown is scrolled to; any other opens fresh there (the site's loading screen shows meanwhile)
  const [pending, startNav] = useTransition();
  const nav = useCallback((u: string) => { leaving.current = true; stop(); navStart(u); scrollTo(0, 0); startNav(() => router.push(u)); }, [router, stop]);
  const go = useCallback((n: number) => {
    n = Math.min(604, Math.max(1, n | 0));
    const el = document.getElementById(`mp-${n}`);
    if (el){ opening.current = false; window.scrollBy(0, el.getBoundingClientRect().top - topOf()); } else nav(`/mushaf/${n}`);
  }, [nav]);
  // the page box follows the page in view, except while the reader is typing in it
  const [pgVal, setPgVal] = useState(String(p));
  useEffect(() => { if (document.activeElement?.id !== 'mPg') setPgVal(String(curP)); }, [curP]);
  // ← → keys: a page on (Arabic books open right-to-left)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName || '')) return;
      if (e.key === 'ArrowLeft') go(curP + 1); if (e.key === 'ArrowRight') go(curP - 1);
    };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  }, [curP, go]);

  // recitation runs on through every page shown; past the last one it loads the next and goes on from its first ayah
  const all = useMemo(() => pages.flatMap(pg => pg.ayahs), [pages]);
  const handOff = useRef(0);   // the page recitation is waiting for
  useEffect(() => {
    const q = all.map(x => ({key: `${x.s}:${x.a}`, s: x.s, a: x.a, n: x.n, name: x.sname}));
    let from = 0;
    if (handOff.current){
      const pg = pages.find(x => x.p === handOff.current); if (!pg) return;   // the player waits; it would start at q[0]
      from = q.findIndex(x => x.key === `${pg.ayahs[0].s}:${pg.ayahs[0].a}`); handOff.current = 0;
    }
    setQueue(q.slice(Math.max(0, from)), {onEnd: () => { const last = pagesRef.current.at(-1)!.p; if (last < 604){ handOff.current = last + 1; load(last + 1); } }});
  }, [all, pages, setQueue, load]);
  // while the last page shown is being recited, fetch the one after, so the queue runs on without a pause
  useEffect(() => {
    const last = pages.at(-1); if (cur && last?.ayahs.some(x => `${x.s}:${x.a}` === cur)) load(last.p + 1);
  }, [cur, pages, load]);

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
  const juz = pages.find(x => x.p === curP)?.ayahs[0]?.juz;
  const mkey = menu ? `${menu.s}:${menu.a}` : '', mbm = bookmarks.some(b => b.k === mkey);
  const tr = (k: string) => all.find(x => `${x.s}:${x.a}` === k)?.trans[0];
  // one popover at a time: the ayah menu (which carries the translation itself) wins, then hover, then the ayah being recited
  const popKey = menu ? '' : settings.mTrans && hover ? hover : settings.recTrans && playing && cur && tr(cur) ? cur : '';
  const mTr = menu && settings.mTrans ? tr(mkey) : undefined;

  const page = ({p: n, ayahs: list}: Pg) => {
    const nums = [...new Set(list.map(x => x.s))];
    return (
      <article key={n} id={`mp-${n}`} data-page={n} className="mx-auto max-w-[640px] rounded-md bg-paper p-1.5 shadow-card md:p-2.5">
        <div className="mframe flex flex-col px-2.5 pb-1.5 pt-2 md:px-4 md:pb-2 md:pt-2.5">
          <div className="mb-1.5 flex justify-between border-b border-line pb-1.5 text-[13px] text-muted"><span>Juz {list[0]?.juz}</span><span className="flex flex-row-reverse items-center gap-1.5 text-lg text-brand">{nums.map((s, i) => <Fragment key={s}>{i > 0 && <span>·</span>}<SurahName n={s} prefix /></Fragment>)}</span></div>
          <div className="mtext flex-1">
            {list.map(ay => {
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
          <div className="mt-1.5 border-t border-line pt-1.5 text-center text-[13px] text-muted">{arNum(n)} · Page {n} of 604</div>
        </div>
      </article>
    );
  };

  if (pending) return <PageLoading />;
  const first = pages[0].p, last = pages.at(-1)!.p;
  return (
    <div ref={rootRef} className={meta.ip ? '' : 'no-ip'}>
      <div ref={barRef} id="mBar" style={{top: hdr}} className={cx('sticky z-10 -mx-4 mb-3 flex flex-wrap items-center justify-center gap-2 border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-4 py-2 backdrop-blur-[10px] transition-transform duration-200',
        barOff && '-translate-y-[calc(100%+2px)]')}>
        {/* the ayah's page opens with it highlighted (the server finds the page for ?at=) */}
        <AyahPicker s={pos.s} a={pos.a} idPrefix="m" onGo={(s, a) => nav(a === 1 ? `/mushaf/${SURAH_PAGE[s - 1]}?at=${s}:1` : `/mushaf?at=${s}:${a}`)} />
        <select className={sel} id="mJuz" aria-label="Juz" value={juz ?? ''} onChange={e => go(JUZ_PAGE[+e.target.value - 1])}>
          {JUZ_PAGE.map((_, i) => <option key={i} value={i + 1}>Juz {i + 1}</option>)}</select>
        <form className="flex items-center gap-1.5 text-sm text-muted" onSubmit={e => { e.preventDefault(); const v = +pgVal; (e.currentTarget.elements.namedItem('pg') as HTMLInputElement).blur(); if (v) go(v); }}>
          <label htmlFor="mPg">Page</label>
          <input id="mPg" name="pg" className={cx(sel, 'w-[4.5rem]')} type="number" min={1} max={604} value={pgVal} inputMode="numeric"
            onChange={e => setPgVal(e.target.value)} onBlur={() => setPgVal(String(curP))} />
          <span>/ 604</span>
        </form>
      </div>
      {meta.tajweed && <div className="mx-auto max-w-[640px]"><TajweedKey /></div>}
      <div className="[overflow-anchor:none]">
        <div ref={topRef} />
        {first > 1 && <div className="grid place-items-center py-6"><div className="spin" /></div>}
        <div className="flex flex-col gap-4" id="mPages">{pages.map(page)}</div>
        <div ref={endRef} />
        {loadErr ? <div className="mx-auto mt-4 max-w-[640px] text-center text-sm text-muted">{loadErr} <button className={btnGhost} onClick={() => { setLoadErr(''); load(last + 1); }}>Try again</button></div>
          : last < 604 && <div className="grid place-items-center py-6"><div className="spin" /></div>}
      </div>
      <p className="mt-2.5 text-center text-[13px] text-muted">Tap an ayah for options. Scroll to keep reading; ← → keys jump a page.</p>
      {menu && (
        <div ref={menuRef} id="mMenu" className="fixed z-35 max-w-[min(94vw,460px)] rounded-xl border border-line bg-surface p-1.5 shadow-[0_8px_28px_rgba(0,0,0,.18)]" onClick={e => e.stopPropagation()}>
          {mTr && <div className="max-h-[40vh] overflow-y-auto border-b border-line px-2 pb-2 pt-1"><TransBody t={mTr} /></div>}
          <div className={cx('flex gap-0.5', mTr && 'pt-1')}>
            <b className="self-center px-1.5 text-xs text-muted">{mkey}</b>
            <button className={abtn} data-m="play" onClick={() => { setMenu(null); toggle(mkey); }}><Icon.play /><span className="max-sm:hidden">Play</span></button>
            <button className={tafBtn} data-m="tafsir" title="Read the tafseer of this ayah" onClick={() => { setMenu(null); openTafsir(menu.s, menu.a, 'text'); }}><Icon.book /><span>Tafseer</span></button>
            <button className={cx(abtn, mbm && '!text-accent')} data-m="bm" onClick={() => toggleBookmark(menu.s, menu.a)}>{mbm ? <Icon.markOn /> : <Icon.mark />}<span className="max-sm:hidden">{mbm ? 'Saved' : 'Bookmark'}</span></button>
            <button className={abtn} data-m="copy" onClick={() => { const ay = all.find(x => x.s === menu.s && x.a === menu.a); setMenu(null);
              navigator.clipboard.writeText(`${ay?.copy}\n\n(Quran ${mkey})`).then(() => toast('Ayah copied'), () => toast('Could not copy')); }}><Icon.copy /><span className="max-sm:hidden">Copy</span></button>
            <button className={cx(abtn, 'font-semibold !text-yt')} data-m="videos" onClick={() => { setMenu(null); openTafsir(menu.s, menu.a, 'videos'); }}><Icon.yt /><span>Videos</span></button>
          </div>
        </div>
      )}
      {popKey && <TransPop key={popKey} k={popKey} t={tr(popKey)!} follow={popKey !== hover} />}
    </div>
  );
}
