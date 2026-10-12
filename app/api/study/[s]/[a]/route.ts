import {relatedAyahsOf, studyLinks, videoCards} from '@/lib/catalog';
import {getSurahList} from '@/lib/quran';
import {NextResponse} from 'next/server';
/** What the Study panel shows for one ayah besides the tafseer text: links to more tafseers, lecture videos, and how many related ayahs there are. */
export async function GET(_req: Request, ctx: RouteContext<'/api/study/[s]/[a]'>) {
  const {s: ss, a: as} = await ctx.params;
  const s = /^\d{1,3}$/.test(ss) ? +ss : 0, a = /^\d{1,3}$/.test(as) ? +as : 0;
  if (s < 1 || s > 114 || a < 1) return NextResponse.json({error: 'Bad ayah'}, {status: 400});
  const name = await getSurahList().then(l => l[s - 1]?.en || `Surah ${s}`).catch(() => `Surah ${s}`);
  const [links, videos, related] = await Promise.all([studyLinks(s, a), videoCards(s, a, name), relatedAyahsOf(s, a)]);
  return NextResponse.json({links, videos, related: related.length}, {headers: {'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=86400'}});
}
