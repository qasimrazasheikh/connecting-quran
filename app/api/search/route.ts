import {searchQuran} from '@/lib/quran';
import {AR_DIAC} from '@/lib/text';
import {NextResponse, type NextRequest} from 'next/server';
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 100);
  const scope = req.nextUrl.searchParams.get('scope') || 'en';
  const ed = scope === 'ar' ? 'quran-simple-clean' : (req.nextUrl.searchParams.get('ed') || (scope === 'ur' ? 'ur.jalandhry' : 'en.sahih'));
  if (!q) return NextResponse.json({count: 0, matches: [], edition: ed});
  try{
    const r = await searchQuran(scope === 'ar' ? q.replace(AR_DIAC, '') : q, ed);
    return NextResponse.json({...r, edition: ed}, {headers: {'Cache-Control': 'public, s-maxage=3600'}});
  }catch(e){ return NextResponse.json({error: (e as Error).message}, {status: 502}); }
}
