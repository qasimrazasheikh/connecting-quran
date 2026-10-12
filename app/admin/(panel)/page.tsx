import Link from 'next/link';
import {asc, count, eq} from 'drizzle-orm';
import {requireAdmin} from '@/lib/admin-auth';
import {db, schema} from '@/lib/db';
import {card, chip, h4} from '@/lib/ui';
import {setEntryStatus, setSourceStatus} from '../actions';
import {StatusButtons} from './bits';

export const metadata = {title: 'Overview'};
const {sources, entries} = schema;

export default async function Overview() {
  await requireAdmin();
  const d = db!;
  const [bySource, byEntry, pendingSrc, pendingEnt] = await Promise.all([
    d.select({kind: sources.kind, status: sources.status, n: count()}).from(sources).groupBy(sources.kind, sources.status),
    d.select({status: entries.status, n: count()}).from(entries).groupBy(entries.status),
    d.select().from(sources).where(eq(sources.status, 'pending')).orderBy(asc(sources.kind), asc(sources.sort)),
    d.select({e: entries, src: sources.name}).from(entries).innerJoin(sources, eq(entries.sourceId, sources.id)).where(eq(entries.status, 'pending')).orderBy(asc(entries.surah), asc(entries.ayahFrom)).limit(100),
  ]);
  const kinds = [...new Set(bySource.map(r => r.kind))];
  const n = (k: string, s: string) => bySource.find(r => r.kind === k && r.status === s)?.n ?? 0;
  return (
    <div className="grid gap-4">
      <section className={`${card} p-4`}>
        <h2 className={h4}>Catalogue</h2>
        <div className="flex flex-wrap gap-2">
          {kinds.map(k => <Link key={k} href={`/admin/sources?kind=${k}`} className={chip}>{k}: {n(k, 'approved')} live · {n(k, 'pending')} pending · {n(k, 'hidden')} hidden</Link>)}
          <Link href="/admin/entries" className={chip}>entries: {byEntry.map(r => `${r.n} ${r.status}`).join(' · ') || 'none yet'}</Link>
        </div>
      </section>

      <section className={`${card} p-4`}>
        <h2 className={h4}>Sources waiting for your decision ({pendingSrc.length})</h2>
        {!pendingSrc.length && <p className="text-muted">Nothing pending.</p>}
        <ul className="grid gap-2">
          {pendingSrc.map(s => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line px-3 py-2">
              <div className="min-w-0 flex-[1_1_260px]">
                <Link href={`/admin/sources/${s.id}`} className="font-semibold">{s.name}</Link> <span className="text-muted">· {s.kind} · {s.lang}{s.author ? ` · ${s.author}` : ''}</span>
                {s.notes && <div className="text-[13px] text-muted">{s.notes}</div>}
              </div>
              <StatusButtons action={setSourceStatus.bind(null, s.id)} current={s.status} />
            </li>))}
        </ul>
      </section>

      {pendingEnt.length > 0 && <section className={`${card} p-4`}>
        <h2 className={h4}>Entries waiting for review ({pendingEnt.length})</h2>
        <ul className="grid gap-2">
          {pendingEnt.map(({e, src}) => (
            <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-line px-3 py-2">
              <div className="min-w-0 flex-[1_1_260px]"><Link href={`/admin/entries/${e.id}`} className="font-semibold">{e.title || src}</Link> <span className="text-muted">· {src} · {e.surah}:{e.ayahFrom ?? 'whole'}{e.ayahTo && e.ayahTo !== e.ayahFrom ? `–${e.ayahTo}` : ''}</span></div>
              <StatusButtons action={setEntryStatus.bind(null, e.id)} current={e.status} />
            </li>))}
        </ul>
      </section>}
    </div>
  );
}
