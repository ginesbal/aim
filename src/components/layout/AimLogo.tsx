/**
 * aim logo — text mark with a distinctive gray dot on the "i".
 * The "i" is rendered as a dotless ı (stem) with a separate circular dot,
 * matching the brand identity from the design spec.
 */
export default function AimLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const fontSize = size === "sm" ? "text-xl" : "text-2xl";

  return (
    <span
      className={`${fontSize} font-bold text-baltic-700 dark:text-baltic-100 leading-none tracking-tight select-none inline-flex items-baseline`}
      style={{ letterSpacing: "-0.01em", fontFamily: "var(--font-sans), system-ui, sans-serif" }}
    >
      a
      <span className="relative inline-block">
        {/* invisible i for width reservation */}
        <span className="invisible">i</span>
        {/* dotless i stem */}
        <span className="absolute top-0 left-0 text-baltic-700 dark:text-baltic-100" aria-hidden="true">
          ı
        </span>
        {/* gray dot */}
        <span
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-steel-400"
          style={{
            width: "0.19em",
            height: "0.19em",
            top: "0.12em",
          }}
          aria-hidden="true"
        />
      </span>
      m
    </span>
  );
}
