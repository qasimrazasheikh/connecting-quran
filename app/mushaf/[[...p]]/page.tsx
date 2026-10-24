import {notFound} from 'next/navigation';
import ErrorBox from '@/components/ErrorBox';
import MushafView from '@/components/MushafView';
import {getAyahEditions} from '@/lib/quran';
import {readSettings} from '@/lib/server-settings';
import {mushafView} from '@/lib/views';
import {seo} from '@/lib/seo';

type P = PageProps<'/mushaf/[[...p]]'>;
/** The page to show: /mushaf/<1–604>, or the page holding ?at=18:19 (MushafView then tidies the address to /mushaf/<page>). */
async function pageOf({params, searchParams}: P) {
  const ps = (await params).p, raw = ps?.[0];
  if (ps && (ps.length > 1 || !/^\d{1,3}$/.test(raw!) || +raw! < 1 || +raw! > 604)) notFound();
  const at = String((await searchParams).at || '').match(/^(\d{1,3}):(\d{1,3})$/);
  const atPage = !raw && at ? await getAyahEditions(+at[1], +at[2], ['quran-uthmani']).then(d => d[0]?.page).catch(() => undefined) : undefined;
  return {p: atPage || (raw ? +raw : 1), at};
}
export async function generateMetadata(props: P) {
  const {p} = await pageOf(props);
  return seo(`/mushaf/${p}`, `Mushaf · Page ${p}`, `Page ${p} of the Quran as printed in the Mushaf, with recitation and tafseer for each ayah.`);
}
export default async function MushafPage(props: P) {
  const {p, at} = await pageOf(props);
  const {settings} = await readSettings();
  let v;
  try{ v = await mushafView(p, settings); }catch(e){ return <ErrorBox msg={(e as Error).message} />; }
  return <><h1 className="sr-only">Mushaf · Page {p}</h1><MushafView p={p} ayahs={v.ayahs} meta={v.meta} at={at ? `${+at[1]}:${+at[2]}` : ''} /></>;
}
