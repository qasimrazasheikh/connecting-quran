import Link from 'next/link';
import {btn, empty} from '@/lib/ui';
export default function NotFound() {
  return <div className={empty}><b className="mb-2 block text-lg text-ink">Page not found</b><p>That surah, ayah or page does not exist.</p><Link className={btn} href="/">Go to the Quran</Link></div>;
}
