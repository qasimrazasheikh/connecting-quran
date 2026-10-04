'use client';
import {useEffect, useMemo, useRef, useState} from 'react';
import {useApp} from './AppProvider';
import {Icon} from './Icons';
import {getEditions, getTafsir} from '@/lib/client-data';
import {langLabel, qohUrl, VIDEO_SOURCES, type TafsirEdition} from '@/lib/meta';
import {tafsirHtml} from '@/lib/tafsir-client';
import {abtn, btnYt, cx, empty, sel} from '@/lib/ui';

/* Kept while moving between ayahs: which sections are open, and tafseers added "for now" (not saved). */
const accOpen = new Set<string>();
let accExtra: string[] = [];
let accInit = false;
export const clearExtraTafsir = (slug: string) => { accExtra = accExtra.filter(x => x !== slug); };

type Status = Record<string, 'none' | 'error' | 'ok'>;

/** Loads one tafseer's text for an ayah and shows it (or a "no note" message). */
function TafsirText({slug, meta, s, a}: {slug: string; meta?: TafsirEdition; s: number; a: number}) {
  const [html, setHtml] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [tick, setTick] = useState(0);
  const lang = (meta?.language_name || '').toLowerCase();
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

function useTafsirList(s: number, a: number) {
  const {settings, update} = useApp();
  const [eds, setEds] = useState<TafsirEdition[] | null>(null);
  const [err, setErr] = useState('');
  const [status, setStatus] = useState<Status>({});
  const [extra, setExtra] = useState(accExtra);
  useEffect(() => { getEditions().then(d => setEds(d.tafsir)).catch(e => setErr(e.message)); }, []);
  const valid = useMemo(() => new Set((eds || []).map(e => e.slug)), [eds]);
  // drop saved tafseers that no longer exist
  useEffect(() => {
    if (!eds) return;
    const kept = settings.tafsirs.filter(x => valid.has(x));
    if (kept.length !== settings.tafsirs.length || !kept.length) update({tafsirs: kept.length ? kept : [eds[0].slug]});
  }, [eds, valid, settings.tafsirs, update]);
  const list = useMemo(() => [...settings.tafsirs, ...extra.filter(x => !settings.tafsirs.includes(x))].filter(x => valid.has(x)), [settings.tafsirs, extra, valid]);
  const key = list.join(',');
  // check in the background which tafseers have a note for this ayah (also warms the cache)
  useEffect(() => {
    let live = true; setStatus({});
    key.split(',').filter(Boolean).forEach(slug => getTafsir(slug, s, a)
      .then(t => { if (live) setStatus(st => ({...st, [slug]: t.trim() ? 'ok' : 'none'})); })
      .catch(() => { if (live) setStatus(st => ({...st, [slug]: 'error'})); }));
    return () => { live = false; };
  }, [key, s, a]);
  const meta = (slug: string) => eds?.find(e => e.slug === slug);
  const add = (slug: string) => { accExtra = [...accExtra, slug]; setExtra(accExtra); };
  return {eds, err, list, status, meta, add, extra};
}

function AddSelect({eds, exclude, onAdd, label, className}: {eds: TafsirEdition[]; exclude: string[]; onAdd: (slug: string) => void; label: string; className?: string}) {
  const order = ['urdu', 'english', 'arabic'];
  const groups: Record<string, TafsirEdition[]> = {};
  eds.filter(e => !exclude.includes(e.slug)).forEach(e => (groups[e.language_name.toLowerCase()] ||= []).push(e));
  return (
    <select className={cx(sel, className)} value="" aria-label={label} onChange={e => e.target.value && onAdd(e.target.value)}>
      <option value="">{label}</option>
      {Object.keys(groups).sort((x, y) => order.indexOf(x) - order.indexOf(y)).map(g => (
        <optgroup key={g} label={langLabel(g)}>{groups[g].map(e => <option key={e.slug} value={e.slug}>{e.name}{e.author_name ? ' — ' + e.author_name : ''}</option>)}</optgroup>
      ))}
    </select>
  );
}
const sub = (m: TafsirEdition | undefined, extra: boolean) => `${langLabel(m?.language_name)}${m?.author_name ? ' · ' + m.author_name : ''}${extra ? ' · added for now' : ''}`;

function Accordion({s, a}: {s: number; a: number}) {
  const {settings, openSettings, update} = useApp();
  const {eds, err, list, status, meta, add} = useTafsirList(s, a);
  const [open, setOpen] = useState<Set<string>>(() => new Set(accOpen));
  const added = useRef<string | null>(null);
  useEffect(() => { if (list.length && !accInit){ accInit = true; accOpen.add(list[0]); setOpen(new Set(accOpen)); } }, [list]);
  useEffect(() => { if (added.current){ document.querySelector(`[data-slug="${CSS.escape(added.current)}"]`)?.scrollIntoView({block: 'nearest', behavior: 'smooth'}); added.current = null; } });
  const setOne = (slug: string, on: boolean) => { if (on) accOpen.add(slug); else accOpen.delete(slug); setOpen(new Set(accOpen)); };
  if (err) return <div className={empty}>Could not load the tafseer list. {err}</div>;
  if (!eds) return <div className="grid place-items-center py-10"><div className="spin" /></div>;
  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-1 text-[13px] text-muted">
        <span>{list.length} tafseer{list.length > 1 ? 's' : ''} · ayah {s}:{a}</span><span className="flex-1" />
        <a className={abtn} href={qohUrl(s, a)} target="_blank" rel="noopener" title="More Urdu tafaseer on QuranoHadith"><Icon.link />QuranoHadith</a>
        <button className={abtn} data-acc="expand" onClick={() => { list.forEach(x => accOpen.add(x)); setOpen(new Set(accOpen)); }}>Expand all</button>
        <button className={abtn} data-acc="collapse" onClick={() => { accOpen.clear(); setOpen(new Set()); }}>Collapse all</button>
        <button className={abtn} data-acc="edit" onClick={() => openSettings('tafsir')}>Edit list</button>
        <button className={abtn} data-acc="layout" title="Switch to list + reader layout" onClick={() => update({tafLayout: 'split'})}><Icon.book />List view</button>
      </div>
      {list.map(slug => {
        const m = meta(slug), isOpen = open.has(slug), st = status[slug];
        return (
          <section key={slug} data-slug={slug} className={cx('acc mb-2 overflow-hidden rounded-xl border bg-surface', isOpen ? 'border-[color-mix(in_srgb,var(--brand)_45%,var(--line))]' : 'border-line')}>
            <button className={cx('flex w-full items-center gap-2.5 border-0 px-3.5 py-3 text-left', isOpen ? 'bg-brand-soft' : 'bg-transparent hover:bg-surface2')} aria-expanded={isOpen} onClick={() => setOne(slug, !isOpen)}>
              <span className="min-w-0 flex-1"><b className={cx('block text-[15px]', st === 'none' && 'text-muted')}>{m?.name || slug}</b><small className="text-[12.5px] text-muted">{sub(m, !settings.tafsirs.includes(slug))}</small></span>
              <span className="whitespace-nowrap text-xs text-muted">{st === 'none' ? 'No note for this ayah' : st === 'error' ? 'Unavailable' : ''}</span>
              <Icon.chev className={cx('flex-none transition-transform', isOpen ? 'rotate-180 text-brand' : 'text-muted')} />
            </button>
            {isOpen && <div className="border-t border-line px-4 py-3.5"><TafsirText slug={slug} meta={m} s={s} a={a} /></div>}
          </section>
        );
      })}
      <a className="mb-2 block rounded-xl border border-dashed border-line bg-surface px-3.5 py-3 text-ink no-underline hover:border-brand" href={qohUrl(s, a)} target="_blank" rel="noopener">
        <b className="block text-[15px]">More Urdu tafaseer on QuranoHadith ↗</b>
        <small className="text-[12.5px] text-muted">Tafheem-ul-Quran, Maariful Quran, Taiseer-ul-Quran, Ahsan-ul-Bayan and more · opens ayah {s}:{a} on quranohadith.com</small>
      </a>
      <div className="mt-2.5"><AddSelect eds={eds} exclude={list} label="+ Open another tafseer…" className="w-full" onAdd={v => { accOpen.add(v); setOpen(new Set(accOpen)); added.current = v; add(v); }} /></div>
    </div>
  );
}

function Split({s, a}: {s: number; a: number}) {
  const {settings, update, openSettings} = useApp();
  const {eds, err, list, status, meta, add} = useTafsirList(s, a);
  const cur = list.includes(settings.tafLast) ? settings.tafLast : list[0];
  const readerRef = useRef<HTMLElement>(null);
  useEffect(() => { document.querySelector(`.titem[data-slug="${CSS.escape(cur || '')}"]`)?.scrollIntoView({block: 'nearest', inline: 'nearest'}); }, [cur]);
  if (err) return <div className={empty}>Could not load the tafseer list. {err}</div>;
  if (!eds || !cur) return <div className="grid place-items-center py-10"><div className="spin" /></div>;
  const m = meta(cur);
  const item = 'titem flex flex-none flex-col items-start rounded-[10px] border px-3 py-2 text-left text-ink no-underline max-w-[220px] @[620px]:w-full @[620px]:max-w-none';
  return (
    <div>
      <div className="mb-2.5 flex flex-wrap items-center gap-1 text-[13px] text-muted">
        <span>{list.length} tafseer{list.length > 1 ? 's' : ''} · ayah {s}:{a}</span><span className="flex-1" />
        <a className={abtn} href={qohUrl(s, a)} target="_blank" rel="noopener" title="More Urdu tafaseer on QuranoHadith"><Icon.link />QuranoHadith</a>
        <button className={abtn} data-ts="edit" onClick={() => openSettings('tafsir')}>Edit list</button>
        <button className={abtn} data-ts="layout" title="Switch to accordion layout" onClick={() => update({tafLayout: 'accordion'})}><Icon.chev />Accordion view</button>
      </div>
      <div className="@container">
        <div className="flex flex-col gap-2.5 @[620px]:flex-row @[620px]:items-start">
          <nav role="tablist" aria-label="Tafseers" className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin] @[620px]:sticky @[620px]:top-[76px] @[620px]:w-[230px] @[620px]:flex-none @[620px]:flex-col @[620px]:overflow-visible">
            {list.map(slug => {
              const mm = meta(slug), on = slug === cur, st = status[slug];
              return (
                <button key={slug} role="tab" data-slug={slug} aria-selected={on} onClick={() => update({tafLast: slug})}
                  className={cx(item, on ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:border-brand')}>
                  <b className={cx('max-w-full truncate text-sm leading-tight @[620px]:whitespace-normal', on ? 'text-brand' : st === 'none' ? 'text-muted' : '')}>{mm?.name || slug}</b>
                  <small className="max-w-full truncate text-xs text-muted @[620px]:whitespace-normal">{sub(mm, !settings.tafsirs.includes(slug))}</small>
                  {(st === 'none' || st === 'error') && <span className="text-[11px] text-muted">{st === 'none' ? 'No note' : 'Unavailable'}</span>}
                </button>
              );
            })}
            <AddSelect eds={eds} exclude={list} label="+ Another tafseer…" className="max-w-[200px] flex-none @[620px]:w-full @[620px]:max-w-none" onAdd={v => { add(v); update({tafLast: v}); }} />
            <a className={cx(item, 'border-dashed border-line bg-surface hover:border-brand')} href={qohUrl(s, a)} target="_blank" rel="noopener"><b className="text-sm">More Urdu tafaseer ↗</b><small className="text-xs text-muted">QuranoHadith</small></a>
          </nav>
          <section ref={readerRef} role="tabpanel" className="min-w-0 rounded-xl border border-line bg-surface @[620px]:flex-1">
            <div className="rounded-t-xl border-b border-line bg-brand-soft px-3.5 py-2.5"><b className="block text-brand">{m?.name}</b><small className="text-[12.5px] text-muted">{sub(m, false)}</small></div>
            <div className="px-4 py-3.5"><TafsirText key={cur + s + ':' + a} slug={cur} meta={m} s={s} a={a} /></div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function VideoCards({sname}: {sname: string}) {
  return (
    <div>
      <div className="grid gap-2.5">
        {VIDEO_SOURCES.map(v => (
          <div key={v.id} className="vcard flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-2xl border border-line bg-surface px-3.5 py-3 shadow-card">
            <div className="flex min-w-0 flex-[1_1_230px] items-center gap-3">
              <div className={cx('grid size-[46px] flex-none place-items-center rounded-full bg-yt font-bold text-white', v.initials.length > 2 ? 'text-[13px]' : 'text-base')}>{v.initials}</div>
              <div className="min-w-0"><b className="block text-[15.5px] leading-snug">{v.name}</b><small className="block text-[13px] leading-snug text-muted">{v.desc}</small>
                <span className="mt-1.5 inline-block whitespace-nowrap rounded-full bg-surface2 px-2 py-0.5 text-[11.5px] text-muted">{v.lang} · Surah {sname}</span></div>
            </div>
            <a className={cx(btnYt, 'flex-none whitespace-nowrap max-[560px]:flex-[1_1_100%]')} href={v.url(sname)} target="_blank" rel="noopener" title={`Surah ${sname} lectures on YouTube`}><Icon.play /> Watch on YouTube</a>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[12.5px] text-muted">Opens a YouTube search for lectures on the whole surah, in a new tab.</p>
    </div>
  );
}

/** Tafseer panel used in the drawer and on the tafseer page: two tabs (written tafseer, video lectures). */
export default function TafseerPanel({s, a, tab, onTab}: {s: number; a: number; tab?: 'text' | 'videos'; onTab?: (t: 'text' | 'videos') => void}) {
  const {settings, surahs, tafTab: ctxTab, setTafTab} = useApp();
  const tafTab = tab ?? ctxTab;
  const sname = surahs[s - 1]?.en || '';
  const tabBtn = (on: boolean) => cx('-mb-px inline-flex items-center gap-1.5 border-0 border-b-[3px] bg-transparent px-3.5 py-2 text-[14.5px] font-semibold [&_svg]:size-[17px]', on ? 'border-brand text-brand' : 'border-transparent text-muted');
  const pick = (t: 'text' | 'videos') => { setTafTab(t); onTab?.(t); };
  return (
    <div>
      <div className="mb-3 flex gap-1.5 border-b border-line">
        <button data-tab="text" className={tabBtn(tafTab === 'text')} onClick={() => pick('text')}><Icon.book /> Tafseer</button>
        <button data-tab="videos" className={tabBtn(tafTab === 'videos')} onClick={() => pick('videos')}><Icon.yt /> Video lectures <span className="rounded-full bg-brand-soft px-[7px] py-px text-[11.5px] text-brand">{VIDEO_SOURCES.length}</span></button>
      </div>
      {tafTab === 'videos' ? <VideoCards sname={sname} /> : settings.tafLayout === 'split' ? <Split s={s} a={a} /> : <Accordion s={s} a={a} />}
    </div>
  );
}
