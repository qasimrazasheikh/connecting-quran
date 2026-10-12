import Link from 'next/link';
import {and, asc, eq, type SQL} from 'drizzle-orm';
import {requireAdmin} from '@/lib/admin-auth';
import {db, schema} from '@/lib/db';
import {KINDS, LANGS, STATUS} from '@/lib/db/enums';
import {btn, card, cx, sel} from '@/lib/ui';
import {setSourceStatus} from '../../actions';
import {StatusButtons, StatusChip} from '../bits';

export const metadata = {title: 'Sources'};
const {sources} = schema;
const one = (v: string | string[] | undefined, list: readonly string[]) => typeof v === 'string' && list.includes(v) ? v : '';

export default async function SourcesPage({searchParams}: PageProps<'/admin/sources'>) {
  await requireAdmin();
  const q = await searchParams;
  const kind = one(q.kind, KINDS), status = one(q.status, STATUS), lang = one(q.lang, LANGS);
  const where: SQL[] = [];
  if (kind) where.push(eq(sources.kind, kind as (typeof KINDS)[number]));
  if (status) where.push(eq(sources.status, status as (typeof STATUS)[number]));
  if (lang) where.push(eq(sources.lang, lang as (typeof LANGS)[number]));
  const rows = await db!.select().from(sources).where(where.length ? and(...where) : undefined).orderBy(asc(sources.kind), asc(sources.sort), asc(sources.id));
  const Filter = ({name, list, value}: {name: string; list: readonly string[]; value: string}) => (
    <select className={sel} name={name} defaultValue={value} aria-label={name}><option value="">All {name === 'status' ? 'statuses' : name === 'lang' ? 'languages' : 'types'}</option>{list.map(v => <option key={v} value={v}>{v}</option>)}</select>);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <form className="flex flex-wrap gap-2">
          <Filter name="kind" list={KINDS} value={kind} /><Filter name="status" list={STATUS} value={status} /><Filter name="lang" list={LANGS} value={lang} />
          <button className={cx(btn, '!py-1.5')}>Filter</button>
        </form>
        <span className="flex-1" />
        <Link className={btn} href="/admin/sources/new">+ Add source</Link>
      </div>
      <p className="text-[13px] text-muted">{rows.length} source{rows.length === 1 ? '' : 's'}. Only <b>live</b> ones appear on the site; smaller order numbers come first.</p>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full text-left text-sm">
          <thead className="text-[12px] uppercase tracking-wider text-muted"><tr className="border-b border-line">{['Order', 'Name', 'Type', 'Lang', 'Status', ''].map(h => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id} className="border-b border-line last:border-0 align-top">
                <td className="px-3 py-2 text-muted">{s.sort}</td>
                <td className="px-3 py-2"><Link href={`/admin/sources/${s.id}`} className="font-semibold">{s.name}</Link>{s.author && <div className="text-[12.5px] text-muted">{s.author}</div>}{s.notes && <div className="mt-0.5 max-w-[46ch] text-[12px] italic text-muted">{s.notes}</div>}</td>
                <td className="px-3 py-2">{s.kind}</td>
                <td className="px-3 py-2">{s.lang}</td>
                <td className="px-3 py-2"><StatusChip s={s.status} /></td>
                <td className="px-3 py-2"><StatusButtons action={setSourceStatus.bind(null, s.id)} current={s.status} /></td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
