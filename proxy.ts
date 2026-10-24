import {NextResponse, type NextRequest} from 'next/server';
import {QUIZ_PART} from '@/lib/meta';
import {SURAHS} from '@/lib/surahs';

/**
 * Checks Quran addresses before a page renders. The root loading screen makes every page stream at once, so a page
 * that finds its surah/ayah/page doesn't exist can only send "not found" inside a 200 response; search engines treat
 * that as a soft 404. Here a bad address gets a real 404 (the not-found page, rewritten to an address no route has),
 * and /surah on its own goes to the surah list on the home page.
 */
export function proxy(req: NextRequest) {
  const [sec, ...rest] = req.nextUrl.pathname.split('/').filter(Boolean);
  if (sec === 'surah' && !rest.length) return NextResponse.redirect(new URL('/', req.url), 308);
  return valid(sec, rest) ? NextResponse.next() : NextResponse.rewrite(new URL('/not-found-page', req.url));
}

const int = (x: string | undefined, max: number) => !!x && /^\d{1,3}$/.test(x) && +x >= 1 && +x <= max;
const ayahs = (s: string) => SURAHS[+s - 1].ayahs;
function valid(sec: string, [a, b, ...more]: string[]): boolean {
  if (more.length) return false;
  switch (sec){
    case 'surah': return int(a, 114) && (b === undefined || int(b, ayahs(a)));
    case 'tafseer': case 'videos': return int(a, 114) && (b === undefined || int(b, ayahs(a)));
    case 'quiz': return int(a, 114) && (b === undefined || int(b, Math.ceil(ayahs(a) / QUIZ_PART)));
    case 'mushaf': return b === undefined && (a === undefined || int(a, 604));
    case 'juz': return b === undefined && (a === undefined || int(a, 30));
  }
  return true;
}

export const config = {matcher: ['/surah', '/surah/:path*', '/tafseer/:path*', '/videos/:path*', '/quiz/:path*', '/mushaf/:path*', '/juz/:path*']};
