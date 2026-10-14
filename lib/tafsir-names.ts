/**
 * Arabic and Urdu tafseers are named in their own script: [name, author] by edition slug. The tafseer source only gives
 * English transliterations. Used for the built-in list and by the seed; with a database, curators can still edit any name.
 * An empty author means the work is known by its title alone.
 */
import type {TafsirEdition} from './meta';

export const TAFSIR_NATIVE: Record<string, [string, string]> = {
  // Urdu
  'ur-tafseer-ibn-e-kaseer': ['تفسیر ابن کثیر', 'حافظ ابن کثیر'],
  'tafseer-ibn-e-kaseer-urdu': ['تفسیر ابن کثیر (مفصل نسخہ)', 'حافظ ابن کثیر'],
  'tafsir-bayan-ul-quran': ['بیان القرآن', 'ڈاکٹر اسرار احمد'],
  'ur-tafsir-bayan-ul-quran': ['بیان القرآن', 'ڈاکٹر اسرار احمد'],
  'tafsir-fe-zalul-quran-syed-qatab': ['فی ظلال القرآن', 'سید قطب'],
  'ur-tafsir-fe-zalul-quran-syed-qatab': ['فی ظلال القرآن', 'سید قطب'],
  'tazkiru-quran-ur': ['تذکیر القرآن', 'مولانا وحید الدین خان'],
  'ur-tazkirul-quran': ['تذکیر القرآن', 'مولانا وحید الدین خان'],
  'ur-tafsir-as-saadi-urdu': ['تفسیر سعدی', 'عبدالرحمٰن بن ناصر السعدی'],
  // Arabic
  'ar-tafsir-muyassar': ['التفسير الميسر', 'مجمع الملك فهد'],
  'ar-tafsir-al-mukhtasar': ['المختصر في تفسير القرآن الكريم', 'مركز تفسير للدراسات القرآنية'],
  'ar-tafsir-ibn-kathir': ['تفسير ابن كثير', 'الحافظ ابن كثير'],
  'ar-tafsir-al-tabari': ['جامع البيان (تفسير الطبري)', 'ابن جرير الطبري'],
  'ar-tafseer-al-qurtubi': ['الجامع لأحكام القرآن (تفسير القرطبي)', 'أبو عبد الله القرطبي'],
  'ar-tafsir-al-baghawi': ['معالم التنزيل (تفسير البغوي)', 'الحسين بن مسعود البغوي'],
  'ar-tafsir-al-wasit': ['التفسير الوسيط', 'محمد سيد طنطاوي'],
  'ar-tafsir-as-saadi': ['تيسير الكريم الرحمن (تفسير السعدي)', 'عبد الرحمن بن ناصر السعدي'],
  'ar-tafseer-al-saddi': ['تفسير السعدي (نسخة أخرى)', 'عبد الرحمن بن ناصر السعدي'],
  'ar-tafsir-al-jalalayn': ['تفسير الجلالين', 'جلال الدين المحلي وجلال الدين السيوطي'],
  'ar-tafseer-tahrir-al-tanwir': ['التحرير والتنوير', 'محمد الطاهر ابن عاشور'],
  'ar-tafseer-tanwir-al-miqbas': ['تنوير المقباس من تفسير ابن عباس', 'منسوب إلى ابن عباس'],
  'ar-tafsir-al-tha-alibi': ['الجواهر الحسان (تفسير الثعالبي)', 'عبد الرحمن الثعالبي'],
  'ar-tafsir-al-tha-alibi-527': ['تفسير الثعالبي (نسخة أخرى)', 'عبد الرحمن الثعالبي'],
  'ar-tafsir-al-jami-al-wajiz': ['الجامع الوجيز', 'د. أيمن فتحي العامر'],
  'asseraj-fi-bayan-gharib-alquran': ['السراج في بيان غريب القرآن', 'محمد بن عبد العزيز الخضيري'],
  'al-i-rab-al-muyassar': ['الإعراب الميسر', ''],
  'tafsir-ibn-abi-zamanin': ['تفسير ابن أبي زمنين', 'ابن أبي زمنين'],
  'abu-bakr-jabir-al-jazairi': ['أيسر التفاسير', 'أبو بكر جابر الجزائري'],
  'i-rab-al-quran-li-al-darwish': ['إعراب القرآن وبيانه', 'محيي الدين الدرويش'],
  'nazam-al-durar-al-biqa-i': ['نظم الدرر في تناسب الآيات والسور', 'برهان الدين البقاعي'],
  'al-muharrar-al-wajiz-ibn-atiyyah': ['المحرر الوجيز', 'ابن عطية الأندلسي'],
  'al-basit': ['التفسير البسيط', 'الواحدي'],
  'alrab-al-quran-li-da-as': ['إعراب القرآن الكريم', 'الدعاس'],
  'tafsir-al-nasafi': ['مدارك التنزيل (تفسير النسفي)', 'أبو البركات النسفي'],
  'al-muyassar-fi-al-gharib': ['الميسر في غريب القرآن', ''],
  'al-lubab-fi-ulum-al-kitab': ['اللباب في علوم الكتاب', 'ابن عادل الحنبلي'],
  'tafsir-al-baydawi': ['أنوار التنزيل (تفسير البيضاوي)', 'البيضاوي'],
  'al-jadwal-fi-i-rab-al-quran': ['الجدول في إعراب القرآن', 'محمود صافي'],
  'tafsir-al-razi': ['مفاتيح الغيب (التفسير الكبير)', 'فخر الدين الرازي'],
  'tafsir-ibn-juzay': ['التسهيل لعلوم التنزيل', 'ابن جزي الكلبي'],
  'mawsoo-at-al-tafsir-al-ma-thoor': ['موسوعة التفسير المأثور', ''],
  'tahlil-kalimat-al-qur-an': ['تحليل كلمات القرآن', ''],
  'tafsir-ibn-uthaymeen': ['تفسير ابن عثيمين', 'محمد بن صالح العثيمين'],
  'tafsir-makhi': ['الهداية إلى بلوغ النهاية (تفسير مكي)', 'مكي بن أبي طالب'],
  'mahasin-al-ta-wil-al-qasimi': ['محاسن التأويل', 'جمال الدين القاسمي'],
  'tafsir-al-sam-ani': ['تفسير السمعاني', 'أبو المظفر السمعاني'],
  'al-bahr-al-muhit': ['البحر المحيط', 'أبو حيان الأندلسي'],
  'adwa-al-bayan': ['أضواء البيان', 'محمد الأمين الشنقيطي'],
  'ayah-dependency-graphs': ['مخططات إعراب الآيات', ''],
  'al-wajiz-wahidi': ['الوجيز', 'الواحدي'],
  'fath-al-qadir-al-shawkani': ['فتح القدير', 'الشوكاني'],
  'al-nashr-li-ibn-al-jazari': ['النشر في القراءات العشر', 'ابن الجزري'],
  'al-qira-at-al-mawsoo-ah-al-qur-aniyyah': ['القراءات (الموسوعة القرآنية)', 'إبراهيم الإبياري'],
  'tafsir-ibn-al-jawzi': ['زاد المسير (تفسير ابن الجوزي)', 'ابن الجوزي'],
  'tafsir-ibn-al-qayyim': ['تفسير ابن القيم', 'ابن قيم الجوزية'],
  'al-durr-al-manthur': ['الدر المنثور', 'جلال الدين السيوطي'],
  'jamia-al-bayan-aliji': ['جامع البيان في تفسير القرآن', 'الإيجي'],
  'tafsir-al-samarqandi': ['بحر العلوم (تفسير السمرقندي)', 'أبو الليث السمرقندي'],
  'tafsir-ibn-abi-hatim': ['تفسير ابن أبي حاتم', 'ابن أبي حاتم الرازي'],
  'tafsir-al-alusi': ['روح المعاني (تفسير الآلوسي)', 'شهاب الدين الآلوسي'],
  'al-dur-al-masun-lil-samin-al-halabi': ['الدر المصون', 'السمين الحلبي'],
  'tadabbur-wa-amal': ['تدبر وعمل', ''],
  'fath-al-bayan-li-al-qanuji': ['فتح البيان في مقاصد القرآن', 'صديق حسن خان القنوجي'],
  'tafsir-abi-al-su-ood': ['إرشاد العقل السليم (تفسير أبي السعود)', 'أبو السعود العمادي'],
  'tafsir-al-mawardi': ['النكت والعيون (تفسير الماوردي)', 'الماوردي'],
  'al-kashshaf-al-zamakhshari': ['الكشاف', 'الزمخشري'],
};

/** The edition with its Arabic/Urdu-script name and author, when we have them. */
export const nativeName = (e: TafsirEdition): TafsirEdition => {
  const n = TAFSIR_NATIVE[e.slug];
  return n ? {...e, name: n[0], author_name: n[1] || undefined} : e;
};
