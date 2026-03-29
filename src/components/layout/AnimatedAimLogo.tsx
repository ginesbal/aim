"use client";

import { useState, useEffect } from "react";

/**
 * Animated aim logo for the sidebar.
 *
 * Sequence:
 *  1. Full "aim" word visible for 1.5s
 *  2. The "a" slides right over "im" (like it's erasing them)
 *  3. The "a" slides back left to its original position
 *  4. "im" is gone, transitions to icon mark
 */
export default function AnimatedAimLogo({
  fillClass = "fill-baltic-100",
  counterClass = "fill-baltic-800 dark:fill-baltic-950",
}: {
  fillClass?: string;
  counterClass?: string;
}) {
  const [phase, setPhase] = useState<
    "full" | "sliding-right" | "sliding-back" | "icon"
  >("full");

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("sliding-right"), 1500),  // "a" starts moving right
      setTimeout(() => setPhase("sliding-back"), 2400),    // "a" reached end, comes back
      setTimeout(() => setPhase("icon"), 3300),            // settle into icon
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // How far "a" slides right (in SVG units).
  // "im" spans from ~x308 to ~x478, so ~170 units to cover.
  // At the full word width of 64px for 312 SVG units, that's about 35px.
  const slideDistance = 175;

  const getATranslateX = () => {
    switch (phase) {
      case "full": return 0;
      case "sliding-right": return slideDistance;
      case "sliding-back": return 0;
      case "icon": return 0;
    }
  };

  // "im" gets hidden once the "a" passes over them
  const imVisible = phase === "full";

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: phase === "icon" ? 32 : 64,
        height: phase === "icon" ? 32 : 31,
        transition: "width 500ms ease-in-out, height 500ms ease-in-out",
      }}
    >
      {/* Full wordmark layer */}
      <svg
        viewBox="172 210 312 153"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="aim"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 64,
          height: 31,
          opacity: phase === "icon" ? 0 : 1,
          transition: "opacity 300ms ease-in-out",
        }}
      >
        {/* "i" and "m" — static, fade out as "a" passes over */}
        <g
          style={{
            opacity: imVisible ? 1 : 0,
            transition: "opacity 400ms ease-in-out",
            transitionDelay: imVisible ? "0ms" : "200ms",
          }}
        >
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

        {/* "a" — slides right then back left */}
        <g
          style={{
            transform: `translateX(${getATranslateX()}px)`,
            transition: "transform 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <path
            d="M306 293.5C306 328.57 277.122 357 241.5 357C205.878 357 177 328.57 177 293.5C177 258.43 205.878 230 241.5 230C277.122 230 306 258.43 306 293.5Z"
            className={fillClass}
          />
          <path
            d="M305.782 288.417L306 290V356H233V279H302.256L305.782 288.417Z"
            className={fillClass}
          />
          <circle cx="242" cy="294.5" r="20" className={counterClass} />
        </g>
      </svg>

      {/* Icon mark layer — fades in at the end */}
      <svg
        viewBox="165 205 155 165"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          opacity: phase === "icon" ? 1 : 0,
          transition: "opacity 400ms ease-in-out",
          transitionDelay: phase === "icon" ? "100ms" : "0ms",
        }}
      >
        <path
          d="M306 293.5C306 328.57 277.122 357 241.5 357C205.878 357 177 328.57 177 293.5C177 258.43 205.878 230 241.5 230C277.122 230 306 258.43 306 293.5Z"
          className={fillClass}
        />
        <path
          d="M305.782 288.417L306 290V356H233V279H302.256L305.782 288.417Z"
          className={fillClass}
        />
        <circle cx="242" cy="294.5" r="20" className={counterClass} />
      </svg>
    </div>
  );
}
