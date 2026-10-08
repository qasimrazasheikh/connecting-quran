import ErrorBox from '@/components/ErrorBox';
import MushafView from '@/components/MushafView';
import {getAyahEditions} from '@/lib/quran';
import {readSettings} from '@/lib/server-settings';
import {mushafView} from '@/lib/views';

export async function generateMetadata({params}: PageProps<'/mushaf/[[...p]]'>) {
  const p = (await params).p?.[0];
  return {title: p ? `Mushaf · Page ${p}` : 'Mushaf'};
}
export default async function MushafPage({params, searchParams}: PageProps<'/mushaf/[[...p]]'>) {
  const raw = (await params).p?.[0];
  // /mushaf?at=18:19 shows the page that ayah is on (MushafView then tidies the address to /mushaf/<page>)
  const at = String((await searchParams).at || '').match(/^(\d{1,3}):(\d{1,3})$/);
  const atPage = !raw && at ? await getAyahEditions(+at[1], +at[2], ['quran-uthmani']).then(d => d[0]?.page).catch(() => undefined) : undefined;
  const p = Math.min(604, Math.max(1, atPage || (raw && /^\d+$/.test(raw) ? +raw : 1)));
  const {settings} = await readSettings();
  let v;
  try{ v = await mushafView(p, settings); }catch(e){ return <ErrorBox msg={(e as Error).message} />; }
  return <MushafView p={p} ayahs={v.ayahs} meta={v.meta} />;
}
