import {studyLinks} from '@/lib/catalog';
import {getQohTafsirs} from '@/lib/quran';
import {NextResponse} from 'next/server';
/** The tafseers on QuranoHadith's page for s:a, split per work. Only the URL the catalogue approves for this ayah is read. */
export async function GET(_req: Request, ctx: RouteContext<'/api/qoh/[s]/[a]'>) {
  const {s, a} = await ctx.params;
  const link = (await studyLinks(+s, +a)).find(l => l.url.startsWith('https://quranohadith.com/'));
  if (!link) return NextResponse.json({error: 'Not available'}, {status: 404});
  try{
    const items = await getQohTafsirs(link.url);
    return NextResponse.json({items}, {headers: {'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'}});
  }catch(e){ return NextResponse.json({error: (e as Error).message}, {status: 502}); }
}
