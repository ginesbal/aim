/**
 * aim logo — bold rounded wordmark recreated from the brand logo image.
 * Features a solid "a" with white counter dot, "i" with circular dot,
 * and thick rounded "m" with two arches.
 */
export default function AimLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const w = size === "sm" ? 60 : size === "lg" ? 120 : 84;
  const h = w * 0.52;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 250 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="aim"
    >
      <g className="fill-baltic-700 dark:fill-baltic-100">
        {/* ===== "a" — solid bowl + right stem + white counter ===== */}
        <circle cx="48" cy="78" r="42" />
        <rect x="70" y="48" width="22" height="74" rx="2" />
      </g>
      {/* White counter dot inside "a" */}
      <circle cx="42" cy="72" r="13" className="fill-white dark:fill-baltic-900" />

      <g className="fill-baltic-700 dark:fill-baltic-100">
        {/* ===== "i" — dot + stem ===== */}
        <circle cx="116" cy="22" r="11" />
        <rect x="106" y="46" width="20" height="76" rx="2" />

        {/* ===== "m" — three stems + two arches ===== */}
        <rect x="142" y="46" width="20" height="76" rx="2" />
        <rect x="182" y="46" width="20" height="76" rx="2" />
        <rect x="222" y="46" width="20" height="76" rx="2" />

        {/* First arch (stem 1 → stem 2) */}
        <path d="M152,46 C152,12 192,12 192,46 L182,46 C182,30 162,30 162,46 Z" />

        {/* Second arch (stem 2 → stem 3) */}
        <path d="M192,46 C192,12 232,12 232,46 L222,46 C222,30 202,30 202,46 Z" />
      </g>
    </svg>
  );
}
