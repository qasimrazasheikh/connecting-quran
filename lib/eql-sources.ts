import type {SCHOOLS} from './db/enums';
type School = (typeof SCHOOLS)[number];

/**
 * eQuranLibrary.com: 46 tafseers (mostly Urdu), linked per ayah. No API: the Study panel pulls one ayah's note from
 * their page on demand (getEqlTafsir, cached a day) and credits them; nothing is stored in the database.
 * [path name, title, author, school, lang?, pending reason?] — order as on their "all tafaseer" page.
 */
type EQL = [string, string, string, School, ('ur' | 'en')?, string?];
export const EQURAN: EQL[] = [
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

/** English title and author by catalogue slug, for searching the tafseer list in English. */
export const EQL_EN: Record<string, string> = Object.fromEntries(EQURAN.map(([path, name, author]) => [`eql-${path}`, `${name} ${author}`]));
