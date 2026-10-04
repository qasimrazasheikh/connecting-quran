/** Static reference data and constants (Madani 604-page layout, reciters, lecture sources, tajweed rules). */
export const BISM_UTH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';
export const SURAH_PAGE = [1,2,50,77,106,128,151,177,187,208,221,235,249,255,262,267,282,293,305,312,322,332,342,350,359,367,377,385,396,404,411,415,418,428,434,440,446,453,458,467,477,483,489,496,499,502,507,511,515,518,520,523,526,528,531,534,537,542,545,549,551,553,554,556,558,560,562,564,566,568,570,572,574,575,577,578,580,582,583,585,586,587,587,589,590,591,591,592,593,594,595,595,596,596,597,597,598,598,599,599,600,600,601,601,601,602,602,602,603,603,603,604,604,604];
export const JUZ_PAGE = [1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582];
export const JUZ_START: [number, number][] = [[1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],[9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],[29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]];

export const RECITERS = [
  {id:'ar.alafasy', name:'Mishary Rashid Alafasy', br:128},
  {id:'ar.abdulbasitmurattal', name:'Abdul Basit (Murattal)', br:192},
  {id:'ar.abdurrahmaansudais', name:'Abdur-Rahman As-Sudais', br:192},
  {id:'ar.saoodshuraym', name:'Saood Ash-Shuraym', br:64},
  {id:'ar.mahermuaiqly', name:'Maher Al-Muaiqly', br:128},
  {id:'ar.husary', name:'Mahmoud Khalil Al-Husary', br:128},
  {id:'ar.husarymujawwad', name:'Al-Husary (Mujawwad)', br:128},
  {id:'ar.minshawi', name:'Muhammad Siddiq Al-Minshawi', br:128},
  {id:'ar.hudhaify', name:'Ali Al-Hudhaify', br:128},
  {id:'ar.muhammadayyoub', name:'Muhammad Ayyoub', br:128},
];
export const AUDIO_CDN = process.env.NEXT_PUBLIC_AUDIO_CDN ?? 'https://cdn.islamic.network/quran/audio';
export const WORD_AUDIO_CDN = process.env.NEXT_PUBLIC_WORD_AUDIO_CDN ?? 'https://audio.qurancdn.com';
export const audioUrl = (reciterId: string, n: number) => { const r = RECITERS.find(x => x.id === reciterId) ?? RECITERS[0]; return `${AUDIO_CDN}/${r.br}/${r.id}/${n}.mp3`; };
const p3 = (n: number) => String(n).padStart(3, '0');
/** quran.com's own audio_url is shifted in many ayahs, so build the file name from surah/ayah/word number. */
export const wordAudioUrl = (s: number, a: number, w: number) => `${WORD_AUDIO_CDN}/wbw/${p3(s)}_${p3(a)}_${p3(w)}.mp3`;

const yt = (q: string) => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
export const VIDEO_SOURCES = [
  {id:'israr', name:'Dr Israr Ahmed', initials:'IA', lang:'Urdu', desc:'Bayan-ul-Quran lecture series', url: (surah: string) => yt(`Bayan ul Quran Dr Israr Ahmed Surah ${surah}`)},
  {id:'nak', name:'Nouman Ali Khan', initials:'NAK', lang:'English', desc:'Linguistic and thematic tafseer', url: (surah: string) => yt(`Nouman Ali Khan Surah ${surah}`)},
];
export const qohUrl = (s: number, a: number) => `https://quranohadith.com/alquran-tafseer/${s}/${a}`;
export const googleTranslateUrl = (t: string, l: string) => `https://translate.google.com/?sl=ar&tl=${l}&text=${encodeURIComponent(t)}&op=translate`;

export const TJ_RULES: [string, string, string][] = [['h','Hamzat al-wasl (silent)','همزة الوصل'],['l','Lām shamsiyyah (silent)','لام شمسية'],['s','Silent letter','حرف ساكت'],['n','Madd — 2 counts','مد طبيعي'],['p','Madd — 2, 4 or 6 counts','مد جائز'],['o','Madd — 4–5 counts','مد واجب'],['m','Madd — 6 counts','مد لازم'],['q','Qalqalah','قلقلة'],['g','Ghunnah','غنة'],['f','Ikhfāʾ','إخفاء'],['c','Ikhfāʾ shafawī','إخفاء شفوي'],['i','Iqlāb','إقلاب'],['a','Idghām with ghunnah','إدغام بغنة'],['u','Idghām without ghunnah','إدغام بلا غنة'],['w','Idghām shafawī','إدغام شفوي'],['d','Idghām mutajānisayn','إدغام متجانسين'],['b','Idghām mutaqāribayn','إدغام متقاربين']];

export type TransEdition = {identifier: string; language: string; englishName: string; name?: string; direction?: string};
export const FALLBACK_TRANS: TransEdition[] = [
  {identifier:'ur.jalandhry',language:'ur',englishName:'Fateh Muhammad Jalandhry',direction:'rtl'},
  {identifier:'ur.junagarhi',language:'ur',englishName:'Muhammad Junagarhi',direction:'rtl'},
  {identifier:'ur.maududi',language:'ur',englishName:"Abul A'ala Maududi",direction:'rtl'},
  {identifier:'ur.ahmedali',language:'ur',englishName:'Ahmed Ali',direction:'rtl'},
  {identifier:'ur.qadri',language:'ur',englishName:'Tahir ul Qadri',direction:'rtl'},
  {identifier:'en.sahih',language:'en',englishName:'Saheeh International',direction:'ltr'},
  {identifier:'en.pickthall',language:'en',englishName:'Pickthall',direction:'ltr'},
  {identifier:'en.yusufali',language:'en',englishName:'Yusuf Ali',direction:'ltr'},
  {identifier:'en.hilali',language:'en',englishName:'Hilali & Khan',direction:'ltr'},
  {identifier:'en.maududi',language:'en',englishName:'Maududi',direction:'ltr'},
  {identifier:'en.asad',language:'en',englishName:'Muhammad Asad',direction:'ltr'},
];
export type TafsirEdition = {slug: string; name: string; language_name: string; author_name?: string};
export const QE_SLUG = 'qe-urdu-junagarhi';
export const QE_EDITION: TafsirEdition = {slug: QE_SLUG, name: 'Junagarhi translation + tafseeri notes', language_name: 'urdu', author_name: 'QuranEnc · Rowwad Translation Center'};
export const FALLBACK_TAFSIR: TafsirEdition[] = [
  QE_EDITION,
  {slug:'en-tafisr-ibn-kathir',name:'Tafsir Ibn Kathir (abridged)',language_name:'english',author_name:'Ibn Kathir'},
  {slug:'en-tafsir-maarif-ul-quran',name:'Maarif-ul-Quran',language_name:'english',author_name:'Mufti Muhammad Shafi'},
  {slug:'en-al-jalalayn',name:'Al-Jalalayn',language_name:'english',author_name:'Al-Mahalli & As-Suyuti'},
  {slug:'ur-tafseer-ibn-e-kaseer',name:'Tafseer Ibn-e-Kaseer',language_name:'urdu',author_name:'Ibn Kathir'},
  {slug:'ur-tafsir-bayan-ul-quran',name:'Bayan ul Quran',language_name:'urdu',author_name:'Dr. Israr Ahmad'},
  {slug:'ar-tafsir-muyassar',name:'Tafsir Muyassar',language_name:'arabic',author_name:'King Fahd Complex'},
];
/** Editions in the tafsir source that are broken (every ayah 404) or exact duplicates. */
export const TAFSIR_HIDE = new Set(['ur-tafsir-fe-zalul-quran-syed-qatab','tafsir-bayan-ul-quran','tazkirul-quran-en','tazkiru-quran-ur']);
export const TAFSIR_RENAME: Record<string, string> = {'tafseer-ibn-e-kaseer-urdu':'Tafsir Ibn Kathir (fuller version)','tafsir-al-jalalayn':'Tafsir Al Jalalayn (alt. English)'};
export const QUIZ_PART = 30;
export const QUIZ_LEN = 10;
export const langLabel = (l?: string) => ({english:'English', urdu:'Urdu', arabic:'Arabic'} as Record<string, string>)[(l || '').toLowerCase()] || l || '';
export const arNum = (n: number | string) => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[+d]);
