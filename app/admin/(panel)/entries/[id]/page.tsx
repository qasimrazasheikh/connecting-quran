import Link from 'next/link';
import {notFound} from 'next/navigation';
import {asc, eq, ne} from 'drizzle-orm';
import {requireAdmin} from '@/lib/admin-auth';
import {db, schema} from '@/lib/db';
import {abtn, card, h4} from '@/lib/ui';
import {deleteEntry} from '../../../actions';
import {EntryForm} from '../../../forms';

export const metadata = {title: 'Entry'};
const {sources, entries} = schema;

export default async function EntryPage({params}: PageProps<'/admin/entries/[id]'>) {
  await requireAdmin();
  const {id} = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [[e], srcs] = await Promise.all([
    db!.select().from(entries).where(eq(entries.id, +id)),
    db!.select({id: sources.id, name: sources.name, kind: sources.kind, lang: sources.lang}).from(sources).where(ne(sources.kind, 'tafseer')).orderBy(asc(sources.kind), asc(sources.sort)),
  ]);
  if (!e) notFound();
  const back = `/admin/entries?s=${e.surah}&a=${e.ayahFrom ?? 1}`;
  return (
    <div className="grid gap-4">
      <Link className={abtn} href={back}>← Back to {e.surah}:{e.ayahFrom ?? 1}</Link>
      <section className={`${card} p-4`}><h1 className="mb-3 text-lg font-bold">Edit entry</h1><EntryForm e={e} srcs={srcs} surah={e.surah} ayah={e.ayahFrom ?? 1} /></section>
      <section className={`${card} p-4`}>
        <h2 className={h4}>Delete</h2>
        <form action={deleteEntry.bind(null, e.id, back)} className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" required /> Yes, delete it</label>
          <button className="rounded-lg border border-bad px-3 py-1.5 text-sm text-bad">Delete permanently</button>
        </form>
      </section>
    </div>
  );
}
