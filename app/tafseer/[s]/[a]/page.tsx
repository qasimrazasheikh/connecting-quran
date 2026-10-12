import {TafseerRoute, tafseerMeta} from '@/lib/tafseer-route';
import {STUDY_TABS, type StudyTab} from '@/lib/step';
type P = PageProps<'/tafseer/[s]/[a]'>;
/** ?tab=more opens the Study panel on another tab (videos have their own /videos address). */
const tabOf = async (sp: P['searchParams']): Promise<StudyTab> => { const t = (await sp).tab; return typeof t === 'string' && STUDY_TABS.includes(t as StudyTab) && t !== 'videos' ? t as StudyTab : 'text'; };
export const generateMetadata = async ({params, searchParams}: P) => tafseerMeta(params, await tabOf(searchParams));
export default async function Page({params, searchParams}: P) { return <TafseerRoute params={params} tab={await tabOf(searchParams)} />; }
