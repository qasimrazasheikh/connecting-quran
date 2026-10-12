import Link from 'next/link';
import {and, asc, desc, eq, gte, isNull, lte, ne, or} from 'drizzle-orm';
import {requireAdmin} from '@/lib/admin-auth';
import {db, schema} from '@/lib/db';
import {getSurahList} from '@/lib/quran';
import {btn, card, cx, field as input, h4} from '@/lib/ui';
import {setEntryStatus} from '../../actions';
import {EntryForm} from '../../forms';
import {StatusButtons, StatusChip} from '../bits';

export const metadata = {title: 'Entries by ayah'};
const {sources, entries} = schema;
const num = (v: unknown, lo: number, hi: number, d: number) => { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : d; };

/** Pick an ayah, see everything attached to it, and add videos, links or notes. */
export default async function EntriesPage({searchParams}: PageProps<'/admin/entries'>) {
  await requireAdmin();
  const q = await searchParams;
  const surahs = await getSurahList().catch(() => []);
  const s = num(q.s, 1, 114, 1), a = num(q.a, 1, surahs[s - 1]?.ayahs ?? 286, 1);
  const d = db!;
  const [here, srcs, recent] = await Promise.all([
    d.select({e: entries, src: sources.name}).from(entries).innerJoin(sources, eq(entries.sourceId, sources.id))
      .where(and(eq(entries.surah, s), or(isNull(entries.ayahFrom), and(lte(entries.ayahFrom, a), gte(entries.ayahTo, a)))))
      .orderBy(asc(sources.kind), asc(entries.ayahFrom), asc(entries.startSec)),
    d.select({id: sources.id, name: sources.name, kind: sources.kind, lang: sources.lang}).from(sources).where(ne(sources.kind, 'tafseer')).orderBy(asc(sources.kind), asc(sources.sort)),
    d.select({e: entries, src: sources.name}).from(entries).innerJoin(sources, eq(entries.sourceId, sources.id)).orderBy(desc(entries.updatedAt)).limit(15),
  ]);
  const range = (e: typeof entries.$inferSelect) => e.ayahFrom == null ? `${e.surah} (whole surah)` : `${e.surah}:${e.ayahFrom}${e.ayahTo !== e.ayahFrom ? `–${e.ayahTo}` : ''}`;
  return (
    <div className="grid gap-4">
      <form className="flex flex-wrap items-end gap-2">
        <label className="grid gap-1 text-[13px] text-muted">Surah<input className={cx(input, 'w-20')} name="s" type="number" min={1} max={114} defaultValue={s} /></label>
        <label className="grid gap-1 text-[13px] text-muted">Ayah<input className={cx(input, 'w-20')} name="a" type="number" min={1} max={286} defaultValue={a} /></label>
        <button className={btn}>Show</button>
        <span className="pb-2 text-sm text-muted">{surahs[s - 1]?.en} · <Link href={`/surah/${s}/${a}`} target="_blank">open on site ↗</Link></span>
      </form>
      {q.saved && <div role="status" className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">Saved. The site picks up the change within a minute.</div>}

      <section className={`${card} p-4`}>
        <h2 className={h4}>Attached to {s}:{a} ({here.length})</h2>
        {!here.length && <p className="text-muted">Nothing yet. Add a video, link or note below.</p>}
        <ul className="grid gap-2">
          {here.map(({e, src}) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line px-3 py-2">
              <div className="min-w-0 flex-[1_1_260px]">
                <Link href={`/admin/entries/${e.id}`} className="font-semibold">{e.title || '(untitled)'}</Link> <StatusChip s={e.status} />
                <div className="text-[12.5px] text-muted">{src} · {e.kind} · {range(e)}{e.url && <> · <a href={e.url} target="_blank" rel="noopener">link ↗</a></>}</div>
              </div>
              <StatusButtons action={setEntryStatus.bind(null, e.id)} current={e.status} />
            </li>))}
        </ul>
      </section>

      <section className={`${card} p-4`}>
        <h2 className={h4}>Add to {s}:{a}</h2>
        {srcs.length ? <EntryForm key={`${s}:${a}`} srcs={srcs} surah={s} ayah={a} /> : <p className="text-muted">Add a video, audio or link source first.</p>}
      </section>

      {recent.length > 0 && <section className={`${card} p-4`}>
        <h2 className={h4}>Recently changed</h2>
        <ul className="grid gap-1 text-sm">
          {recent.map(({e, src}) => <li key={e.id}><Link href={`/admin/entries/${e.id}`}>{e.title || '(untitled)'}</Link> <span className="text-muted">· {src} · {range(e)} · {e.status}</span></li>)}
        </ul>
      </section>}
    </div>
  );
}
