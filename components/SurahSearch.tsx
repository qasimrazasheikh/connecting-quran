'use client';
import {useId, useRef, useState} from 'react';
import {useApp} from './AppProvider';
import type {SurahInfo} from '@/lib/quran';
import {cx, sel} from '@/lib/ui';

/** A surah matches by number, English name (spelling marks ignored: "baqara" finds Al-Baqarah), meaning, or Arabic name. */
export function surahMatches(s: SurahInfo, q: string) {
  const query = q.trim().toLowerCase(), qq = query.replace(/[^a-z]/g, '');
  return !query || String(s.n) === query || (!!qq && s.en.toLowerCase().replace(/[^a-z]/g, '').includes(qq)) || s.mean.toLowerCase().includes(query) || s.ar.includes(q.trim());
}

/** Surah box you can type in: shows the current surah, lists matches while typing; picking one calls onPick. */
export default function SurahSearch({s, onPick, id, className}: {s: number; onPick: (n: number) => void; id: string; className?: string}) {
  const {surahs} = useApp();
  const [q, setQ] = useState<string | null>(null); // null = not searching: the box shows the current surah
  const [hi, setHi] = useState(0);
  const listId = useId(), input = useRef<HTMLInputElement>(null);
  const cur = surahs[s - 1], open = q !== null;
  const items = open ? surahs.filter(x => surahMatches(x, q)) : [];
  const close = () => { setQ(null); setHi(0); };
  const pick = (n: number) => { close(); input.current?.blur(); if (n !== s) onPick(n); };
  const show = (i: number) => { setHi(i); document.getElementById(`${listId}-${i}`)?.scrollIntoView({block: 'nearest'}); };
  return (
    <div className="relative">
      <input ref={input} id={id} className={cx(sel, 'w-[320px] max-w-full', className)} role="combobox" aria-label="Surah" aria-autocomplete="list"
        aria-expanded={open} aria-controls={listId} aria-activedescendant={open && items[hi] ? `${listId}-${hi}` : undefined}
        placeholder="Search surah by name or number…" autoComplete="off" spellCheck={false}
        value={open ? q : cur ? `${cur.n}. ${cur.en}` : ''}
        onFocus={() => { setQ(''); setHi(0); }} onBlur={close}
        onChange={e => { setQ(e.target.value); setHi(0); }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if (items.length) show((hi + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length); }
          else if (e.key === 'Enter'){ e.preventDefault(); if (items[hi]) pick(items[hi].n); }
          else if (e.key === 'Escape'){ close(); input.current?.blur(); }
        }} />
      {open && <ul id={listId} role="listbox" aria-label="Surahs" className="absolute left-0 top-full z-30 mt-1 max-h-[min(60vh,340px)] w-[360px] max-w-[calc(100vw-32px)] overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[0_12px_40px_rgba(0,0,0,.18)]">
        {items.length ? items.map((x, i) => (
          // mousedown, not click: the input's blur would close the list first
          <li key={x.n} id={`${listId}-${i}`} role="option" aria-selected={i === hi} data-n={x.n} onMouseDown={e => { e.preventDefault(); pick(x.n); }} onMouseEnter={() => setHi(i)}
            className={cx('flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm', i === hi && 'bg-brand-soft', x.n === s && 'font-semibold text-brand')}>
            <span className="w-7 flex-none text-right text-xs text-muted">{x.n}</span>
            <span className="min-w-0 flex-1 truncate">{x.en} <span className="text-xs text-muted">· {x.mean}</span></span>
            <span className="flex-none font-ar text-base" dir="rtl">{x.ar}</span>
          </li>)) : <li className="px-2.5 py-2 text-sm text-muted">No surah matches “{q}”.</li>}
      </ul>}
    </div>
  );
}
