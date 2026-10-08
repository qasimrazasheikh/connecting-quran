'use client';
import {usePathname, useSearchParams} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';

/** Thin loading bar at the top of the page while the next page loads (helps on slow connections). */
const EV = 'noor:nav';
type Msg = 'start' | 'hold' | 'release';
const send = (m: Msg) => window.dispatchEvent(new CustomEvent<Msg>(EV, {detail: m}));
/** Start the bar before router.push(href) (link clicks start it by themselves). Ignored when href is the current page. */
export const navStart = (href: string) => { if (isOtherPage(href)) send('start'); };
/** Keeps the bar running while mounted: put it in a route's loading screen. */
export function NavHold() {
  useEffect(() => { send('hold'); return () => { send('release'); }; }, []);
  return null;
}

function isOtherPage(href: string): boolean {
  const u = new URL(href, location.href);
  return u.origin === location.origin && u.pathname + u.search !== location.pathname + location.search;
}
/** A plain left click on a same-site link that goes to another page (not a new tab, download or #anchor). */
function isNavClick(e: MouseEvent): boolean {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return false;
  return isOtherPage(a.href);
}

export default function NavProgress() {
  const path = usePathname(), search = useSearchParams().toString();
  const [st, setSt] = useState<'idle' | 'run' | 'done'>('idle');
  const pending = useRef(false), holds = useRef(0), safety = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const settle = () => { if (!pending.current && holds.current <= 0) setSt(s => (s === 'run' ? 'done' : s)); };
    const run = () => {
      setSt('run'); clearTimeout(safety.current);
      // never spin forever (e.g. a click whose handler cancelled the navigation)
      safety.current = setTimeout(() => { pending.current = false; holds.current = 0; settle(); }, 20000);
    };
    const onMsg = (e: Event) => {
      const m = (e as CustomEvent<Msg>).detail;
      if (m === 'start'){ pending.current = true; run(); }
      else if (m === 'hold'){ holds.current++; run(); }
      else { holds.current = Math.max(0, holds.current - 1); settle(); }
    };
    // capture phase: runs before Next's <Link> handler cancels the browser navigation
    const onClick = (e: MouseEvent) => { if (isNavClick(e)){ pending.current = true; run(); } };
    window.addEventListener(EV, onMsg); document.addEventListener('click', onClick, true);
    return () => { window.removeEventListener(EV, onMsg); document.removeEventListener('click', onClick, true); clearTimeout(safety.current); };
  }, []);

  // the new address has rendered
  useEffect(() => {
    pending.current = false;
    if (holds.current <= 0) setSt(s => (s === 'run' ? 'done' : s));
  }, [path, search]);

  useEffect(() => {
    if (st !== 'done') return;
    const t = setTimeout(() => setSt('idle'), 400);
    return () => clearTimeout(t);
  }, [st]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px]">
      <div className="h-full bg-accent shadow-[0_0_8px_var(--accent)]"
        style={{
          width: st === 'idle' ? '0%' : st === 'run' ? '85%' : '100%',
          opacity: st === 'done' ? 0 : 1,
          transition: st === 'run' ? 'width 8s cubic-bezier(.1,.7,.2,1)' : st === 'done' ? 'width .2s ease-out, opacity .3s .15s' : 'none',
        }} />
    </div>
  );
}
