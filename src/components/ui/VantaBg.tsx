"use client";

import { useEffect, useRef, useState } from "react";

export type VantaEffectName = "topology" | "fog" | "birds";

interface VantaInstance {
  destroy: () => void;
  setOptions: (opts: Record<string, unknown>) => void;
  restart: () => void;
}

// Blend a 0xRRGGBB colour toward another: t=0 keeps it, t=1 is `to`.
const mix = (c: number, to: number, t: number) =>
  [16, 8, 0].reduce((out, s) => out | (Math.round(((c >> s) & 255) * (1 - t) + ((to >> s) & 255) * t) << s), 0);

// Each effect: the engine it draws with, its Vanta build, and how the one
// palette colour maps onto its own options. Fog and Birds turn pointer
// tracking off: a backdrop that reacts to the mouse pulls the eye.
const EFFECTS: Record<VantaEffectName, {
  three?: boolean;
  /** Colours are baked in at start, so a colour change needs a restart. */
  restartOnColor?: boolean;
  load: () => Promise<{ default: (opts: Record<string, unknown>) => VantaInstance }>;
  options: (color: number, bg: number) => Record<string, unknown>;
}> = {
  topology: {
    load: () => import("vanta/dist/vanta.topology.min"),
    options: (color, bg) => ({ color, backgroundColor: bg }),
  },
  fog: {
    three: true,
    load: () => import("vanta/dist/vanta.fog.min"),
    options: (color, bg) => ({
      mouseControls: false, touchControls: false,
      highlightColor: 0xffffff, midtoneColor: mix(color, bg, 0.8), lowlightColor: mix(color, bg, 0.55), baseColor: bg,
      blurFactor: 0.6, speed: 0.6, zoom: 1,
    }),
  },
  birds: {
    three: true,
    restartOnColor: true,
    load: () => import("vanta/dist/vanta.birds.min"),
    options: (color, bg) => ({
      mouseControls: false, touchControls: false,
      backgroundColor: bg, color1: color, color2: color, colorMode: "lerp",
      quantity: 3, birdSize: 1, wingSpan: 25, speedLimit: 3, separation: 60, alignment: 40, cohesion: 40,
    }),
  },
};

interface VantaBgProps {
  effect?: VantaEffectName;
  color?: number;
  backgroundColor?: number;
  className?: string;
  /** No animation: the plain canvas colour shows instead. */
  still?: boolean;
}

export default function VantaBg({
  effect = "topology",
  color = 0x60729f,
  backgroundColor = 0xeff1f5,
  className = "",
  still = false,
}: VantaBgProps) {
  const ref = useRef<HTMLDivElement>(null);
  const effectRef = useRef<VantaInstance | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Vanta's topology keeps a flow field sized when it was created; after
  // a resize its draw loop indexes past it and throws on every frame. So
  // the effect is torn down the moment a resize starts and built again
  // once the window has settled (the canvas colour shows meanwhile).
  const [resizeKey, setResizeKey] = useState(0);
  useEffect(() => {
    let settle: ReturnType<typeof setTimeout>;
    const onResize = () => {
      effectRef.current?.destroy();
      effectRef.current = null;
      clearTimeout(settle);
      settle = setTimeout(() => setResizeKey((k) => k + 1), 200);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(settle);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!ref.current || effectRef.current) return;
      // The backdrop moves for the whole session and can't be paused, so
      // when it's set to still, or for anyone who prefers reduced motion,
      // it isn't started: the plain canvas colour shows instead.
      if (still || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const { three, load, options } = EFFECTS[effect];
      // Only the engine the chosen effect needs is downloaded. three's
      // module namespace is read-only and Vanta expects a plain object,
      // hence the copy.
      const engine = three ? { THREE: { ...(await import("three")) } } : { p5: (await import("p5")).default };
      const create = (await load()).default;

      if (cancelled || !ref.current) return;

      effectRef.current = create({
        el: ref.current,
        ...engine,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1.0,
        scaleMobile: 1.0,
        ...options(color, backgroundColor),
      });
      setLoaded(true);
    }

    init();

    return () => {
      cancelled = true;
      if (effectRef.current) {
        effectRef.current.destroy();
        effectRef.current = null;
      }
    };
    // A resize, the still switch or a different effect rebuilds it;
    // colours are applied by the effect below.
  }, [resizeKey, still, effect]);

  // Update colors without re-creating the effect
  useEffect(() => {
    const fx = effectRef.current;
    if (!fx || !loaded) return;
    fx.setOptions(EFFECTS[effect].options(color, backgroundColor));
    if (EFFECTS[effect].restartOnColor) fx.restart();
  }, [color, backgroundColor, loaded]);

  return <div ref={ref} className={`w-full h-full ${className}`} />;
}
