import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import AyahList from '@/components/AyahList';
import ErrorBox from '@/components/ErrorBox';
import TajweedKey from '@/components/TajweedKey';
import {ChangeTranslations, PlayAll} from '@/components/ReaderBits';
import {readSettings} from '@/lib/server-settings';
import {getSurahList} from '@/lib/quran';
import {surahView} from '@/lib/views';
import {QUIZ_PART, VIDEO_SOURCES} from '@/lib/meta';
import {btnGhost, btnYt, chip, cx, rhead} from '@/lib/ui';
import {Icon} from '@/components/Icons';

type P = PageProps<'/surah/[n]/[[...ayah]]'>;
const num = (n: string) => (/^\d{1,3}$/.test(n) && +n >= 1 && +n <= 114 ? +n : 0);

export async function generateMetadata({params}: P): Promise<Metadata> {
  const n = num((await params).n);
  try{ const s = (await getSurahList())[n - 1]; if (s) return {title: `Surah ${s.en} (${s.n}) — ${s.mean}`, description: `Read Surah ${s.en} (${s.ar}) with Urdu and English translation and tafseer. ${s.ayahs} ayahs, ${s.type}.`}; }catch{ /* default title */ }
  return {title: 'Surah'};
}

export default async function SurahPage({params}: P) {
  const {n: ns, ayah} = await params;
  const n = num(ns); if (!n) notFound();
  const focus = ayah?.[0] && /^\d+$/.test(ayah[0]) ? +ayah[0] : undefined;
  const {settings} = await readSettings();
  let v;
  try{ v = await surahView(n, settings); }catch(e){ return <ErrorBox msg={(e as Error).message} />; }
  const {info, surahs, meta, ayahs} = v;
  return (
    <>
      <section className={rhead}>
        <div className="font-amiri text-[40px] leading-normal text-brand" dir="rtl">{info.ar}</div>
        <h1 className="mb-0.5 mt-1 text-[22px] font-bold">{n}. {info.en}</h1>
        <div className="text-sm text-muted">{info.mean} · {info.ayahs} ayahs · {info.type}</div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {meta.trans.length ? meta.trans.map(t => <span key={t.id} className={chip}>{t.name}</span>) : <span className={chip}>Arabic only</span>}
          <ChangeTranslations />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <PlayAll label="Play surah" />
          <Link className={btnGhost} href={`/quiz/${n}/1`}>✎ Take quiz{info.ayahs > QUIZ_PART ? ` (${Math.ceil(info.ayahs / QUIZ_PART)} parts)` : ''}</Link>
        </div>
        <div className="mt-3.5 border-t border-dashed border-line pt-3">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted">Video lectures on this surah</div>
          <div className="flex flex-wrap justify-center gap-2">
            {VIDEO_SOURCES.map(vs => <a key={vs.id} className={btnYt} href={vs.url(info.en)} target="_blank" rel="noopener"><Icon.play /> {vs.name} <span className="font-normal opacity-80">· {vs.lang}</span></a>)}
          </div>
        </div>
        {n !== 1 && n !== 9 && <div className={cx(!meta.ip && 'no-ip')}><div className="bism" dir="rtl">{meta.bism}</div></div>}
      </section>
      {meta.tajweed && <TajweedKey />}
      <AyahList ayahs={ayahs} meta={meta} mode="surah" focus={focus} />
      <div className="mt-5 flex justify-between gap-2.5">
        {n > 1 ? <Link className={btnGhost} href={`/surah/${n - 1}`}>← {surahs[n - 2].en}</Link> : <span />}
        {n < 114 ? <Link className={btnGhost} href={`/surah/${n + 1}`}>{surahs[n].en} →</Link> : <span />}
      </div>
    </>
  );
}
