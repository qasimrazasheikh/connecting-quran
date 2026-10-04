import {redirect} from 'next/navigation';
export default async function Page({params}: PageProps<'/videos/[s]'>) { redirect(`/videos/${(await params).s}/1`); }
