import {getMorph, getSurahEditions, getWords} from '@/lib/quran';
import {stripBismillah} from '@/lib/text';
import {NextResponse, type NextRequest} from 'next/server';
/** Everything the quiz builder needs for one surah, in a compact form. */
export async function GET(req: NextRequest, ctx: RouteContext<'/api/quiz/[s]'>) {
  const n = +(await ctx.params).s;
  const lang = req.nextUrl.searchParams.get('lang') === 'en' ? 'en' : 'ur';
  const trans = req.nextUrl.searchParams.get('trans') || 'en.sahih';
  try{
    const [data, words, morph] = await Promise.all([
      getSurahEditions(n, ['quran-uthmani', trans]), getWords('chapter', n, lang).catch(() => new Map()), getMorph().catch(() => null),
    ]);
    const ayahs = data[0].ayahs.map(x => ({a: x.numberInSurah, text: stripBismillah(x.text, n, x.numberInSurah)}));
    const gram: Record<string, [string, string]> = {};
    if (morph) ayahs.forEach(({a, text}) => text.split(' ').forEach((_, i) => {
      const segs = morph.get(`${n}:${a}:${i + 1}`) || []; const main = segs.find(x => !x.tags.includes('PREF') && !x.tags.includes('SUFF')) || segs[0];
      if (main) gram[`${a}:${i + 1}`] = [main.pos, (main.tags.find(t => t.startsWith('ROOT:')) || '').slice(5)];
    }));
    return NextResponse.json({
      ayahs, transLang: data[1].edition.language, trans: Object.fromEntries(data[1].ayahs.map(x => [x.numberInSurah, x.text])),
      words: Object.fromEntries([...words.entries()].map(([k, ws]) => [k.split(':')[1], ws.map((w: {translation?: {text?: string}}) => (w.translation?.text || '').trim())])),
      gram: morph ? gram : null,
    }, {headers: {'Cache-Control': 'public, s-maxage=86400'}});
  }catch(e){ return NextResponse.json({error: (e as Error).message}, {status: 502}); }
}
