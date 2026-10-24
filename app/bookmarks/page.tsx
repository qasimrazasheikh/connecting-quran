import Bookmarks from '@/components/Bookmarks';
// saved in each reader's own browser, so there is nothing here for search engines
export const metadata = {title: 'Bookmarks', robots: {index: false}};
export default function Page() { return <Bookmarks />; }
