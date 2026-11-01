'use client';
import {useEffect, useMemo, useState, type ReactNode} from 'react';
import {useApp} from './AppProvider';
import {Icon} from './Icons';
import Link from 'next/link';
import {getEditions, getQoh, getRelated, getStudy, getTafsir, type QohTafsir, type Study} from '@/lib/client-data';
import type {RelatedItem, VideoCard} from '@/lib/catalog';
import {isQoh, tafsirTwin, type TafsirEdition} from '@/lib/meta';
import type {StudyTab} from '@/lib/step';
import {tafsirHtml} from '@/lib/tafsir-client';
import {abtn, btnGhost, btnYt, cx, empty, natCls, segBtn, segWrap, sel} from '@/lib/ui';

type Status = Record<string, 'none' | 'error' | 'ok'>;

/** One tafseer at an ayah; one read from another site's page credits that page. */
function TafsirText({slug, meta, s, a}: {slug: string; meta?: TafsirEdition; s: number; a: number}) {
  if (!meta?.url) return <OwnText slug={slug} meta={meta} s={s} a={a} />;
  const url = meta.url.replace('{s}', String(s)).replace('{a}', String(a));
  return <>
    {isQoh(url) ? <QohTafsirs s={s} a={a} /> : <OwnText slug={slug} meta={meta} s={s} a={a} />}
    <p className="mt-1.5 text-[12px] text-muted">Source: <a href={url} target="_blank" rel="noopener">{meta.site} ↗</a></p>
  </>;
}
/** Loads one tafseer's text for an ayah and shows it (or a "no note" message). */
function OwnText({slug, meta, language, s, a}: {slug: string; meta?: TafsirEdition; language?: string; s: number; a: number}) {
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  const lang = (language || meta?.language_name || '').toLowerCase();
  useEffect(() => {
    let live = true; setHtml(null); setErr('');
    getTafsir(slug, s, a).then(t => { if (live) setHtml(t.trim() ? tafsirHtml(t, lang) : ''); }).catch(e => { if (live) setErr(e.message); });
    return () => { live = false; };
  }, [slug, s, a, lang, tick]);
  if (err) return <div className={empty}>Could not load this tafseer. {err} <button className={abtn} onClick={() => setTick(t => t + 1)}>Try again</button></div>;
  if (html === null) return <div className="grid place-items-center py-8 text-muted"><div className="spin mb-2" />Loading tafseer…</div>;
  if (!html) return <div className={empty}>No note for ayah {s}:{a} in this tafseer. Some works only comment on selected ayahs.</div>;
  const cls = lang.startsWith('urdu') ? 'urdu rtl' : lang.startsWith('arabic') ? 'arabic rtl' : '';
  return <div className={cx('tafsir', cls)} dangerouslySetInnerHTML={{__html: html}} />;
}

/** Tafseer languages for the Study panel's language bar: [code, label, editions' language_name]. */
export const TLANGS = [['ur', 'Urdu', 'urdu'], ['en', 'English', 'english'], ['ar', 'Arabic', 'arabic']] as const;
export type TLang = (typeof TLANGS)[number][0];
const langName = (l: TLang) => TLANGS.find(x => x[0] === l)![2];
const langText = (l: TLang) => TLANGS.find(x => x[0] === l)![1];

/**
 * Every approved tafseer in one language: the reader's own picks (Settings) first, then the rest in the curator's order.
 * Only the picks are checked in the background for a note on s:a; the others load when opened.
 */
function useTafsirList(s: number, a: number, lang: TLang) {
  const {settings, update} = useApp();
  const [eds, setEds] = useState<TafsirEdition[] | null>(null);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState<Status>({});
  useEffect(() => { getEditions().then(d => setEds(d.tafsir)).catch(e => setErr(e.message)); }, []);
  // saved picks that are no longer offered move to their twin edition if there is one, else are dropped
  useEffect(() => {
    if (!eds) return;
    const valid = new Set(eds.map(e => e.slug));
    const kept = [...new Set(settings.tafsirs.map(x => valid.has(x) ? x : tafsirTwin(x) ?? '').filter(x => valid.has(x)))];
    if (kept.join() !== settings.tafsirs.join() || !kept.length) update({tafsirs: kept.length ? kept : [eds[0].slug]});
  }, [eds, settings.tafsirs, update]);
  const langEds = useMemo(() => (eds || []).filter(e => e.language_name.toLowerCase() === langName(lang)), [eds, lang]);
  const picks = useMemo(() => settings.tafsirs.filter(x => langEds.some(e => e.slug === x)), [settings.tafsirs, langEds]);
  const list = useMemo(() => [...picks, ...langEds.map(e => e.slug).filter(x => !picks.includes(x))], [picks, langEds]);
  const key = picks.join(',');
  const meta = (slug: string) => eds?.find(e => e.slug === slug);
  // check in the background which picks have a note for this ayah (also warms the cache)
  useEffect(() => {
    let live = true; setStatus({});
    key.split(',').filter(Boolean).forEach(slug => (isQoh(meta(slug)?.url || '') ? getQoh(s, a).then(v => v.length ? 'x' : '') : getTafsir(slug, s, a))
      .then(t => { if (live) setStatus(st => ({...st, [slug]: t.trim() ? 'ok' : 'none'})); })
      .catch(() => { if (live) setStatus(st => ({...st, [slug]: 'error'})); }));
    return () => { live = false; };
  }, [key, s, a]); // eslint-disable-line react-hooks/exhaustive-deps

  return {eds, err, list, picks, status, meta};
}
/** Author (in its own script and font). */
const by = (m?: TafsirEdition) => m?.author_name ? <bdi className={natCls(m.author_name, m.language_name)}>{m.author_name}</bdi> : null;
const noteText = (st?: Status[string]) => st === 'none' ? 'No note for this ayah' : st === 'error' ? 'Unavailable' : '';

/** Ayah stepping supplied by the Tafseer page; `compact` is the phone version, beside the toolbar. */
type Nav = (compact: boolean) => ReactNode;

/* Kept while stepping between ayahs: the second tafseer of the compare view ('' = compare is off). */
let cmpKept = '';

/** A tafseer picker for the compare view: the reader's list first, then the rest. */
function TafsirSelect({value, list, picks, meta, onPick, label}: {value: string; list: string[]; picks: string[]; meta: (s: string) => TafsirEdition | undefined; onPick: (s: string) => void; label: string}) {
  const opt = (x: string) => <option key={x} value={x}>{meta(x)?.name || x}{meta(x)?.author_name ? ` · ${meta(x)!.author_name}` : ''}</option>;
  return (
    <select className={cx(sel, 'w-full')} aria-label={label} value={value} onChange={e => onPick(e.target.value)} dir="auto">
      {picks.length > 0 && <optgroup label="Your list">{picks.map(opt)}</optgroup>}
      <optgroup label={picks.length ? 'Other tafseers' : 'Tafseers'}>{list.filter(x => !picks.includes(x)).map(opt)}</optgroup>
    </select>
  );
}

/**
 * The tafseers of one language as a reader: the reader's own list as chips across the top, the chosen tafseer below
 * like a book page with the previous / next tafseer at its foot. "+ more" opens every other tafseer with a filter;
 * Compare puts a second tafseer beside the first (stacked when the panel is narrow).
 */
function Reader({s, a, lang, nav}: {s: number; a: number; lang: TLang; nav?: Nav}) {
  const {settings, update, openSettings} = useApp();
  const {eds, err, list, picks, status, meta} = useTafsirList(s, a, lang);
  const [all, setAll] = useState(false);
  const [q, setQ] = useState('');
  const [cmp, setCmpState] = useState(cmpKept);
  const setCmp = (x: string) => { cmpKept = x; setCmpState(x); };
  const cur = list.includes(settings.tafLast) ? settings.tafLast : list[0];
  const show = (x: string) => { update({tafLast: x}); setAll(false); setQ(''); };
  // keep the chosen chip in view in the sideways-scrolling row
  useEffect(() => { document.querySelector(`.tchip[data-slug="${CSS.escape(cur || '')}"]`)?.scrollIntoView({block: 'nearest', inline: 'nearest'}); }, [cur]);
  if (err) return <div className={empty}>Could not load the tafseer list. {err}</div>;
  if (!eds) return <div className="grid place-items-center py-10"><div className="spin" /></div>;
  if (!cur) return <div className={empty}>No {langText(lang)} tafseers are available yet.</div>;
  const m = meta(cur), i = list.indexOf(cur), prev = list[i - 1], next = list[i + 1];
  // a tafseer opened from the full list sits after the reader's own chips until another is chosen
  const chips = picks.includes(cur) ? picks : [...picks, cur];
  const second = cmp && list.includes(cmp) && cmp !== cur ? cmp : list.find(x => x !== cur) || '';
  const rtl = lang !== 'en';
  const qq = q.trim().toLowerCase();
  const others = list.filter(x => !picks.includes(x) && (!qq || `${meta(x)?.name} ${meta(x)?.author_name ?? ''} ${x}`.toLowerCase().includes(qq)));
  const where = picks.includes(cur) ? `${picks.indexOf(cur) + 1} of ${picks.length} in your list` : `Other ${langText(lang)} tafseer`;
  const stepBtn = (x: string | undefined, dir: -1 | 1) => x
    ? <button className={cx(btnGhost, 'max-w-[48%] !px-3 !py-1.5')} data-t={dir < 0 ? 'prev' : 'next'} onClick={() => { show(x); document.querySelector('.tread')?.scrollIntoView({block: 'nearest'}); }}>
        {dir < 0 && '← '}<span className={cx('truncate', natCls(meta(x)?.name, meta(x)?.language_name))}>{meta(x)?.name || x}</span>{dir > 0 && ' →'}</button>
    : <span />;
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1 text-[13px] text-muted">
        <span>{list.length} {langText(lang)} tafseer{list.length > 1 ? 's' : ''}{picks.length ? ` · ${picks.length} in your list` : ''} · ayah {s}:{a}</span><span className="flex-1" />
        <button className={cx(abtn, cmp && '!bg-brand-soft !text-brand')} data-t="compare" aria-pressed={!!cmp} onClick={() => setCmp(cmp ? '' : second)}><Icon.book />{cmp ? 'Exit compare' : 'Compare'}</button>
        <button className={abtn} data-t="edit" onClick={() => openSettings('tafsir')}>Edit my list</button>
        {nav && <span className="flex gap-1 sm:hidden">{nav(true)}</span>}
      </div>
      {!cmp && <>
        <div role="tablist" aria-label="Your tafseers" dir={rtl ? 'rtl' : 'ltr'} className="mb-3 flex gap-2 overflow-x-auto border-b border-line pb-2.5 [scrollbar-width:thin]">
          {chips.map(x => {
            const mm = meta(x), on = x === cur, st = status[x];
            return <button key={x} role="tab" data-slug={x} aria-selected={on} title={[mm?.author_name, noteText(st)].filter(Boolean).join(' · ')} onClick={() => show(x)}
              className={cx('tchip flex-none whitespace-nowrap rounded-full border px-4 py-1', on ? 'border-brand bg-brand text-on-brand' : 'border-line bg-surface text-ink hover:border-brand', !on && st === 'none' && 'opacity-55')}>
              <span className={cx('text-[16px]', natCls(mm?.name, mm?.language_name))}>{mm?.name || x}</span></button>;
          })}
          {list.length > picks.length && <button data-t="all" dir="ltr" aria-expanded={all} onClick={() => setAll(!all)}
            className={cx('flex-none whitespace-nowrap rounded-full border border-dashed px-4 py-1 text-sm', all ? 'border-brand text-brand' : 'border-line text-muted hover:border-brand hover:text-brand')}>
            {all ? 'Close list' : `+ ${list.length - picks.length} more`}</button>}
        </div>
        {all && <div className="mb-3 rounded-xl border border-line bg-surface2 p-2.5" data-t="sheet">
          <input className={cx(sel, 'mb-2 w-full')} type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by name or scholar…" aria-label="Filter tafseers" autoFocus />
          <div className="grid max-h-[45vh] gap-1.5 overflow-y-auto sm:grid-cols-2" dir={rtl ? 'rtl' : 'ltr'}>
            {others.map(x => { const mm = meta(x); return (
              <button key={x} data-slug={x} onClick={() => show(x)} className={cx('flex flex-col items-start rounded-lg border px-3 py-1.5 text-start', x === cur ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-brand')}>
                <span className={cx('text-[16px]', natCls(mm?.name, mm?.language_name))}>{mm?.name || x}</span>
                <small className="text-[12.5px] text-muted">{by(mm)}</small></button>); })}
            {!others.length && <div className="p-2 text-sm text-muted">Nothing matches “{q}”.</div>}
          </div>
        </div>}
        <article className="tread scroll-mt-20 rounded-2xl border border-line bg-surface px-4 py-3.5" role="tabpanel" aria-label={m?.name}>
          <header className="mb-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line pb-2.5" dir={rtl ? 'rtl' : 'ltr'}>
            <div className="min-w-0"><h3 className={cx('m-0 text-[22px] font-bold text-brand', natCls(m?.name, m?.language_name))}>{m?.name || cur}</h3>
              <div className="text-[14.5px] text-muted">{by(m)}</div></div>
            <span className="flex-1" />
            <span className="whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-0.5 text-[12px] text-brand" dir="ltr">{where}</span>
          </header>
          <TafsirText key={cur + s + ':' + a} slug={cur} meta={m} s={s} a={a} />
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">{stepBtn(prev, -1)}{stepBtn(next, 1)}</div>
        </article>
      </>}
      {cmp && <div className="@container">
        {/* side by side in reading order: the first tafseer on the right for Urdu and Arabic */}
        <div className="grid gap-3 @[680px]:grid-cols-2" dir={rtl ? 'rtl' : 'ltr'}>
          {([[cur, show, 'First tafseer'], [second, setCmp, 'Second tafseer']] as const).map(([x, pick, label], k) => (
            <article key={k} data-cmp={k} className="min-w-0 rounded-2xl border border-line bg-surface px-3.5 py-3">
              <div className="mb-2 flex items-center gap-1.5">
                <TafsirSelect value={x} list={list} picks={picks} meta={meta} onPick={pick} label={label} />
                {k === 0 && <button className={abtn} title="Swap the two" aria-label="Swap the two tafseers" data-t="swap" onClick={() => { const c = cur; show(second); setCmp(c); }}><Icon.repeat /></button>}
              </div>
              {x ? <TafsirText key={x + s + ':' + a} slug={x} meta={meta(x)} s={s} a={a} /> : <div className={empty}>Only one {langText(lang)} tafseer is available.</div>}
            </article>))}
        </div>
      </div>}
    </div>
  );
}

/** The reader's lecture series for this ayah: exact videos the curator added (opening at the right moment), else a search for the surah. */
export function VideoCards({videos, sname}: {videos: VideoCard[] | null; sname: string}) {
  if (!videos) return <div className="grid place-items-center py-10"><div className="spin" /></div>;
  if (!videos.length) return <div className={empty}>No video lectures have been added yet.</div>;
  return (
    <div>
      <div className="grid gap-2.5">
        {videos.map(v => (
          <div key={v.id} className="vcard rounded-2xl border border-line bg-surface px-3.5 py-3 shadow-card">
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5">
              <div className="flex min-w-0 flex-[1_1_230px] items-center gap-3">
                <div className={cx('grid size-[46px] flex-none place-items-center rounded-full bg-yt font-bold text-white', v.initials.length > 2 ? 'text-[13px]' : 'text-base')}>{v.initials}</div>
                <div className="min-w-0"><b className="block text-[15.5px] leading-snug">{v.name}</b><small className="block text-[13px] leading-snug text-muted">{v.desc}</small>
                  <span className="mt-1.5 inline-block whitespace-nowrap rounded-full bg-surface2 px-2 py-0.5 text-[11.5px] text-muted">{v.lang} · Surah {sname}</span></div>
              </div>
              {!v.links.length && v.searchUrl && <a className={cx(btnYt, 'flex-none whitespace-nowrap max-[560px]:flex-[1_1_100%]')} href={v.searchUrl} target="_blank" rel="noopener" title={`Surah ${sname} lectures on YouTube`}><Icon.play /> Watch on YouTube</a>}
            </div>
            {v.links.length > 0 && <div className="mt-2.5 grid gap-1.5">
              {v.links.map((l, i) => (
                <a key={i} className="flex items-center gap-2.5 rounded-xl border border-line bg-bg px-3 py-2 text-ink no-underline hover:border-yt" href={l.url} target="_blank" rel="noopener">
                  <span className="grid size-7 flex-none place-items-center rounded-full bg-yt text-white [&_svg]:size-3.5"><Icon.play /></span>
                  <span className="min-w-0 flex-1"><b className="block truncate text-sm">{l.title}</b><small className="text-xs text-muted">{l.range}{l.start && ` · from ${l.start}`}</small></span>
                </a>))}
              {v.searchUrl && <a className="text-[12.5px] text-muted" href={v.searchUrl} target="_blank" rel="noopener">More lectures on this surah ↗</a>}
            </div>}
          </div>
        ))}
      </div>
      {videos.some(v => !v.links.length) && <p className="mt-2.5 text-[12.5px] text-muted">“Watch on YouTube” opens a search for lectures on the whole surah, in a new tab.</p>}
    </div>
  );
}

/* QuranoHadith's open work stays open while the reader steps between ayahs. */
let qohOpen: string | null = null;

/** QuranoHadith's page holds several tafseers for the ayah: one collapsible section each, like the Tafseer tab. */
function QohTafsirs({s, a}: {s: number; a: number}) {
  const [items, setItems] = useState<QohTafsir[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpenState] = useState(qohOpen);
  const setOpen = (n: string) => { qohOpen = n; setOpenState(n); };
  useEffect(() => {
    let live = true; setItems(null); setErr('');
    getQoh(s, a).then(v => { if (live) setItems(v); }, e => { if (live) setErr(e.message); });
    return () => { live = false; };
  }, [s, a]);
  if (err) return <div className={empty}>Could not load these tafseers. {err}</div>;
  if (!items) return <div className="grid place-items-center py-8 text-muted"><div className="spin mb-2" />Loading tafseers…</div>;
  if (!items.length) return <div className={empty}>No notes for ayah {s}:{a} here.</div>;
  // the first work opens until the reader picks one (or when the picked one has no note for this ayah)
  const cur = open !== null && (open === '' || items.some(x => x.name === open)) ? open : items[0].name;
  return (
    <div>
      {items.map(x => {
        const isOpen = x.name === cur;
        return (
          <section key={x.name} className={cx('acc mb-2 overflow-hidden rounded-xl border bg-surface', isOpen ? 'border-[color-mix(in_srgb,var(--brand)_45%,var(--line))]' : 'border-line')}>
            <button className={cx('flex w-full items-center gap-2.5 border-0 px-3.5 py-3 text-left', isOpen ? 'bg-brand-soft' : 'bg-transparent hover:bg-surface2')} aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : x.name)}>
              <span className="min-w-0 flex-1"><b className={cx('block text-[19px]', natCls(x.name, 'urdu'))}>{x.name}</b><small className={cx('text-[14.5px] text-muted', natCls(x.author, 'urdu'))}>{x.author}</small></span>
              <Icon.chev className={cx('flex-none transition-transform', isOpen ? 'rotate-180 text-brand' : 'text-muted')} />
            </button>
            {isOpen && <div className="border-t border-line px-4 py-3.5"><div className="tafsir urdu rtl" dangerouslySetInnerHTML={{__html: tafsirHtml(x.text, 'urdu')}} /></div>}
          </section>);
      })}
    </div>
  );
}

/** Ayahs that share wording with this one, closest first, with the shared words marked. Loaded when the tab opens. */
function RelatedAyahs({s, a, count}: {s: number; a: number; count?: number}) {
  const {settings} = useApp();
  const [items, setItems] = useState<RelatedItem[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (count === 0) return;
    let live = true; setItems(null); setErr('');
    getRelated(s, a, settings.script === 'indopak').then(v => { if (live) setItems(v); }, e => { if (live) setErr(e.message); });
    return () => { live = false; };
  }, [s, a, count, settings.script]);
  if (count === 0) return <div className={empty}>No other ayah shares closely similar wording with {s}:{a}.</div>;
  if (err) return <div className={empty}>Related ayahs could not load. {err}</div>;
  if (!items) return <div className="grid place-items-center py-10"><div className="spin" /></div>;
  return (
    <div>
      <p className="mb-3 text-[13px] text-muted">{items.length} ayah{items.length === 1 ? '' : 's'} with similar wording to {s}:{a} · shared words are highlighted</p>
      <div className="grid gap-2.5">
        {items.map(r => (
          <article key={`${r.s}:${r.a}`} className="rounded-xl border border-line bg-surface px-3.5 py-3">
            <div className="mb-1 flex items-center gap-2 text-[13px]">
              <span className="min-w-0 flex-1"><b className="text-ink">{r.sname} {r.s}:{r.a}</b> <span className="whitespace-nowrap text-muted">· {r.words} shared word{r.words === 1 ? '' : 's'}</span></span>
              <span className="flex flex-none"><Link className={abtn} href={`/surah/${r.s}/${r.a}`}>Read</Link><Link className={abtn} href={`/tafseer/${r.s}/${r.a}`}>Tafseer</Link></span>
            </div>
            <div className={cx('q-ar related-ar', r.ip && 'is-ip')} dir="rtl">
              {r.toks.map((t, i) => <span key={i}>{i ? ' ' : ''}{t.hit ? <mark>{t.t}</mark> : t.t}</span>)}
            </div>
          </article>))}
      </div>
      <p className="mt-3 text-[12px] text-muted">Similar-wording data: Quranic Universal Library (Tarteel).</p>
    </div>
  );
}

/** Study panel for one ayah (drawer and tafseer page): tafseer text, video lectures, related ayahs. */
export default function TafseerPanel({s, a, tab, onTab, nav}: {s: number; a: number; tab?: StudyTab; onTab?: (t: StudyTab) => void; nav?: Nav}) {
  const {settings, update, surahs, tafTab: ctxTab, setTafTab} = useApp();
  const tafTab = tab ?? ctxTab;
  const sname = surahs[s - 1]?.en || '';
  const tabBtn = (on: boolean) => cx('-mb-px inline-flex flex-none items-center gap-1.5 whitespace-nowrap border-0 border-b-[3px] bg-transparent px-1.5 py-2 text-[13.5px] font-semibold sm:px-3 sm:text-[14.5px] [&_svg]:size-[17px]', on ? 'border-brand text-brand' : 'border-transparent text-muted');
  const count = (n?: number) => n != null && <span className="rounded-full bg-brand-soft px-[7px] py-px text-[11.5px] text-brand">{n}</span>;
  const pick = (t: StudyTab) => { setTafTab(t); onTab?.(t); };
  const [study, setStudy] = useState<Study | null>(null);
  // tafseer language: the reader's last choice, else the language of their first chosen tafseer
  const [firstLang, setFirstLang] = useState<TLang>('ur');
  useEffect(() => { getEditions().then(d => { const n = d.tafsir.find(e => e.slug === settings.tafsirs[0])?.language_name.toLowerCase(); const l = TLANGS.find(x => x[2] === n); if (l) setFirstLang(l[0]); }, () => {}); }, [settings.tafsirs]);
  const lang: TLang = settings.tafLang || firstLang;
  useEffect(() => { let live = true; setStudy(null); getStudy(s, a).then(d => { if (live) setStudy(d); }, () => { if (live) setStudy({videos: [], related: 0}); }); return () => { live = false; }; }, [s, a]);
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <div className={cx(segWrap, 'w-full sm:w-auto sm:max-w-xs')} role="group" aria-label="Tafseer language">
          {TLANGS.map(([code, label]) => <button key={code} data-lang={code} aria-pressed={lang === code} className={segBtn(lang === code)} onClick={() => update({tafLang: code})}>{label}</button>)}
        </div>
        {/* ayah stepping sits by the tafseers: here on wider screens, beside the layout switch on phones */}
        {nav && <div className="ml-auto flex gap-2 max-sm:hidden">{nav(false)}</div>}
      </div>
      <div className="mb-3 flex overflow-x-auto border-b border-line [scrollbar-width:none] sm:gap-1">
        <button data-tab="text" className={tabBtn(tafTab === 'text')} onClick={() => pick('text')}><Icon.book className="max-sm:hidden" /> Tafseer</button>
        <button data-tab="videos" className={tabBtn(tafTab === 'videos')} onClick={() => pick('videos')}><Icon.yt className="max-sm:hidden" /> <span className="max-sm:hidden">Video lectures</span><span className="sm:hidden">Videos</span> {count(study?.videos.length)}</button>
        <button data-tab="related" className={tabBtn(tafTab === 'related')} onClick={() => pick('related')}><Icon.repeat className="max-sm:hidden" /> Related {count(study?.related)}</button>
      </div>
      {nav && tafTab !== 'text' && <div className="mb-2 flex justify-end gap-1 sm:hidden">{nav(true)}</div>}
      {tafTab === 'videos' ? <VideoCards videos={study?.videos ?? null} sname={sname} />
        : tafTab === 'related' ? <RelatedAyahs s={s} a={a} count={study?.related} />
        : <Reader s={s} a={a} lang={lang} nav={nav} />}
    </div>
  );
}
