import {AUDIO_CDN, isQoh, MIN_APP_VERSION, RECITERS, WORD_AUDIO_CDN} from '@/lib/meta';
import {getTafsirEditions, getTransEditions, transMeta} from '@/lib/quran';
import {NextResponse} from 'next/server';

/**
 * Everything the mobile app can offer, in one call: translations, tafseers (with the route that serves each), reciters
 * (with how to build their audio addresses) and the oldest app version still supported. The app ships the Arabic and
 * word data; it fetches the rest by these lists. Addresses starting with / are on this site.
 */
export async function GET() {
  const [trans, tafsir] = await Promise.all([getTransEditions(), getTafsirEditions()]);
  return NextResponse.json({
    minAppVersion: MIN_APP_VERSION,
    translations: trans.map(e => ({...transMeta(trans, e.identifier), english: e.englishName})),
    tafsirs: tafsir.map(e => ({
      slug: e.slug, name: e.name, lang: e.language_name.toLowerCase(), author: e.author_name ?? '', en: e.en ?? '',
      // QuranoHadith's page holds several works and is read whole (/api/qoh/s/a); the rest, eQuranLibrary's included,
      // come one ayah at a time from /api/tafsir/{slug}/s/a
      route: e.url && isQoh(e.url) ? 'qoh' : 'tafsir',
    })),
    // {n}: ayah number in the whole Quran; {sss}{aaa}: surah and ayah, three digits each. Surah-file reciters give a
    // timings file instead: each surah's audio address and every ayah's start in it.
    reciters: RECITERS.map(r => ({id: r.id, name: r.name,
      ...(r.timed ? {timings: `/timings/${r.timed}.json`} : {audio: r.dir ? `${r.dir}/{sss}{aaa}.mp3` : `${AUDIO_CDN}/${r.br}/${r.id}/{n}.mp3`})})),
    wordAudio: `${WORD_AUDIO_CDN}/wbw/{sss}_{aaa}_{www}.mp3`,
  }, {headers: {'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'}});
}
