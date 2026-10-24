import {notFound} from 'next/navigation';
import QuizRun from '@/components/QuizRun';
import {QUIZ_PART} from '@/lib/meta';
import {seo} from '@/lib/seo';
import {SURAHS} from '@/lib/surahs';
type P = PageProps<'/quiz/[s]/[part]'>;
/** Surah 1–114 and a part it has (one part per QUIZ_PART ayahs), else 404. */
async function quizOf(params: P['params']) {
  const {s, part} = await params;
  const n = /^\d{1,3}$/.test(s) ? +s : 0, pt = /^\d{1,2}$/.test(part) ? +part : 0;
  if (n < 1 || n > 114 || pt < 1 || pt > Math.ceil(SURAHS[n - 1].ayahs / QUIZ_PART)) notFound();
  return {n, pt, name: SURAHS[n - 1].en};
}
export async function generateMetadata({params}: P) {
  const {n, pt, name} = await quizOf(params);
  return seo(`/quiz/${n}/${pt}`, `Quiz · Surah ${name}${pt > 1 ? `, part ${pt}` : ''}`, `Ten questions on Surah ${name}: word meanings, translations and ayah order.`);
}
export default async function Page({params}: P) {
  const {n, pt, name} = await quizOf(params);
  return <><h1 className="sr-only">Quiz · Surah {name}{pt > 1 ? `, part ${pt}` : ''}</h1><QuizRun key={`${n}/${pt}`} n={n} part={pt} /></>;
}
