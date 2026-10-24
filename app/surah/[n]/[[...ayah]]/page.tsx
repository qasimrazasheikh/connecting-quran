import Link from 'next/link';
import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import AyahList from '@/components/AyahList';
import ReaderPicker from '@/components/ReaderPicker';
import ErrorBox from '@/components/ErrorBox';
import SurahName from '@/components/SurahName';
import TajweedKey from '@/components/TajweedKey';
import {ChangeTranslations, PlayAll} from '@/components/ReaderBits';
import {readSettings} from '@/lib/server-settings';
import {getSurahList} from '@/lib/quran';
import {seo} from '@/lib/seo';
import {surahView} from '@/lib/views';
import {QUIZ_PART} from '@/lib/meta';
import {videoCards} from '@/lib/catalog';
import {btnGhost, btnYt, cx, rhead} from '@/lib/ui';
import {Icon} from '@/components/Icons';

type P = PageProps<'/surah/[n]/[[...ayah]]'>;
/** Smaller buttons for the header's action row, and a thin divider between its groups (hidden once the row wraps on phones). */
const small = '!px-3 !py-1.5 !text-[13px]';
const sep = 'mx-1 hidden h-5 w-px bg-line md:block';
const num = (n: string) => (/^\d{1,3}$/.test(n) && +n >= 1 && +n <= 114 ? +n : 0);

export async function generateMetadata({params}: P): Promise<Metadata> {
  // checked here too: metadata is worked out before the page starts streaming, so a bad address still gets a real 404
  const n = num((await params).n); if (!n) notFound();
  // /surah/2/255 shows the whole surah, so every ayah address names /surah/2 as the page to index
  const s = (await getSurahList())[n - 1];
  return seo(`/surah/${n}`, `Surah ${s.en} (${s.n}) — ${s.mean}`, `Read Surah ${s.en} (${s.ar}) with Urdu and English translation and tafseer. ${s.ayahs} ayahs, ${s.type}.`);
}

export default async function SurahPage({params}: P) {
  const {n: ns, ayah} = await params;
  const n = num(ns); if (!n) notFound();
  const focus = ayah?.[0] && /^\d+$/.test(ayah[0]) ? +ayah[0] : undefined;
  const {settings} = await readSettings();
  let v;
  try{ v = await surahView(n, settings); }catch(e){ return <ErrorBox msg={(e as Error).message} />; }
  const {info, surahs, meta, ayahs} = v;
  const videos = await videoCards(n, null, info.en);
  return (
    <>
      <ReaderPicker s={n} focus={focus}><ChangeTranslations className={cx(btnGhost, small)} /></ReaderPicker>
      {/* kept short so the first ayahs show on a laptop screen: English name, actions, Arabic name (right, as Arabic reads);
          on phones the two names share the first line and the actions wrap below */}
      <section className={cx(rhead, '!py-3')}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 text-left">
          <div className="order-1 min-w-0 flex-1 md:flex-none">
            <h1 className="text-[19px] font-bold leading-tight">{n}. {info.en}</h1>
            <div className="text-[13px] text-muted">{info.mean} · {info.ayahs} ayahs · {info.type}</div>
          </div>
          <div className="order-2 text-[30px] leading-none text-brand md:order-3"><SurahName n={n} prefix /></div>
          <div className="order-3 flex basis-full flex-wrap items-center justify-center gap-1.5 md:order-2 md:basis-auto md:flex-1">
            <PlayAll label="Play surah" className={small} />
            <Link className={cx(btnGhost, small)} href={`/quiz/${n}/1`}>✎ Quiz{info.ayahs > QUIZ_PART ? ` (${Math.ceil(info.ayahs / QUIZ_PART)} parts)` : ''}</Link>
            {videos.length > 0 && <span className={sep} />}
            {/* a whole-surah video the curator added, else the series' search link */}
            {videos.map(vs => <a key={vs.id} className={cx(btnYt, small)} href={vs.links.find(l => l.whole)?.url || vs.searchUrl} target="_blank" rel="noopener" title={`${vs.name}: video lectures on Surah ${info.en} (${vs.lang})`}><Icon.play /> {vs.name} <span className="font-normal opacity-80 max-sm:hidden">· {vs.lang}</span></a>)}
          </div>
        </div>
        {n !== 1 && n !== 9 && <div className={cx(!meta.ip && 'no-ip')}><div className="bism !mb-0 !mt-2" dir="rtl">{meta.bism}</div></div>}
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
