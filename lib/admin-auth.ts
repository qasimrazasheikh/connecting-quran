/**
 * Curator login (server only): one password from ADMIN_PASSWORD, and a signed session cookie that only /admin pages see.
 * The signature also covers the password, so changing ADMIN_PASSWORD logs every session out.
 */
import 'server-only';
import {createHmac, timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';

const COOKIE = 'noor_admin', DAYS = 7;
const password = () => process.env.ADMIN_PASSWORD || '';
const secret = () => process.env.ADMIN_SECRET || '';
/** Both must be set (and the secret long enough) or nobody can log in. */
export const adminConfigured = () => password().length >= 8 && secret().length >= 32;
const sign = (exp: string) => createHmac('sha256', secret()).update(`${exp}.${password()}`).digest('base64url');
const same = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

export async function isAdmin(): Promise<boolean> {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v || !adminConfigured()) return false;
  const [exp, sig] = v.split('.');
  return !!exp && !!sig && +exp > Date.now() && same(Buffer.from(sig), Buffer.from(sign(exp)));
}
/** For admin pages: send visitors without a session to the login page. */
export async function requireAdmin(){ if (!(await isAdmin())) redirect('/admin/login'); }
/** For admin server actions (they can be called directly, so each one checks). */
export async function assertAdmin(){ if (!(await isAdmin())) throw new Error('Not logged in'); }

export function checkPassword(input: string): boolean {
  if (!adminConfigured()) return false;
  const h = (s: string) => createHmac('sha256', secret()).update(s).digest();
  return same(h(input), h(password()));
}
export async function startSession(){
  const exp = String(Date.now() + DAYS * 864e5);
  (await cookies()).set(COOKIE, `${exp}.${sign(exp)}`, {httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/admin', maxAge: DAYS * 86400});
}
export async function endSession(){ (await cookies()).delete({name: COOKIE, path: '/admin'}); }
