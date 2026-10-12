import Link from 'next/link';
import {requireAdmin} from '@/lib/admin-auth';
import {db} from '@/lib/db';
import {abtn, empty} from '@/lib/ui';
import {logout} from '../actions';

/** Everything under here needs the curator's session. */
export default async function PanelLayout({children}: LayoutProps<'/admin'>) {
  await requireAdmin();
  return (
    <div>
      <nav className="mb-4 flex flex-wrap items-center gap-1 border-b border-line pb-2">
        <b className="mr-2">Curator</b>
        <Link className={abtn} href="/admin">Overview</Link>
        <Link className={abtn} href="/admin/sources">Sources</Link>
        <Link className={abtn} href="/admin/entries">Entries by ayah</Link>
        <span className="flex-1" />
        <form action={logout}><button className={abtn}>Log out</button></form>
      </nav>
      {db ? children : <div className={empty}>No database configured: set DATABASE_URL in .env.local (or the Vercel project settings).</div>}
    </div>
  );
}
