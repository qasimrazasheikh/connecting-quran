/** External data sources. Override with environment variables (used by tests and for self-hosting). */
export const API = {
  quranCloud: process.env.QURAN_CLOUD_API ?? 'https://api.alquran.cloud/v1',
  /** Quran Foundation's Content API (quran.com's data). Needs CLIENT_ID / CLIENT_SECRET, see qfHeaders in quran.ts. */
  quranCom: process.env.QURAN_COM_API ?? 'https://apis.quran.foundation/content/api/v4',
  qfAuth: process.env.QF_AUTH_URL ?? 'https://oauth2.quran.foundation/oauth2/token',
  tafsir: process.env.TAFSIR_API ?? 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir',
  ipBackup: process.env.IP_BACKUP_API ?? 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranindopak',
  morph: process.env.MORPH_URL ?? 'https://cdn.jsdelivr.net/gh/mustafa0x/quran-morphology@master/quran-morphology.txt',
  quranEnc: process.env.QURANENC_API ?? 'https://quranenc.com/api/v1',
};
/** Seconds to cache external data on the server (the Quran text and tafseer rarely change). */
export const REVALIDATE = 60 * 60 * 24;
