import type {Metadata} from 'next';

/** The site's one public address: canonical links, the sitemap and link previews all point here. */
export const SITE = 'https://www.connectingquran.com';
export const SITE_NAME = 'Connecting Quran';
/** The link-preview card (public/og.jpg, 1200×630: logo, Bismillah, what the site offers). */
export const OG_IMAGE = {url: '/og.jpg', width: 1200, height: 630, alt: 'Connecting Quran: read the Quran with Urdu and English translation, tafseer, word-by-word meanings and recitation'};

/**
 * A page's title and description plus its canonical address and link-preview fields. Next replaces a parent's
 * openGraph/twitter wholesale (images included), so every page sets the full set here, image and all.
 * `absolute`: the title is used as is (the home page), not run through the layout's "… · Connecting Quran" template.
 */
export function seo(path: string, title: string, description: string, absolute = false): Metadata {
  const full = absolute ? title : `${title} · ${SITE_NAME}`;
  return {
    title: absolute ? {absolute: title} : title, description,
    alternates: {canonical: path},
    openGraph: {type: 'website', siteName: SITE_NAME, url: path, title: full, description, locale: 'en', images: [OG_IMAGE]},
    twitter: {card: 'summary_large_image', title: full, description, images: [OG_IMAGE.url]},
  };
}
