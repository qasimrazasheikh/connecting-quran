import {catalogTafsirs, studyLinks} from '@/lib/catalog';
import {getEqlTafsir, getTafsirText} from '@/lib/quran';
import {NextResponse} from 'next/server';
export async function GET(_req: Request, ctx: RouteContext<'/api/tafsir/[slug]/[s]/[a]'>) {
  const {slug, s, a} = await ctx.params;
  try{
    let text: string;
    if (slug.startsWith('eql-')){
      // eQuranLibrary tafseers are approved link sources: fetch only the URL the catalogue gives for this ayah
      const link = (await studyLinks(+s, +a)).find(l => l.id === slug && l.url.startsWith('https://equranlibrary.com/'));
      if (!link) return NextResponse.json({error: 'This tafseer is not available'}, {status: 404});
      text = await getEqlTafsir(link.url);
    }else{
      // only tafseers the curator approved (when the catalogue is available)
      const ok = await catalogTafsirs();
      if (ok && !ok.some(e => e.slug === slug)) return NextResponse.json({error: 'This tafseer is not available'}, {status: 404});
      text = await getTafsirText(slug, +s, +a);
    }
    return NextResponse.json({text}, {headers: {'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800'}});
  }catch(e){ return NextResponse.json({error: (e as Error).message}, {status: 502}); }
}
