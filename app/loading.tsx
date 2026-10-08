import {NavHold} from '@/components/NavProgress';

export default function Loading() {
  return <div className="grid place-items-center py-16 text-muted"><NavHold /><div className="spin mb-2.5" />Loading…</div>;
}
