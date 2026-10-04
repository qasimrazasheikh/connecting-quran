import {redirect} from 'next/navigation';
export default async function Page({params}: PageProps<'/quiz/[s]'>) { redirect(`/quiz/${(await params).s}/1`); }
