'use client';
/** Admin forms that need to show the server's validation message. */
import {startTransition, useActionState, useState} from 'react';
import type {Entry, Source} from '@/lib/db/schema';
import {DELIVERY, KINDS, LANGS, SCHOOLS, STATUS} from '@/lib/db/enums';
import {btn, cx, field as input, sel} from '@/lib/ui';
import {login, saveEntry, saveSource, type FormState} from './actions';

const label = 'grid gap-1 text-[13px] font-medium text-muted';
const Err = ({s}: {s: FormState}) => s?.error ? <div role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{s.error}</div> : null;
const Field = ({l, children, wide}: {l: string; children: React.ReactNode; wide?: boolean}) => <label className={cx(label, wide && 'sm:col-span-2')}>{l}{children}</label>;
/** Submits without React's automatic form reset, so a validation error keeps what the curator typed. */
function useForm(action: (prev: FormState, fd: FormData) => Promise<FormState>) {
  const [st, act, busy] = useActionState(action, undefined);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => act(fd)); };
  return {st, busy, onSubmit};
}
const Opts = ({list}: {list: readonly string[]}) => <>{list.map(v => <option key={v} value={v}>{v}</option>)}</>;

export function LoginForm() {
  const {st, busy, onSubmit} = useForm(login);
  return (
    <form onSubmit={onSubmit} className="grid gap-3">
      <Err s={st} />
      <Field l="Password"><input className={input} type="password" name="password" autoComplete="current-password" required autoFocus /></Field>
      <button className={btn} disabled={busy}>{busy ? 'Checking…' : 'Log in'}</button>
    </form>
  );
}

const SCHOOL_HELP = 'Private: decides what may be published. Not shown on the site.';
export function SourceForm({s}: {s?: Source}) {
  const {st, busy, onSubmit} = useForm(saveSource.bind(null, s?.id ?? null));
  const [delivery, setDelivery] = useState(s?.delivery ?? 'api');
  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2"><Err s={st} /></div>
      <Field l="Name"><input className={input} name="name" defaultValue={s?.name} required /></Field>
      <Field l="Author / scholar"><input className={input} name="author" defaultValue={s?.author} /></Field>
      <Field l="Slug (stable id; for API tafseers the API's edition slug)"><input className={input} name="slug" defaultValue={s?.slug} required pattern="[a-z0-9][a-z0-9\-]+" /></Field>
      <Field l="Type"><select className={sel} name="kind" defaultValue={s?.kind ?? 'tafseer'}><Opts list={KINDS} /></select></Field>
      <Field l="Language"><select className={sel} name="lang" defaultValue={s?.lang ?? 'ur'}><Opts list={LANGS} /></select></Field>
      <Field l={`School — ${SCHOOL_HELP}`}><select className={sel} name="school" defaultValue={s?.school ?? 'general'}><Opts list={SCHOOLS} /></select></Field>
      <Field l="Delivery"><select className={sel} name="delivery" value={delivery} onChange={e => setDelivery(e.target.value as typeof delivery)}><Opts list={DELIVERY} /></select></Field>
      <Field l="Status"><select className={sel} name="status" defaultValue={s?.status ?? 'pending'}><Opts list={STATUS} /></select></Field>
      {delivery === 'link' && <Field wide l="Link pattern — {s} surah number, {a} ayah number, {surah} English surah name"><input className={input} name="urlPattern" defaultValue={s?.urlPattern} placeholder="https://example.com/tafseer/{s}/{a}" /></Field>}
      {delivery !== 'link' && <input type="hidden" name="urlPattern" value={s?.urlPattern ?? ''} />}
      <Field wide l="Description (shown to readers)"><textarea className={input} name="description" rows={2} defaultValue={s?.description} /></Field>
      <Field l="Homepage"><input className={input} name="homepage" type="url" defaultValue={s?.homepage} placeholder="https://" /></Field>
      <Field l="Order (smaller first)"><input className={input} name="sort" type="number" min={0} defaultValue={s?.sort ?? 100} /></Field>
      <Field l="Licence"><input className={input} name="licence" defaultValue={s?.licence} /></Field>
      <Field l="Attribution (credit line)"><input className={input} name="attribution" defaultValue={s?.attribution} /></Field>
      <Field wide l="Private notes"><textarea className={input} name="notes" rows={3} defaultValue={s?.notes} /></Field>
      <div className="sm:col-span-2"><button className={btn} disabled={busy}>{busy ? 'Saving…' : s ? 'Save changes' : 'Add source'}</button></div>
    </form>
  );
}

const hms = (sec: number | null) => sec == null ? '' : [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60].map((n, i) => i ? String(n).padStart(2, '0') : String(n)).join(':').replace(/^0:/, '');
export function EntryForm({e, srcs, surah, ayah}: {e?: Entry; srcs: Pick<Source, 'id' | 'name' | 'kind' | 'lang'>[]; surah: number; ayah: number}) {
  const {st, busy, onSubmit} = useForm(saveEntry.bind(null, e?.id ?? null));
  const [whole, setWhole] = useState(!!e && e.ayahFrom == null);
  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2"><Err s={st} /></div>
      <Field wide l="Source"><select className={sel} name="sourceId" defaultValue={e?.sourceId ?? ''} required>
        <option value="">Choose…</option>
        {KINDS.map(k => { const g = srcs.filter(x => x.kind === k); return g.length ? <optgroup key={k} label={k}>{g.map(x => <option key={x.id} value={x.id}>{x.name} ({x.lang})</option>)}</optgroup> : null; })}
      </select></Field>
      <Field l="Surah"><input className={input} name="surah" type="number" min={1} max={114} defaultValue={e?.surah ?? surah} required /></Field>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="whole" checked={whole} onChange={x => setWhole(x.target.checked)} /> Whole surah</label>
      {!whole && <>
        <Field l="From ayah"><input className={input} name="ayahFrom" type="number" min={1} max={286} defaultValue={e?.ayahFrom ?? ayah} required /></Field>
        <Field l="To ayah"><input className={input} name="ayahTo" type="number" min={1} max={286} defaultValue={e?.ayahTo ?? ayah} /></Field>
      </>}
      <Field wide l="Title (e.g. “Bayan-ul-Quran, part 12”)"><input className={input} name="title" defaultValue={e?.title} /></Field>
      <Field l="Link"><input className={input} name="url" type="url" defaultValue={e?.url} placeholder="https://www.youtube.com/watch?v=…" /></Field>
      <Field l="Starts at (video/audio, e.g. 41:10)"><input className={input} name="start" defaultValue={hms(e?.startSec ?? null)} placeholder="mm:ss" /></Field>
      <Field wide l="Text / note (optional)"><textarea className={input} name="body" rows={3} defaultValue={e?.body} /></Field>
      <Field l="Status"><select className={sel} name="status" defaultValue={e?.status ?? 'approved'}><Opts list={STATUS} /></select></Field>
      <div className="self-end"><button className={btn} disabled={busy}>{busy ? 'Saving…' : e ? 'Save changes' : 'Add entry'}</button></div>
    </form>
  );
}
