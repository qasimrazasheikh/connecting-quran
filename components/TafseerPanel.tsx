'use client';
import {Fragment, useEffect, useMemo, useRef, useState, type ReactNode} from 'react';
import {useApp} from './AppProvider';
import {Icon} from './Icons';
import Link from 'next/link';
import {getEditions, getQoh, getRelated, getStudy, getTafsir, type QohTafsir, type Study} from '@/lib/client-data';
import type {RelatedItem, StudyLink, VideoCard} from '@/lib/catalog';
import {tafsirTwin, type TafsirEdition} from '@/lib/meta';
import type {StudyTab} from '@/lib/step';
import {tafsirHtml} from '@/lib/tafsir-client';
import {abtn, btnYt, cx, empty, natCls, segBtn, segWrap, sel} from '@/lib/ui';

/* Kept while moving between ayahs: which section is open (at most one, so the page stays short). */
const accOpen = new Set<string>();
let accInit = false;

type Status = Record<string, 'none' | 'error' | 'ok'>;

/** Loads one tafseer's text for an ayah and shows it (or a "no note" message). */
function TafsirText({slug, meta, language, s, a}: {slug: string; meta?: TafsirEdition; language?: string; s: number; a: number}) {
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
  // check in the background which picks have a note for this ayah (also warms the cache)
  useEffect(() => {
    let live = true; setStatus({});
    key.split(',').filter(Boolean).forEach(slug => getTafsir(slug, s, a)
      .then(t => { if (live) setStatus(st => ({...st, [slug]: t.trim() ? 'ok' : 'none'})); })
      .catch(() => { if (live) setStatus(st => ({...st, [slug]: 'error'})); }));
    return () => { live = false; };
  }, [key, s, a]);
  const meta = (slug: string) => eds?.find(e => e.slug === slug);
  return {eds, err, list, picks, status, meta};
}
/** Author (in its own script and font). */
const sub = (m: TafsirEdition | undefined, _pick: boolean) => <>
  {m?.author_name && <bdi className={natCls(m.author_name)}>{m.author_name}</bdi>}</>;
/** Divider between the reader's picks and the other tafseers of the language. */
const Others = ({n, lang}: {n: number; lang: TLang}) => <div className="mb-2 mt-3.5 text-[12px] font-semibold uppercase tracking-wider text-muted">Other {langText(lang)} tafseers ({n})</div>;

/** Ayah stepping supplied by the Tafseer page; `compact` is the phone version, beside the layout switch. */
type Nav = (compact: boolean) => ReactNode;

function Accordion({s, a, lang, more, onMore, nav}: {s: number; a: number; lang: TLang; more: number; onMore: () => void; nav?: Nav}) {
  const {openSettings, update} = useApp();
  const {eds, err, list, picks, status, meta} = useTafsirList(s, a, lang);
  const [open, setOpen] = useState<Set<string>>(() => new Set(accOpen));
  // open the first tafseer the first time, and again when a language has none open
  useEffect(() => { if (list.length && (!accInit || !list.some(x => accOpen.has(x)))){ accInit = true; accOpen.clear(); accOpen.add(list[0]); setOpen(new Set(accOpen)); } }, [list]);
  // opening a tafseer closes the one that was open
  const setOne = (slug: string, on: boolean) => { accOpen.clear(); if (on) accOpen.add(slug); setOpen(new Set(accOpen)); };
  if (err) return <div className={empty}>Could not load the tafseer list. {err}</div>;
  if (!eds) return <div className="grid place-items-center py-10"><div className="spin" /></div>;
  if (!list.length) return <div className={empty}>No {langText(lang)} tafseers are available yet.</div>;
  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-1 text-[13px] text-muted">
        <span>{list.length} {langText(lang)} tafseer{list.length > 1 ? 's' : ''}{picks.length ? ` · ${picks.length} in your list` : ''} · ayah {s}:{a}</span><span className="flex-1" />
        {more > 0 && <button className={abtn} onClick={onMore} title="More tafseers on other sites"><Icon.link />More tafseers</button>}
        <button className={abtn} data-acc="collapse" onClick={() => { accOpen.clear(); setOpen(new Set()); }}>Collapse all</button>
        <button className={abtn} data-acc="edit" onClick={() => openSettings('tafsir')}>Edit my list</button>
        <button className={abtn} data-acc="layout" title="Switch to list + reader layout" onClick={() => update({tafLayout: 'split'})}><Icon.book />List view</button>
        {nav && <span className="flex gap-1 sm:hidden">{nav(true)}</span>}
      </div>
      {list.map((slug, i) => {
        const m = meta(slug), isOpen = open.has(slug), st = status[slug], pick = i < picks.length;
        return (
          <Fragment key={slug}>
            {i === picks.length && i > 0 && <Others n={list.length - picks.length} lang={lang} />}
            <section data-slug={slug} className={cx('acc mb-2 overflow-hidden rounded-xl border bg-surface', isOpen ? 'border-[color-mix(in_srgb,var(--brand)_45%,var(--line))]' : 'border-line')}>
              <button className={cx('flex w-full items-center gap-2.5 border-0 px-3.5 py-3 text-left', isOpen ? 'bg-brand-soft' : 'bg-transparent hover:bg-surface2')} aria-expanded={isOpen} onClick={() => setOne(slug, !isOpen)}>
                <span className="min-w-0 flex-1"><b className={cx('block text-[15px]', natCls(m?.name), st === 'none' && 'text-muted')}>{m?.name || slug}</b><small className="text-[12.5px] text-muted">{sub(m, pick)}</small></span>
                <span className="whitespace-nowrap text-xs text-muted">{st === 'none' ? 'No note for this ayah' : st === 'error' ? 'Unavailable' : ''}</span>
                <Icon.chev className={cx('flex-none transition-transform', isOpen ? 'rotate-180 text-brand' : 'text-muted')} />
              </button>
              {isOpen && <div className="border-t border-line px-4 py-3.5"><TafsirText slug={slug} meta={m} s={s} a={a} /></div>}
            </section>
          </Fragment>
        );
      })}
      {more > 0 && <button className="mb-2 mt-1 block w-full rounded-xl border border-dashed border-line bg-surface px-3.5 py-3 text-left text-ink hover:border-brand" onClick={onMore}>
        <b className="block text-[15px]">{more} more {langText(lang)} tafseers on other sites →</b>
        <small className="text-[12.5px] text-muted">Each opened at ayah {s}:{a}</small>
      </button>}
    </div>
  );
}

function Split({s, a, lang, more, onMore, nav}: {s: number; a: number; lang: TLang; more: number; onMore: () => void; nav?: Nav}) {
  const {settings, update, openSettings} = useApp();
  const {eds, err, list, picks, status, meta} = useTafsirList(s, a, lang);
  const cur = list.includes(settings.tafLast) ? settings.tafLast : list[0];
  const readerRef = useRef<HTMLElement>(null);
  useEffect(() => { document.querySelector(`.titem[data-slug="${CSS.escape(cur || '')}"]`)?.scrollIntoView({block: 'nearest', inline: 'nearest'}); }, [cur]);
  if (err) return <div className={empty}>Could not load the tafseer list. {err}</div>;
  if (!eds) return <div className="grid place-items-center py-10"><div className="spin" /></div>;
  if (!cur) return <div className={empty}>No {langText(lang)} tafseers are available yet.</div>;
  const m = meta(cur);
  const item = 'titem flex flex-none flex-col items-start rounded-[10px] border px-3 py-2 text-left text-ink no-underline max-w-[220px] @[620px]:w-full @[620px]:max-w-none';
  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-1 text-[13px] text-muted">
        <span>{list.length} {langText(lang)} tafseer{list.length > 1 ? 's' : ''}{picks.length ? ` · ${picks.length} in your list` : ''} · ayah {s}:{a}</span><span className="flex-1" />
        {more > 0 && <button className={abtn} onClick={onMore} title="More tafseers on other sites"><Icon.link />More tafseers</button>}
        <button className={abtn} data-ts="edit" onClick={() => openSettings('tafsir')}>Edit my list</button>
        <button className={abtn} data-ts="layout" title="Switch to accordion layout" onClick={() => update({tafLayout: 'accordion'})}><Icon.chev />Accordion view</button>
        {nav && <span className="flex gap-1 sm:hidden">{nav(true)}</span>}
      </div>
      <div className="@container">
        <div className="flex flex-col gap-2.5 @[620px]:flex-row @[620px]:items-start">
          <nav role="tablist" aria-label="Tafseers" className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin] @[620px]:sticky @[620px]:top-[76px] @[620px]:max-h-[calc(100vh-120px)] @[620px]:w-[230px] @[620px]:flex-none @[620px]:flex-col @[620px]:overflow-y-auto">
            {list.map((slug, i) => {
              const mm = meta(slug), on = slug === cur, st = status[slug], pick = i < picks.length;
              return (
                <Fragment key={slug}>
                  {i === picks.length && i > 0 && <span className="hidden px-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted @[620px]:block">Other {langText(lang)}</span>}
                  <button role="tab" data-slug={slug} aria-selected={on} title={(mm?.name || slug) + (mm?.author_name ? ' — ' + mm.author_name : '')} onClick={() => update({tafLast: slug})}
                    className={cx(item, on ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-brand')}>
                    <b title={mm?.name || slug} className={cx('max-w-full text-xs leading-snug break-words @[620px]:whitespace-normal', natCls(mm?.name), on ? 'text-brand' : st === 'none' ? 'text-muted' : '')}>{mm?.name || slug}</b>
                    <small title={mm?.author_name || ''} className="max-w-full text-[11px] text-muted break-words @[620px]:whitespace-normal">{sub(mm, pick)}</small>
                    {(st === 'none' || st === 'error') && <span className="text-[11px] text-muted">{st === 'none' ? 'No note' : 'Unavailable'}</span>}
                  </button>
                </Fragment>
              );
            })}
            {more > 0 && <button className={cx(item, 'border-dashed border-line bg-surface hover:border-brand')} onClick={onMore}><b className="text-sm">{more} more →</b><small className="text-xs text-muted">on other sites</small></button>}
          </nav>
          {/* no heading: the highlighted item in the list already names the tafseer and its author */}
          <section ref={readerRef} role="tabpanel" aria-label={m?.name} className="min-w-0 rounded-xl border border-line bg-surface @[620px]:flex-1">
            <div className="px-4 py-3.5"><TafsirText key={cur + s + ':' + a} slug={cur} meta={m} s={s} a={a} /></div>
          </section>
        </div>
      </div>
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

/** Sites whose text our server pulls from their ayah page (no API), shown here like our own tafseers; others open in a new tab. */
const isEql = (url: string) => url.startsWith('https://equranlibrary.com/');
const isQoh = (url: string) => url.startsWith('https://quranohadith.com/');
const embeds = (url: string) => isEql(url) || isQoh(url);
/* The open tafseer (and, on QuranoHadith, the open work) stay open while the reader steps between ayahs. */
let moreOpen = '', qohOpen: string | null = null;

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
              <span className="min-w-0 flex-1"><b className={cx('block text-[15px]', natCls(x.name))}>{x.name}</b><small className={cx('text-[12.5px] text-muted', natCls(x.author))}>{x.author}</small></span>
              <Icon.chev className={cx('flex-none transition-transform', isOpen ? 'rotate-180 text-brand' : 'text-muted')} />
            </button>
            {isOpen && <div className="border-t border-line px-4 py-3.5"><div className="tafsir urdu rtl" dangerouslySetInnerHTML={{__html: tafsirHtml(x.text, 'urdu')}} /></div>}
          </section>);
      })}
    </div>
  );
}

/** A tafseer from another site at this ayah, with a bar back to the list and a credit to the site. */
function EmbeddedTafseer({link, s, a, onBack}: {link: StudyLink; s: number; a: number; onBack: () => void}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <button className={abtn} onClick={onBack}>← All tafseers</button>
        <b className={cx('min-w-0 flex-1 truncate text-[14.5px]', natCls(link.name))} dir="auto">{link.name}</b>
        <a className={cx(abtn, 'flex-none')} href={link.url} target="_blank" rel="noopener" title={`Open on ${link.site} in a new tab`}>Open in new tab ↗</a>
      </div>
      {isQoh(link.url) ? <QohTafsirs s={s} a={a} /> : <TafsirText slug={link.id} language={link.lang} s={s} a={a} />}
      <p className="mt-1.5 text-[12px] text-muted">Source: <a href={link.url} target="_blank" rel="noopener">{link.site}</a></p>
    </div>
  );
}

/** Tafseers in the chosen language that live on other sites, each opened at this ayah, with a filter for long lists. */
function MoreTafseers({links, lang, s, a}: {links: StudyLink[] | null; lang: TLang; s: number; a: number}) {
  const [q, setQ] = useState('');
  const [open, setOpenState] = useState(moreOpen);
  const setOpen = (id: string) => { moreOpen = id; setOpenState(id); };
  if (!links) return <div className="grid place-items-center py-10"><div className="spin" /></div>;
  if (!links.length) return <div className={empty}>No {langText(lang)} tafseers on other sites yet.</div>;
  const cur = links.find(l => l.id === open && embeds(l.url));
  if (cur) return <EmbeddedTafseer link={cur} s={s} a={a} onBack={() => setOpen('')} />;
  const qq = q.trim().toLowerCase();
  // the id (source slug) keeps English spellings like "tafheem" finding works named in Urdu
  const shown = links.filter(l => !qq || `${l.name} ${l.author} ${l.site} ${l.id}`.toLowerCase().includes(qq));
  return (
    <div className="@container">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px] text-muted">
        <span>{links.length} {langText(lang)} tafseer{links.length === 1 ? '' : 's'} on other sites · each opens at ayah {s}:{a}</span><span className="flex-1" />
        {links.length > 8 && <input className={cx(sel, 'w-full sm:w-56')} type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Filter by name or scholar…" aria-label="Filter tafseers" />}
      </div>
      {!shown.length && <div className={empty}>Nothing matches “{q}”.</div>}
      {/* two columns only when the panel itself is wide (full page), not in the narrow drawer */}
      <div className="grid gap-2 @[640px]:grid-cols-2">
        {shown.map(l => {
          const inner = <>
            <span className="min-w-0 flex-1"><b className={cx('block truncate text-[14.5px]', natCls(l.name))}>{l.name}</b><small className={cx('block truncate text-[12.5px] text-muted', natCls(l.author))}>{l.author}</small></span>
            <span className="flex-none text-[12px] text-muted">{l.site}{embeds(l.url) ? '' : ' ↗'}</span></>;
          const cls = 'flex min-w-0 items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-ink no-underline hover:border-brand';
          // a real link too, so ctrl/middle-click still opens a new tab
          return embeds(l.url)
            ? <a key={l.id} className={cls} href={l.url} data-embed onClick={e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.button) return; e.preventDefault(); setOpen(l.id); }}>{inner}</a>
            : <a key={l.id} className={cls} href={l.url} target="_blank" rel="noopener">{inner}</a>;
        })}
      </div>
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

/** Study panel for one ayah (drawer and tafseer page): tafseer text, more tafseers on other sites, video lectures. */
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
  const links = study ? study.links.filter(l => l.lang === langText(lang)) : null;
  useEffect(() => { let live = true; setStudy(null); getStudy(s, a).then(d => { if (live) setStudy(d); }, () => { if (live) setStudy({links: [], videos: [], related: 0}); }); return () => { live = false; }; }, [s, a]);
  // "More tafseers" is empty for some languages (Arabic): switching to one goes back to the Tafseer tab
  const noMore = tafTab === 'more' && links !== null && !links.length;
  useEffect(() => { if (noMore) pick('text'); }, [noMore]); // eslint-disable-line react-hooks/exhaustive-deps
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
        <button data-tab="more" className={tabBtn(tafTab === 'more')} onClick={() => pick('more')}><Icon.link className="max-sm:hidden" /> <span className="max-sm:hidden">More tafseers</span><span className="sm:hidden">More</span> {count(links?.length)}</button>
        <button data-tab="videos" className={tabBtn(tafTab === 'videos')} onClick={() => pick('videos')}><Icon.yt className="max-sm:hidden" /> <span className="max-sm:hidden">Video lectures</span><span className="sm:hidden">Videos</span> {count(study?.videos.length)}</button>
        <button data-tab="related" className={tabBtn(tafTab === 'related')} onClick={() => pick('related')}><Icon.repeat className="max-sm:hidden" /> Related {count(study?.related)}</button>
      </div>
      {nav && tafTab !== 'text' && <div className="mb-2 flex justify-end gap-1 sm:hidden">{nav(true)}</div>}
      {tafTab === 'videos' ? <VideoCards videos={study?.videos ?? null} sname={sname} />
        : tafTab === 'more' ? <MoreTafseers links={links} lang={lang} s={s} a={a} />
        : tafTab === 'related' ? <RelatedAyahs s={s} a={a} count={study?.related} />
        : settings.tafLayout === 'split' ? <Split s={s} a={a} lang={lang} more={links?.length ?? 0} onMore={() => pick('more')} nav={nav} /> : <Accordion s={s} a={a} lang={lang} more={links?.length ?? 0} onMore={() => pick('more')} nav={nav} />}
    </div>
  );
}
