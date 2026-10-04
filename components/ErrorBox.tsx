import {empty} from '@/lib/ui';
export default function ErrorBox({msg}: {msg: string}) {
  return <div className={empty}><b className="mb-1 block text-ink">Could not load this page.</b>Check your internet connection and try again. <small className="block opacity-70">{msg}</small></div>;
}
