import type {Metadata} from 'next';

export const metadata: Metadata = {title: {default: 'Curator', template: '%s · Curator'}, robots: {index: false, follow: false}};

export default function AdminLayout({children}: LayoutProps<'/admin'>) {
  return <div className="text-[14.5px]">{children}</div>;
}
