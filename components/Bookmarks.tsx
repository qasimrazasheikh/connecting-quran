'use client';
import Link from 'next/link';
import {useEffect, useState} from 'react';
import {useApp} from './AppProvider';
import {abtn, empty, grid, linkCard, numBadge, rhead} from '@/lib/ui';

export default function Bookmarks() {
  const {bookmarks, toggleBookmark} = useApp();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <>
      <section className={rhead}><h1 className="mb-0.5 mt-1 text-[22px] font-bold">Bookmarks</h1><div className="text-sm text-muted">Saved in this browser</div></section>
      {!ready ? null : bookmarks.length ? (
        <div className={grid}>
          {bookmarks.map(b => (
            <div key={b.k} className={linkCard}>
              <Link className={numBadge} href={`/surah/${b.s}/${b.a}`}>{b.s}</Link>
              <Link className="min-w-0 flex-1 text-ink no-underline" href={`/surah/${b.s}/${b.a}`}><b className="block text-[15px]">{b.name} {b.k}</b><span className="text-[12.5px] text-muted">Saved {new Date(b.t).toLocaleDateString()}</span></Link>
              <button className={abtn} data-del={b.k} title="Remove" onClick={() => toggleBookmark(b.s, b.a)}>✕</button>
            </div>
          ))}
        </div>
      ) : <div className={empty}>No bookmarks yet. Tap the bookmark icon on any ayah to save it here.</div>}
    </>
  );
}
