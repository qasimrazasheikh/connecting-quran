import {TafseerRoute, tafseerMeta} from '@/lib/tafseer-route';
type P = PageProps<'/videos/[s]/[a]'>;
export const generateMetadata = ({params}: P) => tafseerMeta(params, 'videos');
export default function Page({params}: P) { return <TafseerRoute params={params} tab="videos" />; }
