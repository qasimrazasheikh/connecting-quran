'use client';
import {usePathname} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import {googleTranslateUrl} from '@/lib/meta';

/** Laptops/desktops only: selecting Arabic inside a tafseer shows Google Translate links. Phones already offer Translate in their own menu. */
const isTouch = () => matchMedia('(pointer:coarse)').matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

export default function TranslateBar() {
  const [sel, setSel] = useState<{text: string; rect: DOMRect} | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  const path = usePathname();
  useEffect(() => setSel(null), [path]);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const on = () => {
      clearTimeout(t);
      if (isTouch()){ setSel(null); return; }
      t = setTimeout(() => {
        const s = getSelection(); if (!s || s.isCollapsed || !s.rangeCount){ setSel(null); return; }
        const text = s.toString().replace(/\s+/g, ' ').trim();
        if (text.length < 2 || !/[؀-ۿ]/.test(text)){ setSel(null); return; }
        const node = s.getRangeAt(0).commonAncestorContainer;
        const el = node.nodeType === 1 ? node as Element : node.parentElement;
        if (!el?.closest('.tafsir.arabic, .tafsir .qar')){ setSel(null); return; }
        setSel({text, rect: s.getRangeAt(0).getBoundingClientRect()});
      }, 250);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSel(null); };
    document.addEventListener('selectionchange', on); document.addEventListener('keydown', esc);
    return () => { clearTimeout(t); document.removeEventListener('selectionchange', on); document.removeEventListener('keydown', esc); };
  }, []);
  useEffect(() => {
    const el = bar.current; if (!el || !sel) return;
    const w = el.offsetWidth, h = el.offsetHeight, r = sel.rect;
    const top = r.top - h - 10 < 70 ? r.bottom + 10 : r.top - h - 10;
    el.style.top = Math.min(Math.max(70, top), innerHeight - h - 8) + 'px';
    el.style.left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8)) + 'px';
  }, [sel]);
  if (!sel) return null;
  const b = 'rounded-full border-0 bg-white/20 px-2.5 py-[5px] text-white hover:bg-white/30';
  return (
    <div ref={bar} id="selBtn" onMouseDown={e => e.preventDefault()}
      className="fixed z-[58] inline-flex items-center gap-1 rounded-full bg-brand py-[5px] pl-3 pr-1.5 text-[13px] font-semibold text-on-brand shadow-[0_6px_18px_rgba(0,0,0,.2)]">
      <span className="mr-0.5 font-medium opacity-85">Google Translate:</span>
      {([['en', 'English ↗'], ['ur', 'اردو ↗']] as const).map(([l, label]) => (
        <button key={l} data-gl={l} className={b} onClick={() => { window.open(googleTranslateUrl(sel.text, l), '_blank', 'noopener'); setSel(null); }}>{label}</button>
      ))}
    </div>
  );
}
