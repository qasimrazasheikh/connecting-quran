import {FALLBACK_TRANS} from '@/lib/meta';
import {getSurahEditions, getTransEditions, transMeta} from '@/lib/quran';
import {NextResponse} from 'next/server';

/**
 * One translation of one surah, ayah by ayah, for the mobile app (which ships the Arabic and fetches the translations
 * a reader picks). Only translations the catalogue lists are served, so nothing unexpected reaches the sources' URLs.
 */
export async function GET(_req: Request, ctx: RouteContext<'/api/v1/translation/[id]/[s]'>) {
  const {id, s} = await ctx.params;
  const n = Number(s);
  if (!/^\d{1,3}$/.test(s) || n < 1 || n > 114) return NextResponse.json({error: 'Unknown surah'}, {status: 404});
  const eds = await getTransEditions();
  if (![...eds, ...FALLBACK_TRANS].some(e => e.identifier === id)) return NextResponse.json({error: 'Unknown translation'}, {status: 404});
  try{
    const [ed] = await getSurahEditions(n, [id]);
    return NextResponse.json({...transMeta(eds, id), s: n, ayahs: ed.ayahs.map(x => x.text)},
      {headers: {'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'}});
  }catch(e){ return NextResponse.json({error: (e as Error).message}, {status: 502}); }
}
