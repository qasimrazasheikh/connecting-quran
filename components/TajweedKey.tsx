import {TJ_RULES} from '@/lib/meta';
/** Colour key for tajweed rules. */
export default function TajweedKey() {
  return (
    <details className="mb-3 rounded-xl border border-line bg-surface px-3 py-2 text-[13px]">
      <summary className="cursor-pointer font-semibold text-brand">Tajweed colour key</summary>
      <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-x-3 gap-y-1.5">
        {TJ_RULES.map(([c, en, ar]) => (
          <span key={c} className="flex items-center gap-1.5"><i className={`tj-${c} inline-block size-3 flex-none rounded-full bg-current`} />{en} <span className="font-ar text-[15px] text-muted" dir="rtl">{ar}</span></span>
        ))}
      </div>
    </details>
  );
}
