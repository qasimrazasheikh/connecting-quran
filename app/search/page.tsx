import SearchView from '@/components/SearchView';
import {readSettings} from '@/lib/server-settings';
import {searchQuran} from '@/lib/quran';
import {AR_DIAC} from '@/lib/text';

export const metadata = {title: 'Search'};
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || '';

export default async function SearchPage({searchParams}: PageProps<'/search'>) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  let scope = one(sp.scope);
  if (!['ar', 'ur', 'en'].includes(scope)) scope = q && /[؀-ۿ]/.test(q) ? 'ar' : 'en';
  if (!q) return <SearchView q="" scope={scope} res={null} />;
  const {settings} = await readSettings();
  const edition = scope === 'ar' ? 'quran-simple-clean' : settings.trans.find(t => t.startsWith(scope + '.')) || (scope === 'ur' ? 'ur.jalandhry' : 'en.sahih');
  try{
    const r = await searchQuran(scope === 'ar' ? q.replace(AR_DIAC, '') : q, edition);
    return <SearchView q={q} scope={scope} res={{...r, edition}} />;
  }catch(e){ return <SearchView q={q} scope={scope} res={null} error={(e as Error).message} />; }
}
