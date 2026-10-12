import Link from 'next/link';
import {notFound} from 'next/navigation';
import {count, eq} from 'drizzle-orm';
import {requireAdmin} from '@/lib/admin-auth';
import {db, schema} from '@/lib/db';
import {abtn, card, h4} from '@/lib/ui';
import {deleteSource} from '../../../actions';
import {SourceForm} from '../../../forms';

export const metadata = {title: 'Source'};
const {sources, entries} = schema;

/** Edit a source, or add one at /admin/sources/new. */
export default async function SourcePage({params, searchParams}: PageProps<'/admin/sources/[id]'>) {
  await requireAdmin();
  const {id} = await params, {saved} = await searchParams;
  if (id === 'new') return <section className={`${card} p-4`}><h1 className="mb-3 text-lg font-bold">Add a source</h1><SourceForm /></section>;
  if (!/^\d+$/.test(id)) notFound();
  const [s] = await db!.select().from(sources).where(eq(sources.id, +id));
  if (!s) notFound();
  const [{n}] = await db!.select({n: count()}).from(entries).where(eq(entries.sourceId, s.id));
  return (
    <div className="grid gap-4">
      <Link className={abtn} href="/admin/sources">← All sources</Link>
      {saved && <div role="status" className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">Saved. The site picks up the change within a minute.</div>}
      <section className={`${card} p-4`}><h1 className="mb-3 text-lg font-bold">{s.name}</h1><SourceForm s={s} /></section>
      <section className={`${card} p-4`}>
        <h2 className={h4}>Delete</h2>
        <p className="mb-2 text-sm text-muted">Removes the source{n ? ` and its ${n} entr${n === 1 ? 'y' : 'ies'}` : ''} for good. To take it off the site but keep it, set the status to hidden instead.</p>
        <form action={deleteSource.bind(null, s.id)} className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" required /> Yes, delete it</label><button className="rounded-lg border border-bad px-3 py-1.5 text-sm text-bad">Delete permanently</button></form>
      </section>
    </div>
  );
}
