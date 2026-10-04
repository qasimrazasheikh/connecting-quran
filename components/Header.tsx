'use client';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {useState} from 'react';
import {useApp} from './AppProvider';
import {Icon} from './Icons';
import {cx, iconBtn} from '@/lib/ui';

const NAV = [
  {href: '/', key: 'home', label: 'Quran'}, {href: '/mushaf', key: 'mushaf', label: 'Mushaf'}, {href: '/juz', key: 'juz', label: 'Juz'},
  {href: '/tafseer/1/1', key: 'tafseer', label: 'Tafseer'}, {href: '/videos/1/1', key: 'videos', label: 'Videos'}, {href: '/quiz', key: 'quiz', label: 'Quiz'},
  {href: '/search', key: 'search', label: 'Search'}, {href: '/bookmarks', key: 'bookmarks', label: 'Bookmarks'},
];
function navKey(path: string){
  const p = path.split('/')[1] || '';
  if (!p || p === 'surah') return 'home';
  return p;
}

export default function Header() {
  const {surahs, openSettings, toast} = useApp();
  const router = useRouter();
  const on = navKey(usePathname());
  const [open, setOpen] = useState(false);
  const [jump, setJump] = useState('');

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const v = jump.trim();
    const m = v.match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/) || v.match(/^(\d{1,3})$/);
    if (m && +m[1] >= 1 && +m[1] <= 114){ router.push(m[2] ? `/surah/${+m[1]}/${+m[2]}` : `/surah/${+m[1]}`); (document.activeElement as HTMLElement)?.blur(); return; }
    const q = v.toLowerCase().replace(/[^a-z]/g, '');
    const hit = q && surahs.find(s => s.en.toLowerCase().replace(/[^a-z]/g, '').includes(q));
    if (hit){ router.push(`/surah/${hit.n}`); return; }
    if (v) router.push(`/search?q=${encodeURIComponent(v)}`);
    else toast('Type a surah number, name, 2:255, or a word to search');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] backdrop-blur-[14px] backdrop-saturate-[1.4]">
      <div className="relative mx-auto flex max-w-[1100px] items-center gap-2 px-3 py-2.5 md:gap-3 md:px-4">
        <button className={cx(iconBtn, 'md:hidden')} aria-label="Menu" onClick={() => setOpen(o => !o)}><Icon.menu /></button>
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap text-base font-bold tracking-tight text-ink no-underline md:gap-2.5 md:text-lg">
          <span className="grid size-[30px] place-items-center rounded-[10px] bg-[linear-gradient(135deg,var(--hero1),var(--hero2))] font-amiri text-lg text-accent2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_55%,transparent)] md:size-[34px] md:text-xl">
            {/* open mushaf with linked points above it */}
            <svg viewBox="0 0 24 24" className="size-[20px] md:size-[22px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 20c-2.5-1.6-5.5-2-9-1.6V9.6c3.5-.4 6.5 0 9 1.6 2.5-1.6 5.5-2 9-1.6v8.8c-3.5-.4-6.5 0-9 1.6z" />
              <path d="M12 11.2V20" />
              <path d="M6 5.5 12 3l6 2.5" strokeWidth={1.2} />
              <circle cx="6" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="12" cy="3" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="18" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span>Connecting Quran<small className="hidden text-[11px] font-medium tracking-wider text-muted min-[1521px]:block">QURAN · TRANSLATION · TAFSEER</small></span>
        </Link>
        <nav className={cx('md:ml-1 md:flex md:gap-0.5 min-[1521px]:ml-3 min-[1521px]:gap-1',
          open ? 'absolute inset-x-0 top-full flex flex-col border-b border-line bg-surface px-4 py-2' : 'hidden')} onClick={() => setOpen(false)}>
          {NAV.map(n => (
            <Link key={n.key} href={n.href} data-nav={n.key}
              className={cx('rounded-lg px-3 py-[7px] text-[15px] font-medium no-underline md:px-[9px] md:text-[14.5px] min-[1521px]:px-3 min-[1521px]:text-[15px]',
                on === n.key ? 'bg-brand text-on-brand' : 'text-muted hover:bg-brand-soft hover:text-brand')}>{n.label}</Link>
          ))}
        </nav>
        <div className="flex-1" />
        <form className="flex overflow-hidden rounded-[9px] border border-line bg-bg" onSubmit={go} title="Go to Surah:Ayah, e.g. 2:255">
          <input id="jumpIn" value={jump} onChange={e => setJump(e.target.value)} placeholder="2:255" aria-label="Go to Surah:Ayah"
            className="w-[58px] border-0 bg-transparent px-2 py-[7px] text-ink outline-none md:w-[84px] min-[1521px]:w-[110px] min-[1521px]:px-2.5" />
          <button className="border-0 bg-brand px-2.5 text-on-brand md:px-3" aria-label="Go">Go</button>
        </form>
        <button className={iconBtn} id="setBtn" aria-label="Settings" onClick={() => openSettings()}><Icon.sliders /></button>
      </div>
    </header>
  );
}
