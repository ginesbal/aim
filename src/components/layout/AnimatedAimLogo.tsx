"use client";

import { useState, useEffect } from "react";

/**
 * Animated aim logo for the sidebar.
 *
 * Sequence:
 *  1. Start with full "aim" word visible
 *  2. After a pause, a clipping mask slides from right to left,
 *     erasing the "m" then the "i", leaving just the "a"
 *  3. ViewBox zooms into the "a" icon mark
 */
export default function AnimatedAimLogo({
  fillClass = "fill-baltic-100",
  counterClass = "fill-baltic-800 dark:fill-baltic-950",
}: {
  fillClass?: string;
  counterClass?: string;
}) {
  const [phase, setPhase] = useState<"full" | "erasing" | "icon">("full");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("erasing"), 1500),
      setTimeout(() => setPhase("icon"), 2800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const fullBox = "172 210 312 153";
  const iconBox = "165 205 155 165";
  const isIcon = phase === "icon";

  // Clip rect right edge: full word visible → slides left to just after "a"
  // Full word ends around x=480, "a" ends around x=310
  const clipRight = phase === "full" ? 490 : 312;

  return (
    <svg
      viewBox={isIcon ? iconBox : fullBox}
      width={isIcon ? 32 : 64}
      height={isIcon ? 32 : 31}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="aim"
      className="transition-all duration-700 ease-in-out"
    >
      <defs>
        <clipPath id="aim-wipe">
          <rect
            x="170"
            y="200"
            width={clipRight - 170}
            height="180"
            className="transition-all ease-in-out"
            style={{
              transitionDuration: phase === "erasing" ? "1000ms" : "0ms",
            }}
          />
        </clipPath>
      </defs>

      <g clipPath="url(#aim-wipe)">
        {/* "a" — circle bowl */}
        <path
          d="M306 293.5C306 328.57 277.122 357 241.5 357C205.878 357 177 328.57 177 293.5C177 258.43 205.878 230 241.5 230C277.122 230 306 258.43 306 293.5Z"
          className={fillClass}
        />
        {/* "a" — right stem + connector */}
        <path
          d="M305.782 288.417L306 290V356H233V279H302.256L305.782 288.417Z"
          className={fillClass}
        />

        {/* Counter dot */}
        <circle cx="242" cy="294.5" r="20" className={counterClass} />

        {/* "i" dot */}
        <path
          d="M347 230.75C347 239.448 338.717 246.5 328.5 246.5C318.283 246.5 310 239.448 310 230.75C310 222.052 318.283 215 328.5 215C338.717 215 347 222.052 347 230.75Z"
          className={fillClass}
        />

        {/* "m" */}
        <path
          d="M308.943 356V246.909H346.159V267.648H347.295C349.568 260.83 353.451 255.432 358.943 251.455C364.436 247.477 370.97 245.489 378.545 245.489C386.216 245.489 392.821 247.525 398.361 251.597C403.901 255.621 407.239 260.972 408.375 267.648H409.511C411.358 260.972 415.288 255.621 421.301 251.597C427.314 247.525 434.369 245.489 442.466 245.489C452.93 245.489 461.405 248.85 467.892 255.574C474.426 262.297 477.693 271.246 477.693 282.42V356H438.489V292.364C438.489 287.581 437.281 283.841 434.866 281.142C432.452 278.396 429.208 277.023 425.136 277.023C421.112 277.023 417.916 278.396 415.548 281.142C413.228 283.841 412.068 287.581 412.068 292.364V356H374.568V292.364C374.568 287.581 373.361 283.841 370.946 281.142C368.531 278.396 365.288 277.023 361.216 277.023C358.517 277.023 356.197 277.638 354.256 278.869C352.314 280.1 350.799 281.876 349.71 284.196C348.669 286.469 348.148 289.191 348.148 292.364V356H308.943Z"
          className={fillClass}
        />
      </g>
    </svg>
  );
}
