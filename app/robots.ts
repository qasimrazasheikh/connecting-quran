import type {MetadataRoute} from 'next';
import {SITE} from '@/lib/seo';

/** Everything public may be crawled; the curator area and the JSON API may not. */
export default function robots(): MetadataRoute.Robots {
  return {rules: {userAgent: '*', allow: '/', disallow: ['/admin', '/api/']}, sitemap: `${SITE}/sitemap.xml`, host: SITE};
}
