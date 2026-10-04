import ErrorBox from '@/components/ErrorBox';
import MushafView from '@/components/MushafView';
import {readSettings} from '@/lib/server-settings';
import {mushafView} from '@/lib/views';

export async function generateMetadata({params}: PageProps<'/mushaf/[[...p]]'>) {
  const p = (await params).p?.[0];
  return {title: p ? `Mushaf · Page ${p}` : 'Mushaf'};
}
export default async function MushafPage({params}: PageProps<'/mushaf/[[...p]]'>) {
  const raw = (await params).p?.[0];
  const p = Math.min(604, Math.max(1, (raw && /^\d+$/.test(raw) ? +raw : 1)));
  const {settings} = await readSettings();
  let v;
  try{ v = await mushafView(p, settings); }catch(e){ return <ErrorBox msg={(e as Error).message} />; }
  return <MushafView p={p} ayahs={v.ayahs} meta={v.meta} />;
}
