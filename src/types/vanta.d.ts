// Vanta ships no types. Every effect build has the same shape: a factory
// that takes an options bag and returns a handle.
declare module "vanta/dist/*" {
  interface VantaEffect {
    destroy: () => void;
    setOptions: (opts: Record<string, unknown>) => void;
    restart: () => void;
    resize: () => void;
  }

  export default function create(opts: Record<string, unknown>): VantaEffect;
}

// three r134 (the version Vanta 0.5 is built against) ships no types
// either; it is only ever handed straight to Vanta.
declare module "three";
