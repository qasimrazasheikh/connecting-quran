import Link from 'next/link';
import {notFound} from 'next/navigation';
import AyahList from '@/components/AyahList';
import ErrorBox from '@/components/ErrorBox';
import TajweedKey from '@/components/TajweedKey';
import {PlayAll} from '@/components/ReaderBits';
import {readSettings} from '@/lib/server-settings';
import {juzView} from '@/lib/views';
import {arNum} from '@/lib/meta';
import {btnGhost, rhead} from '@/lib/ui';

export async function generateMetadata({params}: PageProps<'/juz/[j]'>) {
  return {title: `Juz ${(await params).j}`};
}
export default async function JuzPage({params}: PageProps<'/juz/[j]'>) {
  const js = (await params).j;
  const j = /^\d{1,2}$/.test(js) && +js >= 1 && +js <= 30 ? +js : 0; if (!j) notFound();
  const {settings} = await readSettings();
  let v;
  try{ v = await juzView(j, settings); }catch(e){ return <ErrorBox msg={(e as Error).message} />; }
  return (
    <>
      <section className={rhead}>
        <div className="font-amiri text-[40px] leading-normal text-brand" dir="rtl">الجزء {arNum(j)}</div>
        <h1 className="mb-0.5 mt-1 text-[22px] font-bold">Juz {j}</h1>
        <div className="text-sm text-muted">{v.ayahs.length} ayahs</div>
        <div className="mt-3 flex flex-wrap justify-center gap-2"><PlayAll label="Play juz" /></div>
      </section>
      {v.meta.tajweed && <TajweedKey />}
      <AyahList ayahs={v.ayahs} meta={v.meta} mode="juz" />
      <div className="mt-5 flex justify-between gap-2.5">
        {j > 1 ? <Link className={btnGhost} href={`/juz/${j - 1}`}>← Juz {j - 1}</Link> : <span />}
        {j < 30 ? <Link className={btnGhost} href={`/juz/${j + 1}`}>Juz {j + 1} →</Link> : <span />}
      </div>
    </>
  );
}
