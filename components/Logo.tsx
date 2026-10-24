/**
 * Original القرآن calligraphy on a transparent background. Shown at 32–56 px, so a 160 px WebP (13 KB) covers 3× screens;
 * the 512 px PNG it was made from (143 KB) stays in public/ as the master.
 */
export default function Logo({className}: {className: string; svgClass?: string}) {
  return (
    <span className={`inline-grid place-items-center ${className}`}>
      <img src="/logo-160.webp" width={160} height={160} className="size-full object-contain" alt="" aria-hidden="true" />
    </span>
  );
}
