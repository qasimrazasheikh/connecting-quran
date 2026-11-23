/**
 * Fills the catalogue with what the site already offers: the tafseer editions (tafsir_api + QuranEnc) and the two
 * lecture series. Safe to re-run: existing rows (matched by slug) are left alone, so the curator's edits survive (the one
 * exception: Arabic/Urdu names still in the seed's old English spelling are switched to their own script).
 * Run: npm run db:seed
 */
import {and, eq} from 'drizzle-orm';
import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';
import {sources} from '../lib/db/schema.ts';
import {QE_EDITION, TAFSIR_HIDE, TAFSIR_RENAME, VIDEO_SOURCES} from '../lib/meta.ts';
import {TAFSIR_NATIVE} from '../lib/tafsir-names.ts';
import {EQURAN} from '../lib/eql-sources.ts';

type NewSource = typeof sources.$inferInsert;
const url = process.env.DATABASE_URL?.trim();
if (!url) throw new Error('DATABASE_URL is not set (add it to .env.local)');
const db = drizzle({client: neon(url)});
const TAFSIR_API = process.env.TAFSIR_API ?? 'https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir';

const SCHOOL: Record<string, NewSource['school']> = {
  'en-tafsir-maarif-ul-quran': 'deobandi', 'ur-tafsir-bayan-ul-quran': 'deobandi', 'tafsir-bayan-ul-quran': 'deobandi',
  'fath-al-bayan-li-al-qanuji': 'ahle-hadith',
  'ar-tafsir-as-saadi': 'salafi', 'ar-tafseer-al-saddi': 'salafi', 'ur-tafsir-as-saadi-urdu': 'salafi', 'tafsir-ibn-uthaymeen': 'salafi',
  'adwa-al-bayan': 'salafi', 'abu-bakr-jabir-al-jazairi': 'salafi', 'ar-tafsir-muyassar': 'salafi',
  'en-tafsir-al-mukhtasar': 'general', 'ar-tafsir-al-mukhtasar': 'general', 'tadabbur-wa-amal': 'general', 'ar-tafsir-al-jami-al-wajiz': 'general',
  'asseraj-fi-bayan-gharib-alquran': 'general', 'al-i-rab-al-muyassar': 'general', 'i-rab-al-quran-li-al-darwish': 'general',
  'alrab-al-quran-li-da-as': 'general', 'al-muyassar-fi-al-gharib': 'general', 'al-jadwal-fi-i-rab-al-quran': 'general',
  'tahlil-kalimat-al-qur-an': 'general', 'al-dur-al-masun-lil-samin-al-halabi': 'general', 'al-qira-at-al-mawsoo-ah-al-qur-aniyyah': 'general',
  'al-nashr-li-ibn-al-jazari': 'general', 'ayah-dependency-graphs': 'general',
};
/** Need the curator's decision before they go live (outside the four allowed schools, or doubtful attribution). */
const PENDING: Record<string, string> = {
  'en-kashani-tafsir': 'Sufi esoteric (ishari) tafseer',
  'en-al-qushairi-tafsir': 'Sufi esoteric (ishari) tafseer',
  'en-tafsir-al-tustari': 'Sufi esoteric (ishari) tafseer',
  'en-kashf-al-asrar-tafsir': 'Sufi esoteric (ishari) tafseer',
  'al-kashshaf-al-zamakhshari': "Zamakhshari was Mu'tazili; the work is valued for its Arabic but has Mu'tazili theology",
  'tazkiru-quran-ur': 'Maulana Wahiduddin Khan (modernist; outside the four schools)',
  'tazkirul-quran-en': 'Maulana Wahiduddin Khan (modernist; outside the four schools)',
  'ar-tafseer-tanwir-al-miqbas': 'Attributed to Ibn Abbas through a weak chain (al-Kalbi)',
  'en-tafsir-ibn-abbas': 'Attributed to Ibn Abbas through a weak chain (al-Kalbi)',
  'ayah-dependency-graphs': 'Grammar data rather than a commentary',
};
const LANG: Record<string, NewSource['lang']> = {arabic: 'ar', urdu: 'ur', english: 'en'};

const REQUESTED = new Set(['tafheemulquran', 'tafheemulquranen']);
/** The eQuranLibrary works (lib/eql-sources.ts) in Urdu script: [name, author] by path. */
const EQL_UR: Record<string, [string, string]> = {
  ibnekaseer: ['تفسیر ابن کثیر', 'حافظ ابن کثیر (اردو: مولانا محمد جوناگڑھی)'],
  tafheemulquran: ['تفہیم القرآن', 'سید ابو الاعلیٰ مودودی'],
  maarifulquran: ['معارف القرآن', 'مفتی محمد شفیع'],
  tadabburequran: ['تدبر قرآن', 'مولانا امین احسن اصلاحی'],
  ahsanulbayan: ['احسن البیان', 'حافظ صلاح الدین یوسف'],
  aasantarjumaquran: ['آسان ترجمۂ قرآن', 'مفتی محمد تقی عثمانی'],
  fizilalalquran: ['فی ظلال القرآن', 'سید قطب'],
  usmani: ['تفسیر عثمانی', 'مولانا شبیر احمد عثمانی'],
  bayanulquran: ['بیان القرآن', 'ڈاکٹر اسرار احمد'],
  taiseerulquran: ['تیسیر القرآن', 'مولانا عبدالرحمٰن کیلانی'],
  majidi: ['تفسیر ماجدی', 'مولانا عبدالماجد دریابادی'],
  jalalain: ['تفسیر جلالین', 'جلال الدین محلی و جلال الدین سیوطی'],
  mazhari: ['تفسیر مظہری', 'قاضی ثناء اللہ پانی پتی'],
  ibneabbas: ['تفسیر ابن عباس', 'اردو: حافظ محمد سعید احمد عاطف'],
  alquranalkareem: ['القرآن الکریم', 'مولانا عبدالسلام بھٹوی'],
  tibyanulquran: ['تبیان القرآن', 'علامہ غلام رسول سعیدی'],
  qurtubi: ['تفسیر قرطبی', 'ابو عبداللہ القرطبی'],
  duremansoor: ['در منثور', 'جلال الدین سیوطی'],
  mutaliyaquran: ['مطالعۂ قرآن', 'پروفیسر حافظ احمد یار'],
  anwarulbayan: ['انوار البیان', 'مولانا عاشق الٰہی مدنی'],
  maarifulqurankandhalwi: ['معارف القرآن (کاندھلوی)', 'مولانا محمد ادریس کاندھلوی'],
  jawahirulquran: ['جواہر القرآن', 'مولانا غلام اللہ خان'],
  mualimulirfan: ['معالم العرفان', 'مولانا عبدالحمید سواتی'],
  mufradatulquran: ['مفردات القرآن', 'امام راغب (اردو: مولانا عبدہ فیروزپوری)'],
  haqqani: ['تفسیر حقانی', 'مولانا محمد عبدالحق حقانی'],
  ruhulquran: ['روح القرآن', 'ڈاکٹر محمد اسلم صدیقی'],
  fahmulquran: ['فہم القرآن', 'میاں محمد جمیل'],
  madarikuttanzil: ['مدارک التنزیل', 'امام نسفی (اردو: فتح محمد جالندھری)'],
  baghwi: ['تفسیر بغوی', 'حسین بن مسعود البغوی'],
  ahsanuttafaseer: ['احسن التفاسیر', 'حافظ محمد سید احمد حسن'],
  saadi: ['تفسیر سعدی', 'عبدالرحمٰن بن ناصر السعدی'],
  ahkamulquran: ['احکام القرآن', 'امام ابوبکر جصاص'],
  madani: ['تفسیر مدنی', 'مولانا اسحاق مدنی'],
  mafhoomulquran: ['مفہوم القرآن', 'محترمہ رفعت اعجاز'],
  asratuttanzil: ['اسرار التنزیل', 'مولانا محمد اکرم اعوان'],
  ashrafulhawashi: ['اشرف الحواشی', 'شیخ محمد عبدہ الفلاح'],
  anwarulbayanali: ['انوار البیان (محمد علی)', 'محمد علی پی سی ایس'],
  baseeratequran: ['بصیرتِ قرآن', 'مولانا محمد آصف قاسمی'],
  mazharulquran: ['مظہر القرآن', 'شاہ محمد مظہر اللہ دہلوی'],
  tafseeralkitaab: ['تفسیر الکتاب', 'ڈاکٹر محمد عثمان'],
  sirajulbayan: ['سراج البیان', 'علامہ محمد حنیف ندوی'],
  kashfurrahman: ['کشف الرحمٰن', 'مولانا احمد سعید دہلوی'],
  bayanulquranthanvi: ['بیان القرآن (تھانوی)', 'مولانا اشرف علی تھانوی'],
  urwatulwusqa: ['عروۃ الوثقیٰ', 'علامہ عبدالکریم اثری'],
};
/** Every Arabic/Urdu source's name and author in its own script, by slug. */
const NATIVE: Record<string, [string, string]> = {
  ...TAFSIR_NATIVE, [QE_EDITION.slug]: [QE_EDITION.name, QE_EDITION.author_name ?? ''], 'link-quranohadith': ['مزید اردو تفاسیر', 'QuranoHadith.com'],
  ...Object.fromEntries(Object.entries(EQL_UR).map(([path, v]) => [`eql-${path}`, v])),
};

async function main(){
  const eds = await fetch(`${TAFSIR_API}/editions.json`).then(r => r.json()) as {slug: string; name: string; author_name: string; language_name: string; source?: string}[];
  const rows: NewSource[] = [{
    slug: QE_EDITION.slug, kind: 'tafseer', name: 'Ahsan-ul-Bayan', author: 'Hafiz Salahuddin Yusuf (translation: Muhammad Junagarhi)', lang: 'ur',
    school: 'ahle-hadith', delivery: 'api', status: 'approved', sort: 1, homepage: 'https://quranenc.com/en/browse/urdu_junagarhi',
    attribution: 'QuranEnc · Rowwad Translation Center', notes: 'Licence to confirm against the QuranEnc terms of use.',
  }];
  eds.filter(e => LANG[e.language_name.toLowerCase()]).forEach((e, i) => {
    const hidden = TAFSIR_HIDE.has(e.slug);
    rows.push({
      slug: e.slug, kind: 'tafseer', name: TAFSIR_RENAME[e.slug] || e.name, author: e.author_name === e.name ? '' : e.author_name,
      lang: LANG[e.language_name.toLowerCase()], school: SCHOOL[e.slug] || 'classical', delivery: 'api', sort: 10 + i,
      status: hidden ? 'hidden' : PENDING[e.slug] ? 'pending' : 'approved', homepage: e.source || '',
      notes: hidden ? 'Duplicate of the tarteel.ai / quran.com edition of the same work, which is kept.' : PENDING[e.slug] || '',
    });
  });
  VIDEO_SOURCES.forEach((v, i) => rows.push({
    slug: `video-${v.id}`, kind: 'video', name: v.name, description: v.desc, lang: v.lang === 'Urdu' ? 'ur' : 'en',
    school: v.id === 'israr' ? 'deobandi' : 'general', delivery: 'link', status: 'approved', sort: 1 + i,
    urlPattern: v.url('{surah}').replace(/%7Bsurah%7D/g, '{surah}'),
    notes: 'Until exact videos are added as entries, the link opens a YouTube search for the surah.',
  }));
  rows.push({
    slug: 'link-quranohadith', kind: 'link', name: 'More Urdu tafaseer', author: 'QuranoHadith.com', lang: 'ur', school: 'general',
    delivery: 'link', status: 'approved', sort: 50, homepage: 'https://quranohadith.com', description: 'QuranoHadith',
    urlPattern: 'https://quranohadith.com/alquran-tafseer/{s}/{a}',
  });
  EQURAN.forEach(([path, name, author, school, lang, pending], i) => rows.push({
    slug: `eql-${path}`, kind: 'link', name, author, lang: lang ?? 'ur', school, delivery: 'link', sort: 100 + i,
    status: pending ? 'pending' : 'approved', homepage: 'https://equranlibrary.com', description: 'eQuranLibrary',
    urlPattern: `https://equranlibrary.com/tafseer/${path}/{s}/{a}`,
    notes: pending || (REQUESTED.has(path) ? 'Included at the curator’s request.' : ''),
  }));
  // Arabic/Urdu sources are named in their own script. Rows already in the database switch over only while they still
  // carry the English name and author an earlier seed gave them, so the curator's edits stay.
  const was = new Map<string, [string, string]>();
  rows.forEach(r => { const n = NATIVE[r.slug]; if (n){ was.set(r.slug, [r.name, r.author ?? '']); [r.name, r.author] = n; } });
  const done = await db.insert(sources).values(rows).onConflictDoNothing({target: sources.slug}).returning({slug: sources.slug, status: sources.status});
  const by = (s: string) => done.filter(r => r.status === s).length;
  // QuranEnc's Urdu notes are Ahsan-ul-Bayan (checked against eQuranLibrary, 2:3); rename it unless the curator already edited the name
  const renamed = await db.update(sources).set({name: QE_EDITION.name, author: QE_EDITION.author_name, updatedAt: new Date()})
    .where(and(eq(sources.slug, QE_EDITION.slug), eq(sources.name, 'Junagarhi translation + tafseeri notes'))).returning({id: sources.id});
  if (renamed.length) console.log('Renamed the QuranEnc tafseer to Ahsan-ul-Bayan.');
  const added = new Set(done.map(r => r.slug));
  const native = await Promise.all([...was].filter(([slug]) => !added.has(slug)).map(([slug, [name, author]]) =>
    db.update(sources).set({name: NATIVE[slug][0], author: NATIVE[slug][1], updatedAt: new Date()})
      .where(and(eq(sources.slug, slug), eq(sources.name, name), eq(sources.author, author))).returning({id: sources.id})));
  if (native.flat().length) console.log(`Renamed ${native.flat().length} Arabic/Urdu sources into their own script.`);
  console.log(`Added ${done.length} of ${rows.length} sources (approved ${by('approved')}, pending ${by('pending')}, hidden ${by('hidden')}); ${rows.length - done.length} already existed.`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
