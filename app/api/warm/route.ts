import {NextResponse} from 'next/server';
import {DEFAULT_SETTINGS} from '@/lib/settings';
import {juzView, surahView} from '@/lib/views';

/**
 * Daily cache warm-up (Vercel Cron, see vercel.json). Builds every juz and surah with the default settings so their
 * external data (Quran Foundation, AlQuran Cloud) sits in the data cache: a reader then never waits 3–5 s for a page no
 * one has opened that day. Only Vercel may call it: it sends "Authorization: Bearer $CRON_SECRET", and without that
 * variable set the route refuses everyone.
 */
export const maxDuration = 60;
const WORKERS = 6;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
  const range = (n: number) => Array.from({length: n}, (_, i) => i + 1);
  // juz first: those are the pages readers wait on most
  const jobs: [string, () => Promise<unknown>][] = [
    ...range(30).map(j => [`juz ${j}`, () => juzView(j, DEFAULT_SETTINGS)] as [string, () => Promise<unknown>]),
    ...range(114).map(n => [`surah ${n}`, () => surahView(n, DEFAULT_SETTINGS)] as [string, () => Promise<unknown>]),
  ];
  const t0 = Date.now(), failed: string[] = [];
  let next = 0, done = 0;
  // a few at a time, so Quran Foundation isn't hit with 144 requests at once; stop starting new ones near the time limit
  await Promise.all(range(WORKERS).map(async () => {
    while (next < jobs.length && Date.now() - t0 < (maxDuration - 8) * 1000){
      const [name, run] = jobs[next++];
      try{ await run(); done++; }catch(e){ failed.push(`${name}: ${(e as Error).message}`); }
    }
  }));
  return NextResponse.json({warmed: done, of: jobs.length, failed, ms: Date.now() - t0});
}
