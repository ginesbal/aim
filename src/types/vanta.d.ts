declare module "vanta/dist/vanta.topology.min" {
  interface VantaEffect {
    destroy: () => void;
    setOptions: (opts: Record<string, unknown>) => void;
    resize: () => void;
  }

  interface VantaTopologyOptions {
    el: HTMLElement;
    p5: unknown;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    backgroundColor?: number;
  }

  export default function TOPOLOGY(opts: VantaTopologyOptions): VantaEffect;
}
