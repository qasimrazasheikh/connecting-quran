import {readSettings} from '@/lib/server-settings';
import {mushafView} from '@/lib/views';
import {NextResponse} from 'next/server';
/**
 * One Mushaf page's ayahs, for the Mushaf's endless scroll (the page it opens on comes with the HTML). Built from the
 * reader's settings cookie, so never stored by a shared or browser cache: a changed setting must show at once.
 */
export async function GET(_req: Request, ctx: RouteContext<'/api/mushaf/[p]'>) {
  const {p} = await ctx.params;
  if (!/^\d{1,3}$/.test(p) || +p < 1 || +p > 604) return NextResponse.json({error: 'No such page'}, {status: 404});
  try{
    const {settings} = await readSettings();
    const v = await mushafView(+p, settings);
    return NextResponse.json({ayahs: v.ayahs}, {headers: {'Cache-Control': 'private, no-store'}});
  }catch(e){ return NextResponse.json({error: (e as Error).message}, {status: 502}); }
}
