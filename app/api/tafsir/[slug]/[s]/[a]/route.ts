import {getTafsirText} from '@/lib/quran';
import {NextResponse} from 'next/server';
export async function GET(_req: Request, ctx: RouteContext<'/api/tafsir/[slug]/[s]/[a]'>) {
  const {slug, s, a} = await ctx.params;
  try{
    const text = await getTafsirText(slug, +s, +a);
    return NextResponse.json({text}, {headers: {'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'}});
  }catch(e){ return NextResponse.json({error: (e as Error).message}, {status: 502}); }
}
