"use client";

import { useEffect, useRef, useState } from "react";

interface TopologyBgProps {
  color?: number;
  backgroundColor?: number;
  className?: string;
}

export default function TopologyBg({
  color = 0x60729f,
  backgroundColor = 0xeff1f5,
  className = "",
}: TopologyBgProps) {
  const ref = useRef<HTMLDivElement>(null);
  const effectRef = useRef<{ destroy: () => void; setOptions: (opts: Record<string, unknown>) => void } | null>(null);
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
      // for anyone who prefers reduced motion it isn't started: the plain
      // canvas colour shows instead.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const p5Module = await import("p5");
      const p5 = p5Module.default;
      const TOPOLOGY = (await import("vanta/dist/vanta.topology.min")).default;

      if (cancelled || !ref.current) return;

      effectRef.current = TOPOLOGY({
        el: ref.current,
        p5,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1.0,
        scaleMobile: 1.0,
        color,
        backgroundColor,
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
    // Only the resize rebuilds it; colours are applied live by the effect below.
  }, [resizeKey]);

  // Update colors dynamically without re-creating the effect
  useEffect(() => {
    if (effectRef.current && loaded) {
      effectRef.current.setOptions({ color, backgroundColor });
    }
  }, [color, backgroundColor, loaded]);

  return <div ref={ref} className={`w-full h-full ${className}`} />;
}
