import {type NextRequest, NextResponse} from 'next/server';
import {relatedAyahsOf, type RelatedItem} from '@/lib/catalog';
import {getIndoPak, getSurahList, getUthmani} from '@/lib/quran';
import {HAS_LETTER, IP_END} from '@/lib/text';


/** A surah's text in the reader's script; Uthmani when Indo-Pak isn't wanted or can't load. */
async function surahText(n: number, wantIp: boolean){
  if (wantIp){ const ip = await getIndoPak('chapter', n).catch(() => null); if (ip) return {map: ip, ip: true}; }
  return {map: await getUthmani('chapter', n).catch(() => null), ip: false};
}

/** Ayahs sharing wording with s:a, each with its Arabic (reader's script) and the shared words marked. ?script=ip for Indo-Pak. */
export async function GET(req: NextRequest, ctx: RouteContext<'/api/related/[s]/[a]'>) {
  const {s: ss, a: as} = await ctx.params;
  const s = /^\d{1,3}$/.test(ss) ? +ss : 0, a = /^\d{1,3}$/.test(as) ? +as : 0;
  if (s < 1 || s > 114 || a < 1) return NextResponse.json({error: 'Bad ayah'}, {status: 400});
  const wantIp = req.nextUrl.searchParams.get('script') === 'ip';
  const rel = await relatedAyahsOf(s, a);
  const [names, texts] = await Promise.all([
    getSurahList().then(l => l.map(x => x.en)).catch(() => [] as string[]),
    Promise.all([...new Set(rel.map(r => r.s))].map(async n => [n, await surahText(n, wantIp)] as const)).then(e => new Map(e)),
  ]);
  const items: RelatedItem[] = rel.map(r => {
    const t = texts.get(r.s), text = t?.map?.[`${r.s}:${r.a}`] || '';
    let n = 0;
    const toks = text.split(' ').filter(x => x && !IP_END.test(x)).map(x => {
      if (!HAS_LETTER.test(x)) return {t: x, hit: false};
      n++; return {t: x, hit: r.match.some(([f, to]) => n >= f && n <= to)};
    });
    return {...r, sname: names[r.s - 1] || `Surah ${r.s}`, ip: !!t?.ip, toks};
  }).filter(i => i.toks.length);
  return NextResponse.json({items}, {headers: {'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'}});
}
