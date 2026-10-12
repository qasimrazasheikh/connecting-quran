/** Small shared pieces of the admin pages (server components). */
import {STATUS} from '@/lib/db/enums';
import {cx} from '@/lib/ui';

const tone = {approved: 'border-ok text-ok', pending: 'border-accent text-accent', hidden: 'border-line text-muted'} as const;
export const StatusChip = ({s}: {s: keyof typeof tone}) => <span className={cx('rounded-full border px-2 py-px text-[12px]', tone[s])}>{s === 'approved' ? 'live' : s}</span>;

/** One-click status change: a tiny form per button, so it works without client-side code. */
export function StatusButtons({action, current}: {action: (status: (typeof STATUS)[number]) => Promise<void>; current: string}) {
  return (
    <div className="flex gap-1">
      {STATUS.filter(s => s !== current).map(s => (
        <form key={s} action={action.bind(null, s)}>
          <button className={cx('rounded-lg border px-2.5 py-1 text-[13px]', tone[s])}>{s === 'approved' ? 'Approve' : s === 'hidden' ? 'Hide' : 'Mark pending'}</button>
        </form>))}
    </div>
  );
}
