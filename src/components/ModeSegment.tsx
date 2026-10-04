import { SharedIndicator } from "../primitives/SharedIndicator";

export type DriveMode = "Eco" | "Comfort" | "Sport";
export const DRIVE_MODES: DriveMode[] = ["Eco", "Comfort", "Sport"];

/**
 * Control/Mode segment (Figma 3:72) inside the Driving mode track. A shared thumb travels with
 * one overshoot; the active label colour changes under a clip that follows the thumb.
 */
export function ModeSegment({ value, onChange }: { value: DriveMode; onChange?: (m: DriveMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Driving mode">
      <SharedIndicator
        items={DRIVE_MODES}
        active={value}
        className="mode-track"
        pillClassName="mode-thumb"
        radius={13}
        renderItem={(m, selected, bind) => (
          <button {...bind} key={m} type="button" role="radio" aria-checked={selected} className="mode-seg" onClick={() => onChange?.(m)}>
            {m}
          </button>
        )}
        renderActiveLabel={(m) => (
          <span key={m} className="mode-seg mode-seg--on">
            {m}
          </span>
        )}
      />
    </div>
  );
}
