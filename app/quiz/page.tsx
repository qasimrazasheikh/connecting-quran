import {seo} from '@/lib/seo';
import QuizList from '@/components/QuizList';
export const metadata = seo('/quiz', 'Surah Quizzes', 'Test your understanding of each surah: word meanings, translations and ayah order, ten questions at a time.');
export default function Page() { return <QuizList />; }
