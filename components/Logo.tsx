/** Original القرآن calligraphy on a transparent background. */
export default function Logo({className}: {className: string; svgClass?: string}) {
  return (
    <span className={`inline-grid place-items-center ${className}`}>
      <img src="/logo-calligraphy.png" width={512} height={512} className="size-full object-contain" alt="" aria-hidden="true" />
    </span>
  );
}
