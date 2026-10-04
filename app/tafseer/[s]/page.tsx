import {redirect} from 'next/navigation';
export default async function Page({params}: PageProps<'/tafseer/[s]'>) { redirect(`/tafseer/${(await params).s}/1`); }
