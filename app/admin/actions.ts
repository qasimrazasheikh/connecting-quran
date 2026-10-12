'use server';
/** Curator actions. Every one checks the session first: server actions can be called directly, not only from these pages. */
import {eq} from 'drizzle-orm';
import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {assertAdmin, checkPassword, endSession, startSession} from '@/lib/admin-auth';
import {clearCatalogCache} from '@/lib/catalog';
import {db, schema} from '@/lib/db';
import {DELIVERY, KINDS, LANGS, SCHOOLS, STATUS} from '@/lib/db/schema';

const {sources, entries} = schema;
/** After a change: drop the catalogue cache and re-render the admin pages. */
const changed = () => { clearCatalogCache(); revalidatePath('/admin', 'layout'); };
const need = () => { if (!db) throw new Error('No database configured (DATABASE_URL)'); return db; };

/* ---- form parsing: anything unexpected is rejected rather than stored */
const str = (fd: FormData, k: string, max = 300) => String(fd.get(k) ?? '').trim().slice(0, max);
function pick<T extends readonly string[]>(fd: FormData, k: string, list: T): T[number] {
  const v = str(fd, k);
  if (!list.includes(v)) throw new Error(`Invalid ${k}`);
  return v as T[number];
}
function int(fd: FormData, k: string, lo: number, hi: number): number | null {
  const v = str(fd, k);
  if (!v) return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < lo || n > hi) throw new Error(`Invalid ${k}`);
  return n;
}
function link(fd: FormData, k: string): string {
  const v = str(fd, k, 1000);
  if (v && !/^https:\/\/[^\s]+$/i.test(v)) throw new Error(`${k} must be an https:// link`);
  return v;
}
/** "41:10", "1:02:05" or plain seconds → seconds. */
function seconds(fd: FormData, k: string): number | null {
  const v = str(fd, k);
  if (!v) return null;
  if (!/^\d+(:\d{1,2}){0,2}$/.test(v)) throw new Error('Start time must look like 41:10 or 1:02:05');
  return v.split(':').reduce((t, p) => t * 60 + Number(p), 0);
}

export type FormState = {error?: string} | undefined;
const fail = (e: unknown): FormState => ({error: (e as Error).message});

/* ---- session */
export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  if (!checkPassword(String(fd.get('password') ?? ''))){
    await new Promise(r => setTimeout(r, 1000)); // slows down guessing
    return {error: 'Wrong password'};
  }
  await startSession();
  redirect('/admin');
}
export async function logout(){ await endSession(); redirect('/admin/login'); }

/* ---- sources */
export async function saveSource(id: number | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  let newId = id;
  try{
    const row = {
      slug: str(fd, 'slug', 80).toLowerCase(), kind: pick(fd, 'kind', KINDS), name: str(fd, 'name'), author: str(fd, 'author'),
      lang: pick(fd, 'lang', LANGS), school: pick(fd, 'school', SCHOOLS), delivery: pick(fd, 'delivery', DELIVERY),
      urlPattern: link(fd, 'urlPattern'), description: str(fd, 'description', 1000), licence: str(fd, 'licence', 500),
      attribution: str(fd, 'attribution', 500), homepage: link(fd, 'homepage'), status: pick(fd, 'status', STATUS),
      sort: int(fd, 'sort', 0, 100000) ?? 100, notes: str(fd, 'notes', 4000), updatedAt: new Date(),
    };
    if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(row.slug)) throw new Error('Slug: lowercase letters, digits and dashes');
    if (!row.name) throw new Error('Name is required');
    if (id) await need().update(sources).set(row).where(eq(sources.id, id));
    else newId = (await need().insert(sources).values(row).returning({id: sources.id}))[0].id;
  }catch(e){
    if (/sources_slug_unique|duplicate key/.test(String((e as Error).message) + String((e as {cause?: Error}).cause?.message))) return {error: 'That slug is already used by another source'};
    return fail(e);
  }
  changed();
  redirect(`/admin/sources/${newId}?saved=1`);
}
export async function setSourceStatus(id: number, status: (typeof STATUS)[number]){
  await assertAdmin();
  if (!STATUS.includes(status)) throw new Error('Invalid status');
  await need().update(sources).set({status, updatedAt: new Date()}).where(eq(sources.id, id));
  changed();
}
const confirmed = (fd: FormData) => { if (fd.get('confirm') !== 'on') throw new Error('Tick the confirmation box to delete'); };
export async function deleteSource(id: number, fd: FormData){
  await assertAdmin(); confirmed(fd);
  await need().delete(sources).where(eq(sources.id, id)); // its entries go with it (cascade)
  changed();
  redirect('/admin/sources');
}

/* ---- entries */
export async function saveEntry(id: number | null, _prev: FormState, fd: FormData): Promise<FormState> {
  await assertAdmin();
  let back = '';
  try{
    const sourceId = int(fd, 'sourceId', 1, 1e9);
    if (!sourceId) throw new Error('Choose a source');
    const src = (await need().select({kind: sources.kind}).from(sources).where(eq(sources.id, sourceId)))[0];
    if (!src) throw new Error('Unknown source');
    const surah = int(fd, 'surah', 1, 114);
    if (!surah) throw new Error('Surah is required');
    const whole = fd.get('whole') === 'on';
    const from = whole ? null : int(fd, 'ayahFrom', 1, 286), to = whole ? null : int(fd, 'ayahTo', 1, 286) ?? from;
    if (!whole && (!from || !to || to < from)) throw new Error('Give the ayah range (from ≤ to), or tick “whole surah”');
    const row = {
      sourceId, kind: src.kind, surah, ayahFrom: from, ayahTo: to, title: str(fd, 'title'), url: link(fd, 'url'),
      startSec: seconds(fd, 'start'), body: str(fd, 'body', 20000), status: pick(fd, 'status', STATUS), updatedAt: new Date(),
    };
    if (!row.url && !row.body) throw new Error('Add a link or some text');
    if (id) await need().update(entries).set(row).where(eq(entries.id, id));
    else await need().insert(entries).values({...row, origin: 'admin'});
    back = `/admin/entries?s=${surah}&a=${from ?? 1}&saved=1`;
  }catch(e){ return fail(e); }
  changed();
  redirect(back);
}
export async function setEntryStatus(id: number, status: (typeof STATUS)[number]){
  await assertAdmin();
  if (!STATUS.includes(status)) throw new Error('Invalid status');
  await need().update(entries).set({status, updatedAt: new Date()}).where(eq(entries.id, id));
  changed();
}
export async function deleteEntry(id: number, back: string, fd: FormData){
  await assertAdmin(); confirmed(fd);
  await need().delete(entries).where(eq(entries.id, id));
  changed();
  redirect(back.startsWith('/admin') ? back : '/admin/entries');
}
