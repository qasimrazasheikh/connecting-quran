// Offline stand-in for the external Quran APIs, for local testing.
// Run: node tests/mock-api.mjs  (port 4010), then start Next with the env vars in tests/README.md.
import http from 'node:http';
const PORT = +(process.env.MOCK_PORT || 4010);
const BISM = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ';
const COUNT = n => n === 1 ? 7 : n === 2 ? 286 : n === 112 ? 4 : 5;
const surahs = Array.from({length: 114}, (_, i) => ({number: i + 1, name: 'سُورَةُ س' + (i + 1), englishName: 'Surah-' + (i + 1), englishNameTranslation: 'Meaning ' + (i + 1), numberOfAyahs: COUNT(i + 1), revelationType: 'Meccan'}));
const ed = id => ({identifier: id, language: id.split('.')[0] === 'quran' ? 'ar' : id.split('.')[0], englishName: 'Ed ' + id, direction: /^(ur|quran)/.test(id) ? 'rtl' : 'ltr'});
const V = ['كتاب', 'رحمة', 'صبر', 'علم', 'نور', 'هدى', 'قلب', 'ارض', 'سماء', 'ماء', 'شمس', 'قمر'];
// Real text for Al-Fatiha and Al-Ikhlas so the fonts and vowel marks can be checked by eye.
const REAL = {
  'quran:1': ['بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', 'مَٰلِكِ يَوْمِ ٱلدِّينِ', 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ'],
  'quran:112': ['قُلْ هُوَ ٱللَّهُ أَحَدٌ', 'ٱللَّهُ ٱلصَّمَدُ', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', 'وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ'],
  'en:1': ['In the name of Allah, the Entirely Merciful, the Especially Merciful.', '[All] praise is [due] to Allah, Lord of the worlds -', 'The Entirely Merciful, the Especially Merciful,', 'Sovereign of the Day of Recompense.', 'It is You we worship and You we ask for help.', 'Guide us to the straight path -', 'The path of those upon whom You have bestowed favor, not of those who have evoked [Your] anger or of those who are astray.'],
  'ur:1': ['شروع الله کا نام لے کر جو بڑا مہربان نہایت رحم والا ہے', 'سب طرح کی تعریف خدا ہی کو (سزاوار) ہے جو تمام مخلوقات کا پروردگار ہے', 'بڑا مہربان نہایت رحم والا', 'انصاف کے دن کا حاکم', '(اے پروردگار) ہم تیری ہی عبادت کرتے ہیں اور تجھ ہی سے مدد مانگتے ہیں', 'ہم کو سیدھے رستے چلا', 'ان لوگوں کے رستے جن پر تو اپنا فضل وکرم کرتا رہا نہ ان کے جن پر غصے ہوتا رہا اور نہ گمراہوں کے'],
};
function ayText(id, s, a){
  const b = a === 1 && s !== 1 ? BISM : '';
  const kind = id.startsWith('quran') ? 'quran' : id.split('.')[0];
  const real = REAL[`${kind}:${s}`]?.[a - 1];
  if (real && id === 'quran-tajweed' && s === 1 && a === 2) return 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِ[n[ي]نَ';
  if (real && id !== 'quran-tajweed') return (s === 112 && a === 1 ? b : '') + real;
  if (id === 'quran-tajweed') return b + 'ن[q[ص] عر[g:5[بي ن]ص ' + a;
  if (id.startsWith('quran')) return b + [0, 1, 2, 3, 4].map(j => V[(a * 3 + j + s) % V.length]).join(' ');
  return `translation ${id} of ${s}:${a}`;
}
const ay = (id, s, from, to) => { const out = []; for (let a = from; a <= to; a++) out.push({number: s * 1000 + a, numberInSurah: a, juz: 1, page: 2, text: ayText(id, s, a), surah: {number: s, name: 'سورة ' + s, englishName: 'Surah-' + s}}); return out; };
const json = (res, body, status = 200) => { res.writeHead(status, {'content-type': 'application/json'}); res.end(JSON.stringify(body)); };
const words = (k, lang) => { const [s, a] = k.split(':').map(Number); const t = ayText('quran-uthmani', s, a).replace(BISM, '').split(' ');
  return t.map((w, i) => ({char_type_name: 'word', text_indopak: i === 0 ? 'وَ هُوَ' : w, translation: {text: `${lang}-m${i + 1}`}, transliteration: {text: 'tr' + (i + 1)}})).concat([{char_type_name: 'end'}]); };
const pageKeys = pg => pg === 2 ? ['1:7', '2:1', '2:2'] : ['2:3', '2:4'];

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname), q = u.searchParams;
  let m;
  // ---- AlQuran Cloud (/cloud = /v1)
  if (p === '/cloud/surah') return json(res, {code: 200, data: surahs});
  if (p.startsWith('/cloud/edition')) return json(res, {code: 200, data: ['ur.jalandhry', 'ur.maududi', 'en.sahih', 'en.pickthall'].map(ed)});
  if ((m = p.match(/^\/cloud\/surah\/(\d+)\/editions\/(.+)$/))) { const s = +m[1]; return json(res, {code: 200, data: m[2].split(',').map(id => ({edition: ed(id), ayahs: ay(id, s, 1, COUNT(s))}))}); }
  if ((m = p.match(/^\/cloud\/juz\/(\d+)\/(.+)$/))) return json(res, {code: 200, data: {edition: ed(m[2]), ayahs: [...ay(m[2], 1, 1, 2), ...ay(m[2], 2, 1, 2)]}});
  if ((m = p.match(/^\/cloud\/page\/(\d+)\/(.+)$/))) { const id = m[2]; return json(res, {code: 200, data: {edition: ed(id), ayahs: pageKeys(+m[1]).map(k => { const [s, a] = k.split(':').map(Number); return ay(id, s, a, a)[0]; })}}); }
  if ((m = p.match(/^\/cloud\/ayah\/(\d+):(\d+)\/editions\/(.+)$/))) return json(res, {code: 200, data: m[3].split(',').map(id => ({edition: ed(id), text: ayText(id, +m[1], +m[2])}))});
  if ((m = p.match(/^\/cloud\/search\/([^/]+)\/all\/(.+)$/))) { if (m[1] === 'nothing') return json(res, {code: 404, data: 'Nothing'}, 404);
    return json(res, {code: 200, data: {count: 120, matches: Array.from({length: 120}, (_, k) => ({text: `text with ${m[1]} inside ${k + 1}`, numberInSurah: k + 1, surah: {number: 2, englishName: 'Surah-2'}}))}}); }
  // ---- Quran.com (/qc = /api/v4)
  if (p === '/qc/quran/verses/indopak'){
    let keys = [];
    if (q.get('page_number')) keys = pageKeys(+q.get('page_number'));
    else if (q.get('chapter_number')) { const n = +q.get('chapter_number'); keys = Array.from({length: COUNT(n)}, (_, k) => n + ':' + (k + 1)); }
    else if (q.get('juz_number')) keys = ['1:1', '1:2', '2:1', '2:2'];
    else keys = [q.get('verse_key')];
    return json(res, {verses: keys.map(k => ({verse_key: k, text_indopak: (k === '1:1' ? 'بِسۡمِ اللّٰہِ الرَّحۡمٰنِ الرَّحِیۡمِ' : 'وَ هُوَ ' + ayText('quran-uthmani', ...k.split(':').map(Number)).replace(BISM, '').split(' ').slice(1).join(' ')) + '​‏'}))});
  }
  if ((m = p.match(/^\/qc\/verses\/by_(chapter|juz|page)\/(\d+)$/))) {
    const n = +m[2], keys = m[1] === 'chapter' ? Array.from({length: COUNT(n)}, (_, k) => n + ':' + (k + 1)) : m[1] === 'page' ? pageKeys(n) : ['1:1', '1:2', '2:1', '2:2'];
    return json(res, {pagination: {next_page: null}, verses: keys.map(k => ({verse_key: k, words: words(k, q.get('language'))}))});
  }
  if ((m = p.match(/^\/qc\/verses\/by_key\/(\d+:\d+)$/))) return json(res, {verse: {words: words(m[1], q.get('language'))}});
  // ---- tafsir_api
  if (p === '/tafsir/editions.json') return json(res, [
    {slug: 'en-tafisr-ibn-kathir', name: 'Ibn Kathir', language_name: 'english', author_name: 'IK'},
    {slug: 'ur-tafseer-ibn-e-kaseer', name: 'IK Urdu', language_name: 'urdu', author_name: 'IK'},
    {slug: 'ur-tafsir-bayan-ul-quran', name: 'Bayan ul Quran', language_name: 'urdu', author_name: 'Dr. Israr Ahmad'},
    {slug: 'en-tafsir-maarif-ul-quran', name: 'Maarif', language_name: 'english', author_name: 'Shafi'},
    {slug: 'ar-tafsir-muyassar', name: 'Muyassar', language_name: 'arabic', author_name: 'KFC'},
    {slug: 'tafsir-bayan-ul-quran', name: 'Broken dup', language_name: 'urdu'}]);
  if ((m = p.match(/^\/tafsir\/([a-z0-9-]+)\/(\d+)\/(\d+)\.json$/))) {
    if (m[2] === '2' && m[3] === '4') { res.writeHead(404); return res.end('nf'); }
    if (m[1].startsWith('ur-')) return json(res, {text: 'آیت 1 يَسْـَٔلُوْنَكَ عَنِ الْاَنْفَالِ ط قُلِ الْاَنْفَالُ لِلّٰهِ یہاں مال غنیمت کے لیے لفظ انفال استعمال کیا گیا ہے۔'});
    if (m[1].startsWith('ar-')) return json(res, {text: 'الحمد لله رب العالمين، تفسير الآية ' + m[3]});
    return json(res, {text: '<p>Placeholder tafseer ' + m[2] + ':' + m[3] + '</p><script>alert(1)</script><p onclick="x()">two</p>'});
  }
  // ---- Indo-Pak backup, morphology, QuranEnc
  if (p.startsWith('/ipb/')) return json(res, {chapter: [{chapter: 1, verse: 1, text: 'IP 1:1'}]});
  if (p === '/morph.txt') { res.writeHead(200, {'content-type': 'text/plain'});
    return res.end('2:1:1:1\tكتاب\tN\tROOT:كتب|LEM:كِتَاب|M|NOM\n2:1:2:1\tوَ\tP\tCONJ|PREF|LEM:و\n2:1:2:2\tرحمة\tV\tPERF|(IV)|ROOT:رحم|LEM:رَحِمَ|3MP\n2:1:2:3\tهُم\tN\tSUFF|PRON:3MP\n2:1:3:1\tصبر\tN\tROOT:صبر|LEM:صَبْر|M|GEN\n1:2:1:1\tٱلْ\tP\tDET|PREF|LEM:ال\n1:2:1:2\tحَمْدُ\tN\tROOT:حمد|LEM:حَمْد|M|NOM\n1:2:2:1\tلِ\tP\tP|PREF|LEM:ل\n1:2:2:2\tلَّهِ\tN\tPN|ROOT:أله|LEM:{ll~ah|GEN\n1:2:3:1\tرَبِّ\tN\tROOT:ربب|LEM:رَبّ|M|GEN\n'); }
  if ((m = p.match(/^\/qe\/translation\/aya\/urdu_junagarhi\/(\d+)\/(\d+)$/))) return json(res, {result: {translation: `placeholder translation ${m[1]}:${m[2]}`, footnotes: m[2] === '2' ? '' : 'placeholder note line 1\nplaceholder note line 2'}});
  res.writeHead(404); res.end('no mock for ' + p);
}).listen(PORT, () => console.log('mock api on :' + PORT));
