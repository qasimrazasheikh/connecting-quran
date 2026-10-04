'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import {highlight} from '@/lib/highlight';
import type {SearchMatch} from '@/lib/quran';
import {btn, btnGhost, cx, empty, rhead, sel} from '@/lib/ui';

type Res = {count: number; matches: SearchMatch[]; edition: string} | null;
const SCOPES: [string, string][] = [['ar', 'Arabic text'], ['ur', 'Urdu translation'], ['en', 'English translation']];

export default function SearchView({q, scope, res, error}: {q: string; scope: string; res: Res; error?: string}) {
  const router = useRouter();
  const [text, setText] = useState(q);
  const [sc, setSc] = useState(scope);
  const [shown, setShown] = useState(50);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { setText(q); setSc(scope); setShown(50); if (!q) input.current?.focus(); }, [q, scope]);
  const submit = (scopeV = sc) => { const v = text.trim(); if (v) router.push(`/search?q=${encodeURIComponent(v)}&scope=${scopeV}`); };
  const where = scope === 'ar' ? 'Arabic text' : scope === 'ur' ? 'the Urdu translation' : 'the English translation';
  const list = res?.matches || [];
  return (
    <>
      <section className={rhead}><h1 className="mb-0.5 mt-1 text-[22px] font-bold">Search the Quran</h1>
        <div className="text-sm text-muted">Search Arabic text or a translation. Tip: for Urdu words, choose “Urdu translation”.</div></section>
      <form className="mb-3 flex flex-wrap gap-2" id="sForm" onSubmit={e => { e.preventDefault(); submit(); }}>
        <input ref={input} id="sIn" value={text} onChange={e => setText(e.target.value)} placeholder="e.g. صبر · رحمة · patience · mercy" dir="auto" autoComplete="off"
          className="min-w-[200px] flex-1 rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-base text-ink outline-none focus:border-brand" />
        <select className={sel} id="sScope" value={sc} onChange={e => { setSc(e.target.value); submit(e.target.value); }}>{SCOPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <button className={btn}>Search</button>
      </form>
      {!q ? <div className={empty}>Type a word and press Search.</div>
        : error ? <div className={empty}>Search failed. {error}</div>
        : !list.length ? <div className={empty}>No results for “{q}” in {where}. Try another spelling, or another search type.</div>
        : <div id="sOut">
            <div className="mb-2.5 mt-1 text-sm text-muted">{res!.count} result{res!.count === 1 ? '' : 's'} for “{q}” in {scope === 'ar' ? 'Arabic text' : res!.edition}</div>
            {list.slice(0, shown).map(m => (
              <Link key={m.s + ':' + m.a} href={`/surah/${m.s}/${m.a}`} className="sres mb-2 block rounded-2xl border border-line bg-surface px-3.5 py-3 text-ink no-underline shadow-card hover:border-brand">
                <div className="mb-1 text-[13px] font-semibold text-brand">{m.s}:{m.a} · {m.sname}</div>
                <div className={cx(scope === 'ar' ? 'q-ar !text-2xl' : scope === 'ur' ? 'urdu text-lg' : 'text-base')} style={scope === 'ar' ? {lineHeight: 1.9} : undefined}
                  dir={scope === 'en' ? 'ltr' : 'rtl'} dangerouslySetInnerHTML={{__html: highlight(m.text, q, scope)}} />
              </Link>
            ))}
            {list.length > shown && <button className={cx(btnGhost, 'w-full')} id="sMore" onClick={() => setShown(n => n + 50)}>Show more ({list.length - shown} left)</button>}
          </div>}
    </>
  );
}
