/** Allowed values for catalogue fields (no database code, so client forms can use them too). */
export const KINDS = ['tafseer', 'video', 'audio', 'link', 'hadith', 'translation'] as const;
export const LANGS = ['ar', 'ur', 'en'] as const;
/** Private classification, used only to keep the catalogue within the allowed schools; never shown on the site. */
export const SCHOOLS = ['classical', 'general', 'deobandi', 'barelvi', 'ahle-hadith', 'salafi'] as const;
/** How a source reaches the reader: fetched live from its API, stored here, a link per ayah (url pattern), or embedded. */
export const DELIVERY = ['api', 'stored', 'link', 'embed'] as const;
/** Only `approved` rows appear on the site; imports start as `pending` when they need the curator's judgement. */
export const STATUS = ['approved', 'pending', 'hidden'] as const;
