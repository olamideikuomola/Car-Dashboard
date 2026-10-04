import { motion } from "motion/react";
import type { Tyres } from "../sim/types";
import { duration, ease } from "../motion/tokens";

const LOW = 2.3;

/**
 * Car top view, Figma 5:207, rebuilt with colour tokens. Tyres turn amber when under 2.3 bar.
 * `glow`: a low tyre glows with two pulses, then holds (one-shot, under 3 flashes a second).
 */
export function CarTopView({ tyres, glow = false }: { tyres: Tyres; glow?: boolean }) {
  const tone = (bar: number) => (bar < LOW ? "var(--status-warning)" : "var(--text-muted)");
  return (
    <svg className="car-top" width="220" height="440" viewBox="0 0 220 440" aria-hidden="true">
      <path d="M120 10H100C61.3401 10 30 41.3401 30 80V360C30 398.66 61.3401 430 100 430H120C158.66 430 190 398.66 190 360V80C190 41.3401 158.66 10 120 10Z" fill="var(--surface-panel-2)" stroke="var(--border-line)" strokeWidth={2} />
      <path d="M152 110H68C58.0589 110 50 118.059 50 128V162C50 171.941 58.0589 180 68 180H152C161.941 180 170 171.941 170 162V128C170 118.059 161.941 110 152 110Z" fill="var(--surface-bg)" stroke="var(--border-line)" strokeWidth={2} />
      <path d="M154 300H66C57.1634 300 50 307.163 50 316V340C50 348.837 57.1634 356 66 356H154C162.837 356 170 348.837 170 340V316C170 307.163 162.837 300 154 300Z" fill="var(--surface-bg)" stroke="var(--border-line)" strokeWidth={2} />
      <path d="M152 196H68C61.3726 196 56 201.373 56 208V276C56 282.627 61.3726 288 68 288H152C158.627 288 164 282.627 164 276V208C164 201.373 158.627 196 152 196Z" fill="var(--surface-panel-2)" />
      <defs>
        <filter id="tyre-glow" x="-100%" y="-50%" width="300%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {(Object.keys(tyres) as (keyof Tyres)[]).map((k) =>
        tyres[k] < LOW && glow ? (
          <motion.rect
            key={`glow-${k}`}
            {...TYRE[k]}
            rx="8"
            fill="var(--status-warning)"
            filter="url(#tyre-glow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.35, 1, 0.7] }}
            transition={{ duration: duration.slow * 3, ease: ease.inOutQuart }}
          />
        ) : null,
      )}
      <rect className="car-top__tyre" data-tyre="fl" x="14" y="70" width="22" height="66" rx="8" fill={tone(tyres.fl)} />
      <rect className="car-top__tyre" data-tyre="fr" x="184" y="70" width="22" height="66" rx="8" fill={tone(tyres.fr)} />
      <rect className="car-top__tyre" data-tyre="rl" x="14" y="304" width="22" height="66" rx="8" fill={tone(tyres.rl)} />
      <rect className="car-top__tyre" data-tyre="rr" x="184" y="304" width="22" height="66" rx="8" fill={tone(tyres.rr)} />
    </svg>
  );
}

export const isLow = (bar: number) => bar < LOW;

const TYRE = {
  fl: { x: 14, y: 70, width: 22, height: 66 },
  fr: { x: 184, y: 70, width: 22, height: 66 },
  rl: { x: 14, y: 304, width: 22, height: 66 },
  rr: { x: 184, y: 304, width: 22, height: 66 },
};
