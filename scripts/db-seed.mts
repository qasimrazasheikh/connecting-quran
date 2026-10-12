/**
 * Fills the catalogue with what the site already offers: the tafseer editions (tafsir_api + QuranEnc) and the two
 * lecture series. Safe to re-run: existing rows (matched by slug) are left alone, so the curator's edits survive.
 * Run: npm run db:seed
 */
import {and, eq} from 'drizzle-orm';
import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';
import {sources} from '../lib/db/schema.ts';
import {QE_EDITION, TAFSIR_HIDE, TAFSIR_RENAME, VIDEO_SOURCES} from '../lib/meta.ts';

type NewSource = typeof sources.$inferInsert;
const url = process.env.DATABASE_URL?.trim();
if (!url) throw new Error('DATABASE_URL is not set (add it to .env.local)');
const db = drizzle({client: neon(url)});
const TAFSIR_API = process.env.TAFSIR_API ?? 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir';

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

/**
 * eQuranLibrary.com: 46 tafseers (mostly Urdu), linked per ayah. Their text is not copied (copyrighted, no API).
 * [path name, title, author, school, lang?, pending reason?] — order as on their "all tafaseer" page.
 */
type EQL = [string, string, string, NewSource['school'], ('ur' | 'en')?, string?];
const EQURAN: EQL[] = [
  ['ibnekaseer', 'Tafseer Ibn-e-Kaseer', 'Ibn Kathir (Urdu: Maulana Muhammad Junagarhi)', 'classical'],
  ['tafheemulquran', 'Tafheem-ul-Quran', 'Syed Abul Ala Maududi', 'general'],
  ['maarifulquran', 'Maarif-ul-Quran', 'Mufti Muhammad Shafi', 'deobandi'],
  ['tadabburequran', 'Tadabbur-e-Quran', 'Maulana Amin Ahsan Islahi', 'general', 'ur', 'Islahi (Farahi school); outside the four schools'],
  ['ahsanulbayan', 'Ahsan-ul-Bayan', 'Hafiz Salahuddin Yusuf', 'ahle-hadith'],
  ['aasantarjumaquran', 'Aasan Quran', 'Mufti Muhammad Taqi Usmani', 'deobandi'],
  ['fizilalalquran', 'Fi Zilal al-Quran', 'Syed Qutb', 'general', 'ur', 'Sayyid Qutb (Ikhwan); outside the four schools'],
  ['usmani', 'Tafseer-e-Usmani', 'Maulana Shabbir Ahmad Usmani', 'deobandi'],
  ['bayanulquran', 'Bayan-ul-Quran', 'Dr. Israr Ahmad', 'deobandi'],
  ['taiseerulquran', 'Taiseer-ul-Quran', 'Maulana Abdul Rahman Kilani', 'ahle-hadith'],
  ['majidi', 'Tafseer-e-Majidi', 'Maulana Abdul Majid Daryabadi', 'deobandi'],
  ['jalalain', 'Tafseer-e-Jalalain', 'Jalal al-Din al-Mahalli & al-Suyuti', 'classical'],
  ['mazhari', 'Tafseer-e-Mazhari', 'Qazi Thanaullah Panipati', 'classical'],
  ['ibneabbas', 'Tafseer Ibn-e-Abbas', 'Urdu: Hafiz Muhammad Saeed Ahmad Atif', 'classical', 'ur', 'Attributed to Ibn Abbas through a weak chain (al-Kalbi)'],
  ['alquranalkareem', 'Al-Quran al-Kareem', 'Maulana Abdus Salam Bhattawi', 'ahle-hadith'],
  ['tibyanulquran', 'Tibyan-ul-Quran', 'Allama Ghulam Rasool Saeedi', 'barelvi'],
  ['qurtubi', 'Tafseer al-Qurtubi', 'Abu Abdullah al-Qurtubi', 'classical'],
  ['duremansoor', 'Dur-e-Mansoor', 'Jalal al-Din al-Suyuti', 'classical'],
  ['mutaliyaquran', 'Mutaliya-e-Quran', 'Prof. Hafiz Ahmad Yar', 'deobandi'],
  ['anwarulbayan', 'Anwar-ul-Bayan', 'Maulana Ashiq Ilahi Madani', 'deobandi'],
  ['maarifulqurankandhalwi', 'Maarif-ul-Quran (Kandhlawi)', 'Maulana Muhammad Idris Kandhlawi', 'deobandi'],
  ['jawahirulquran', 'Jawahir-ul-Quran', 'Maulana Ghulam Ullah Khan', 'deobandi'],
  ['mualimulirfan', 'Muallim-ul-Irfan', 'Maulana Abdul Hameed Swati', 'deobandi'],
  ['mufradatulquran', 'Mufradat-ul-Quran', 'Imam Raghib (Urdu: Maulana Abduh Firozpuri)', 'classical'],
  ['haqqani', 'Tafseer-e-Haqqani', 'Maulana Muhammad Abdul Haq Haqqani', 'classical'],
  ['ruhulquran', 'Ruh-ul-Quran', 'Dr. Muhammad Aslam Siddiqi', 'general', 'ur', 'School not confirmed'],
  ['fahmulquran', 'Fahm-ul-Quran', 'Mian Muhammad Jameel', 'ahle-hadith'],
  ['madarikuttanzil', 'Madarik-ut-Tanzil', 'Imam al-Nasafi (Urdu: Fateh Muhammad Jalandhari)', 'classical'],
  ['baghwi', 'Tafseer-e-Baghawi', 'Husain ibn Masud al-Baghawi', 'classical'],
  ['ahsanuttafaseer', 'Ahsan-ut-Tafaseer', 'Hafiz Muhammad Syed Ahmad Hasan', 'ahle-hadith'],
  ['saadi', 'Tafseer-e-Saadi', 'Abdur Rahman ibn Nasir al-Saadi', 'salafi'],
  ['ahkamulquran', 'Ahkam-ul-Quran', 'Imam Abu Bakr al-Jassas', 'classical'],
  ['madani', 'Tafseer-e-Madani', 'Maulana Ishaq Madani', 'general'],
  ['mafhoomulquran', 'Mafhoom-ul-Quran', 'Mohtarma Rifat Ijaz', 'general', 'ur', 'School not confirmed'],
  ['asratuttanzil', 'Asrar-ut-Tanzil', 'Maulana Muhammad Akram Awan', 'deobandi'],
  ['ashrafulhawashi', 'Ashraf-ul-Hawashi', 'Sheikh Muhammad Abdul Falah', 'ahle-hadith'],
  ['anwarulbayanali', 'Anwar-ul-Bayan (Muhammad Ali)', 'Muhammad Ali PCS', 'general', 'ur', 'School not confirmed'],
  ['baseeratequran', 'Baseerat-e-Quran', 'Maulana Muhammad Asif Qasmi', 'deobandi'],
  ['mazharulquran', 'Mazhar-ul-Quran', 'Shah Muhammad Mazharullah Dehlvi', 'barelvi'],
  ['tafseeralkitaab', 'Tafseer-al-Kitaab', 'Dr. Muhammad Usman', 'general', 'ur', 'School not confirmed'],
  ['sirajulbayan', 'Siraj-ul-Bayan', 'Allama Muhammad Haneef Nadvi', 'ahle-hadith'],
  ['kashfurrahman', 'Kashf-ur-Rahman', 'Maulana Ahmad Saeed Dehlvi', 'deobandi'],
  ['bayanulquranthanvi', 'Bayan-ul-Quran (Thanvi)', 'Maulana Ashraf Ali Thanvi', 'deobandi'],
  ['urwatulwusqa', 'Urwatul-Wusqaa', 'Allama Abdul Karim Asri', 'general', 'ur', 'School not confirmed'],
  ['maarifulquranenglish', 'Maarif-ul-Quran', 'Mufti Muhammad Shafi', 'deobandi', 'en'],
  ['tafheemulquranen', 'Tafheem-ul-Quran', 'Syed Abul Ala Maududi', 'general', 'en'],
];
const REQUESTED = new Set(['tafheemulquran', 'tafheemulquranen']);

async function main(){
  const eds = await fetch(`${TAFSIR_API}/editions.json`).then(r => r.json()) as {slug: string; name: string; author_name: string; language_name: string; source?: string}[];
  const rows: NewSource[] = [{
    slug: QE_EDITION.slug, kind: 'tafseer', name: QE_EDITION.name, author: 'Muhammad Ibrahim Junagarhi', lang: 'ur',
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
  const done = await db.insert(sources).values(rows).onConflictDoNothing({target: sources.slug}).returning({slug: sources.slug, status: sources.status});
  const by = (s: string) => done.filter(r => r.status === s).length;
  // QuranEnc's Urdu notes are Ahsan-ul-Bayan (checked against eQuranLibrary, 2:3); rename it unless the curator already edited the name
  const renamed = await db.update(sources).set({name: 'Ahsan-ul-Bayan', author: 'Hafiz Salahuddin Yusuf (translation: Muhammad Junagarhi)', updatedAt: new Date()})
    .where(and(eq(sources.slug, QE_EDITION.slug), eq(sources.name, 'Junagarhi translation + tafseeri notes'))).returning({id: sources.id});
  if (renamed.length) console.log('Renamed the QuranEnc tafseer to Ahsan-ul-Bayan.');
  console.log(`Added ${done.length} of ${rows.length} sources (approved ${by('approved')}, pending ${by('pending')}, hidden ${by('hidden')}); ${rows.length - done.length} already existed.`);
}
main().catch(e => { console.error(e.message); process.exit(1); });
