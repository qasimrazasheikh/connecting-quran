import {seo} from '@/lib/seo';
import HomeList from '@/components/HomeList';
export const metadata = seo('/juz', 'Juz', 'Read the Quran by its 30 juz (parts), with Urdu and English translation and tafseer.');
export default function JuzList() { return <HomeList tab="juz" />; }
