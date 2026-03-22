/**
 * aim logo — bold rounded wordmark recreated from the brand logo image.
 * Thick C-shaped "a" with white counter dot and right descender,
 * "i" with circular tittle, and heavy "m" with two arches.
 */
export default function AimLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const w = size === "sm" ? 56 : size === "lg" ? 140 : 90;
  const h = w * 0.56;

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 410 230"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="aim"
    >
      <g className="fill-baltic-700 dark:fill-baltic-100">
        {/* ===== "a" — C-shaped bowl + right descender ===== */}
        {/* Bowl: thick arc opening on the right */}
        <path d="
          M186,148
          A78,78 0 1,0 158,88
          L132,119
          A38,38 0 1,1 146,148
          Z
        " />
        {/* Right descender */}
        <rect x="146" y="148" width="40" height="70" rx="2" />
      </g>
      {/* White counter dot */}
      <circle cx="62" cy="146" r="16" className="fill-white dark:fill-baltic-900" />

      <g className="fill-baltic-700 dark:fill-baltic-100">
        {/* ===== "i" — dot + stem ===== */}
        <circle cx="220" cy="68" r="14" />
        <rect x="207" y="108" width="26" height="110" rx="2" />

        {/* ===== "m" — three stems + two arches ===== */}
        <rect x="260" y="108" width="26" height="110" rx="2" />
        <rect x="316" y="108" width="26" height="110" rx="2" />
        <rect x="372" y="108" width="26" height="110" rx="2" />

        {/* First arch (stem 1 → stem 2) */}
        <path d="
          M273,108
          C273,56 329,56 329,108
          L316,108
          C316,82 286,82 286,108
          Z
        " />

        {/* Second arch (stem 2 → stem 3) */}
        <path d="
          M329,108
          C329,56 385,56 385,108
          L372,108
          C372,82 342,82 342,108
          Z
        " />
      </g>
    </svg>
  );
}
