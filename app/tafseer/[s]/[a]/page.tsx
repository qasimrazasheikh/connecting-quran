import {TafseerRoute, tafseerMeta} from '@/lib/tafseer-route';
type P = PageProps<'/tafseer/[s]/[a]'>;
export const generateMetadata = ({params}: P) => tafseerMeta(params, 'text');
export default function Page({params}: P) { return <TafseerRoute params={params} tab="text" />; }
