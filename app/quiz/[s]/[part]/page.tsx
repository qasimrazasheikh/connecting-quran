import {notFound} from 'next/navigation';
import QuizRun from '@/components/QuizRun';
type P = PageProps<'/quiz/[s]/[part]'>;
export async function generateMetadata({params}: P) { const {s, part} = await params; return {title: `Quiz · Surah ${s}, part ${part}`}; }
export default async function Page({params}: P) {
  const {s, part} = await params;
  const n = /^\d{1,3}$/.test(s) ? +s : 0; if (n < 1 || n > 114) notFound();
  return <QuizRun key={`${n}/${part}`} n={n} part={/^\d+$/.test(part) ? +part : 1} />;
}
