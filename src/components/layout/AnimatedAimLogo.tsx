"use client";

import { useState, useEffect } from "react";

/**
 * Animated aim logo for the sidebar.
 *
 * Sequence (target/bullseye concept):
 *  1. Counter dot appears first with a ripple ring expanding outward
 *  2. The "a" bowl scales up around the dot (materializes from center)
 *  3. "i" dot drops in from above, "m" fades in from right
 *  4. Brief pause showing full "aim" word
 *  5. "i" floats up + fades, "m" dissolves, viewBox zooms to "a" icon
 */
export default function AnimatedAimLogo({
  fillClass = "fill-baltic-100",
  counterClass = "fill-baltic-800 dark:fill-baltic-950",
}: {
  fillClass?: string;
  counterClass?: string;
}) {
  const [phase, setPhase] = useState<
    "dot" | "ring" | "letters" | "full" | "icon"
  >("dot");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("ring"), 200),     // ripple + "a" scales in
      setTimeout(() => setPhase("letters"), 800),   // "i" and "m" enter
      setTimeout(() => setPhase("full"), 1400),     // everything visible, pause
      setTimeout(() => setPhase("icon"), 2600),     // collapse to icon
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const fullBox = "172 210 312 153";
  const iconBox = "165 205 155 165";
  const isIcon = phase === "icon";

  // Ripple ring: expands outward from counter dot position, then fades
  const showRipple = phase === "ring" || phase === "dot";

  return (
    <svg
      viewBox={isIcon ? iconBox : fullBox}
      width={isIcon ? 32 : 64}
      height={isIcon ? 32 : 31}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="aim"
      className="transition-all duration-700 ease-in-out overflow-visible"
    >
      {/* Ripple ring — expands from counter dot */}
      <circle
        cx="242"
        cy="294.5"
        r="45"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-baltic-400 transition-all ease-out"
        style={{
          opacity: phase === "ring" ? 0.6 : 0,
          transform:
            phase === "dot"
              ? "scale(0.3)"
              : phase === "ring"
                ? "scale(1.2)"
                : "scale(1.5)",
          transformOrigin: "242px 294.5px",
          transitionDuration: phase === "ring" ? "600ms" : "400ms",
        }}
      />

      {/* Second ripple ring — slightly delayed */}
      <circle
        cx="242"
        cy="294.5"
        r="35"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-baltic-500 transition-all ease-out"
        style={{
          opacity: phase === "ring" ? 0.3 : 0,
          transform:
            phase === "dot"
              ? "scale(0.2)"
              : phase === "ring"
                ? "scale(1.4)"
                : "scale(1.6)",
          transformOrigin: "242px 294.5px",
          transitionDuration: phase === "ring" ? "700ms" : "300ms",
          transitionDelay: phase === "ring" ? "100ms" : "0ms",
        }}
      />

      {/* "a" — bowl + stem, scales up from center */}
      <g
        className={`${fillClass} transition-all ease-out`}
        style={{
          opacity: phase === "dot" ? 0 : 1,
          transform:
            phase === "dot"
              ? "scale(0.4)"
              : phase === "ring"
                ? "scale(1.02)"
                : "scale(1)",
          transformOrigin: "242px 294px",
          transitionDuration: phase === "dot" ? "0ms" : "500ms",
          transitionDelay: phase === "ring" ? "100ms" : "0ms",
        }}
      >
        {/* "a" — circle bowl */}
        <path d="M306 293.5C306 328.57 277.122 357 241.5 357C205.878 357 177 328.57 177 293.5C177 258.43 205.878 230 241.5 230C277.122 230 306 258.43 306 293.5Z" />
        {/* "a" — right stem + connector */}
        <path d="M305.782 288.417L306 290V356H233V279H302.256L305.782 288.417Z" />
      </g>

      {/* Counter dot — appears first, pulses */}
      <circle
        cx="242"
        cy="294.5"
        r="20"
        className={`${counterClass} transition-all ease-out`}
        style={{
          transform:
            phase === "dot"
              ? "scale(0.6)"
              : phase === "ring"
                ? "scale(1.1)"
                : "scale(1)",
          transformOrigin: "242px 294.5px",
          transitionDuration: "400ms",
        }}
      />

      {/* "i" dot — drops in from above */}
      <path
        d="M347 230.75C347 239.448 338.717 246.5 328.5 246.5C318.283 246.5 310 239.448 310 230.75C310 222.052 318.283 215 328.5 215C338.717 215 347 222.052 347 230.75Z"
        className={`${fillClass} transition-all ease-out`}
        style={{
          opacity:
            phase === "letters" || phase === "full" ? 1 : 0,
          transform:
            phase === "dot" || phase === "ring"
              ? "translateY(-25px) scale(0.5)"
              : phase === "icon"
                ? "translateY(-15px) scale(0.3)"
                : "translateY(0) scale(1)",
          transformOrigin: "328px 230px",
          transitionDuration: phase === "letters" ? "400ms" : "500ms",
          transitionTimingFunction:
            phase === "letters"
              ? "cubic-bezier(0.34, 1.56, 0.64, 1)" // bounce
              : "ease-out",
        }}
      />

      {/* "m" — fades in from right */}
      <path
        d="M308.943 356V246.909H346.159V267.648H347.295C349.568 260.83 353.451 255.432 358.943 251.455C364.436 247.477 370.97 245.489 378.545 245.489C386.216 245.489 392.821 247.525 398.361 251.597C403.901 255.621 407.239 260.972 408.375 267.648H409.511C411.358 260.972 415.288 255.621 421.301 251.597C427.314 247.525 434.369 245.489 442.466 245.489C452.93 245.489 461.405 248.85 467.892 255.574C474.426 262.297 477.693 271.246 477.693 282.42V356H438.489V292.364C438.489 287.581 437.281 283.841 434.866 281.142C432.452 278.396 429.208 277.023 425.136 277.023C421.112 277.023 417.916 278.396 415.548 281.142C413.228 283.841 412.068 287.581 412.068 292.364V356H374.568V292.364C374.568 287.581 373.361 283.841 370.946 281.142C368.531 278.396 365.288 277.023 361.216 277.023C358.517 277.023 356.197 277.638 354.256 278.869C352.314 280.1 350.799 281.876 349.71 284.196C348.669 286.469 348.148 289.191 348.148 292.364V356H308.943Z"
        className={`${fillClass} transition-all ease-out`}
        style={{
          opacity:
            phase === "letters" || phase === "full" ? 1 : 0,
          transform:
            phase === "dot" || phase === "ring"
              ? "translateX(40px) scale(0.9)"
              : phase === "icon"
                ? "translateX(30px) scale(0.8)"
                : "translateX(0) scale(1)",
          transformOrigin: "390px 300px",
          transitionDuration: phase === "letters" ? "500ms" : "500ms",
          transitionDelay: phase === "letters" ? "100ms" : "0ms",
        }}
      />
    </svg>
  );
}
