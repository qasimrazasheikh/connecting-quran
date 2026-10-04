import {describeSeg, POS_NAME} from '@/lib/grammar';
import {getMorph, getVerseWords} from '@/lib/quran';
import {cleanIP, wordCount} from '@/lib/text';
import {NextResponse, type NextRequest} from 'next/server';
/** Grammar + meaning for one word. `w` = word number; `t` = token number in Indo-Pak text (mapped to the word number). */
export async function GET(req: NextRequest, ctx: RouteContext<'/api/word/[s]/[a]'>) {
  const {s, a} = await ctx.params;
  let w = +(req.nextUrl.searchParams.get('w') || 0);
  const t = +(req.nextUrl.searchParams.get('t') || 0);
  try{
    const [en, ur, morph] = await Promise.all([getVerseWords(+s, +a, 'en').catch(() => []), getVerseWords(+s, +a, 'ur').catch(() => []), getMorph()]);
    if (!w && t){
      let cum = 0; w = t;
      for (let i = 0; i < en.length; i++){ cum += Math.max(1, wordCount(cleanIP(en[i].text_indopak || ''))); if (t <= cum){ w = i + 1; break; } }
    }
    const segs = (morph.get(`${s}:${a}:${w}`) || []);
    const parts = segs.map(describeSeg);
    const mainIdx = segs.findIndex(x => !x.tags.includes('PREF') && !x.tags.includes('SUFF'));
    const main = parts.find((p, i) => !segs[i].tags.includes('PREF') && !segs[i].tags.includes('SUFF') && (p.root || p.lemma)) || parts[0];
    const pos = mainIdx >= 0 ? segs[mainIdx].pos : '';
    return NextResponse.json({
      w, translit: en[w - 1]?.transliteration?.text || '', meanEn: en[w - 1]?.translation?.text || '', meanUr: ur[w - 1]?.translation?.text || '',
      type: POS_NAME[pos] ? `${POS_NAME[pos][0]} — ${POS_NAME[pos][1]}` : '', root: main?.root || '', lemma: main?.lemma || '', segs: parts,
    }, {headers: {'Cache-Control': 'public, s-maxage=86400'}});
  }catch(e){ return NextResponse.json({error: (e as Error).message}, {status: 502}); }
}
