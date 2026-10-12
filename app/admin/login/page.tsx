import {redirect} from 'next/navigation';
import {adminConfigured, isAdmin} from '@/lib/admin-auth';
import {card} from '@/lib/ui';
import {LoginForm} from '../forms';

export const metadata = {title: 'Log in'};

export default async function LoginPage() {
  if (await isAdmin()) redirect('/admin');
  return (
    <div className={`${card} mx-auto mt-6 max-w-sm p-5`}>
      <h1 className="mb-1 text-xl font-bold">Curator login</h1>
      <p className="mb-4 text-sm text-muted">For managing the encyclopedia catalogue.</p>
      {adminConfigured()
        ? <LoginForm />
        : <p className="rounded-lg border border-dashed border-line p-3 text-sm text-muted">Login is switched off: set ADMIN_PASSWORD (8+ characters) and ADMIN_SECRET (32+ characters) in .env.local, or in the Vercel project settings, then restart.</p>}
    </div>
  );
}
