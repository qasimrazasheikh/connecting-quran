/* Small inline SVG icons (stroke/fill follow the text colour). */
import type {SVGProps} from 'react';
type P = SVGProps<SVGSVGElement>;
const base = (p: P, stroke = true): P => ({viewBox: '0 0 24 24', width: 18, height: 18, fill: stroke ? 'none' : 'currentColor', stroke: stroke ? 'currentColor' : undefined, strokeWidth: stroke ? 2 : undefined, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, ...p});
export const Icon = {
  play: (p: P) => <svg {...base(p, false)}><path d="M8 5v14l11-7z" /></svg>,
  pause: (p: P) => <svg {...base(p, false)}><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>,
  prev: (p: P) => <svg {...base(p, false)}><path d="M6 5h2v14H6zM20 5v14L9 12z" /></svg>,
  next: (p: P) => <svg {...base(p, false)}><path d="M16 5h2v14h-2zM4 5v14l11-7z" /></svg>,
  yt: (p: P) => <svg {...base(p)}><rect x="2.5" y="5.5" width="19" height="13" rx="3.5" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" /></svg>,
  book: (p: P) => <svg {...base(p)}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></svg>,
  mark: (p: P) => <svg {...base(p)}><path d="M6 3h12v18l-6-4-6 4z" /></svg>,
  markOn: (p: P) => <svg {...base(p)} fill="currentColor"><path d="M6 3h12v18l-6-4-6 4z" /></svg>,
  copy: (p: P) => <svg {...base(p)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>,
  link: (p: P) => <svg {...base(p)}><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>,
  repeat: (p: P) => <svg {...base(p)}><path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" /></svg>,
  moon: (p: P) => <svg {...base(p)}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>,
  x: (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>,
  chev: (p: P) => <svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>,
  left: (p: P) => <svg {...base(p)} strokeWidth={2.2}><path d="M15 6l-6 6 6 6" /></svg>,
  right: (p: P) => <svg {...base(p)} strokeWidth={2.2}><path d="M9 6l6 6-6 6" /></svg>,
  menu: (p: P) => <svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  sliders: (p: P) => <svg {...base(p)}><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>,
};
