export type DriveMode = "Eco" | "Comfort" | "Sport";
export const DRIVE_MODES: DriveMode[] = ["Eco", "Comfort", "Sport"];

/** Control/Mode segment (Figma 3:72), Active and Default states, inside the Driving mode track. */
export function ModeSegment({ value, onChange }: { value: DriveMode; onChange?: (m: DriveMode) => void }) {
  return (
    <div className="mode-track" role="radiogroup" aria-label="Driving mode">
      {DRIVE_MODES.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={m === value}
          className={`mode-seg ${m === value ? "is-active" : ""}`}
          onClick={() => onChange?.(m)}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
