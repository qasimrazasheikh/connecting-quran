import {seo} from '@/lib/seo';
import HomeList from '@/components/HomeList';
export const metadata = seo('/', 'Connecting Quran — Quran, Translation & Tafseer', 'Read the Holy Quran with Urdu and English translations, tafseer, word-by-word meanings, grammar, recitation and quizzes.', true);
export default function Home() { return <HomeList tab="surah" />; }
