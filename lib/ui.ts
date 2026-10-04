/** Shared Tailwind class strings, so buttons, cards and chips look the same everywhere. */
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
export const btn = 'inline-flex items-center justify-center gap-1.5 rounded-[11px] border border-brand bg-brand px-3.5 py-2 text-sm font-medium text-on-brand no-underline shadow-[0_4px_14px_color-mix(in_srgb,var(--brand)_28%,transparent)] disabled:cursor-default disabled:opacity-45 [&_svg]:size-4 [&_svg]:flex-none';
export const btnGhost = 'inline-flex items-center justify-center gap-1.5 rounded-[11px] border border-brand bg-transparent px-3.5 py-2 text-sm font-medium text-brand no-underline disabled:cursor-default disabled:opacity-45 [&_svg]:size-4 [&_svg]:flex-none';
export const btnYt = 'inline-flex items-center justify-center gap-1.5 rounded-[11px] border border-yt bg-yt px-3.5 py-2 text-sm font-medium !text-white no-underline [&_svg]:size-4 [&_svg]:flex-none';
export const iconBtn = 'grid size-[38px] flex-none place-items-center rounded-[9px] border border-line bg-surface text-ink hover:border-brand hover:text-brand [&_svg]:size-[19px]';
export const abtn = 'inline-flex items-center gap-1.5 rounded-lg border-0 bg-transparent px-2 py-1.5 text-[13px] text-muted no-underline hover:bg-surface2 hover:text-brand [&_svg]:size-4';
export const card = 'rounded-2xl border border-line bg-surface shadow-card';
export const linkCard = 'flex items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 text-ink no-underline shadow-card transition hover:-translate-y-px hover:border-brand hover:shadow-[0_10px_28px_color-mix(in_srgb,var(--brand)_16%,transparent)]';
export const numBadge = 'grid size-[38px] flex-none place-items-center rounded-[10px] bg-[linear-gradient(135deg,var(--brandSoft),color-mix(in_srgb,var(--accent)_16%,var(--brandSoft)))] text-sm font-semibold text-brand no-underline';
export const chip = 'rounded-full bg-surface2 px-2.5 py-1 text-[12.5px] text-muted';
export const sel = 'max-w-full rounded-[9px] border border-line bg-surface px-2.5 py-[7px] text-ink';
export const empty = 'rounded-xl border border-dashed border-line bg-surface p-8 text-center text-muted';
export const rhead = 'mb-3.5 rounded-2xl border border-line bg-surface px-4 py-[22px] text-center';
export const grid = 'grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2.5';
export const h4 = 'mb-2 mt-[18px] text-[13px] font-semibold uppercase tracking-wider text-muted first:mt-0';
export const segWrap = 'flex overflow-hidden rounded-[9px] border border-line';
export const segBtn = (on: boolean) => cx('flex-1 border-0 px-2 py-2 text-sm', on ? 'bg-brand text-on-brand' : 'bg-surface text-ink');
