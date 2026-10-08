/** Site mark: an open mushaf with linked points above it, on the brand gradient tile. */
export default function Logo({className, svgClass}: {className: string; svgClass: string}) {
  return (
    <span className={`grid place-items-center bg-[linear-gradient(135deg,var(--hero1),var(--hero2))] text-accent2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_55%,transparent)] ${className}`}>
      <svg viewBox="0 0 24 24" className={svgClass} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 20c-2.5-1.6-5.5-2-9-1.6V9.6c3.5-.4 6.5 0 9 1.6 2.5-1.6 5.5-2 9-1.6v8.8c-3.5-.4-6.5 0-9 1.6z" />
        <path d="M12 11.2V20" />
        <path d="M6 5.5 12 3l6 2.5" strokeWidth={1.2} />
        <circle cx="6" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="12" cy="3" r="1.4" fill="currentColor" stroke="none" />
        <circle cx="18" cy="5.5" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
