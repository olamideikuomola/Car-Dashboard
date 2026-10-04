import { useMotionPrefs, type MotionProfile } from "../motion/MotionProfileProvider";
import { ms } from "../motion/tokens";
import type { Theme } from "../sim/types";
import "./scratch.css";

const colors = [
  "surface-bg", "surface-panel", "surface-panel-2", "border-line",
  "text-primary", "text-secondary", "text-muted",
  "accent-default", "accent-on-accent",
  "status-warning", "status-warning-text", "status-warning-bg", "status-ok",
  "map-bg", "map-block", "map-park", "map-road",
];

/** Phase 1 scratch view: proves tokens, fonts, theme switching and the scaled stage. */
export function TokenCheck(props: { theme: Theme; profile: MotionProfile; onTheme: () => void; onProfile: () => void }) {
  const { reduced } = useMotionPrefs();
  return (
    <div className="scratch">
      <header className="scratch-head">
        <h1>Scaffold check</h1>
        <div className="scratch-actions">
          <button className="scratch-btn" onClick={props.onTheme}>Theme: {props.theme}</button>
          <button className="scratch-btn" onClick={props.onProfile}>Profile: {props.profile}</button>
          <span className="scratch-note">reduced motion active: {String(reduced)}</span>
        </div>
      </header>

      <section className="scratch-swatches">
        {colors.map((c) => (
          <div key={c} className="swatch">
            <div className="swatch-chip" style={{ background: `var(--${c})` }} />
            <code>--{c}</code>
          </div>
        ))}
      </section>

      <section className="scratch-type">
        <div>
          <div className="speed" style={{ fontVariationSettings: '"wght" 200' }}>88</div>
          <code>Geist ExtraLight 200 (Comfort, Eco)</code>
        </div>
        <div>
          <div className="speed" style={{ fontVariationSettings: '"wght" 300' }}>88</div>
          <code>Geist Light 300 (Sport)</code>
        </div>
        <div>
          <div className="mono">2.1 BAR · IN 1,200 KM</div>
          <code>Geist Mono</code>
          <ul className="scratch-durations">
            {Object.entries(ms).map(([k, v]) => (
              <li key={k}><code>duration-{k}</code> {v}ms</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
