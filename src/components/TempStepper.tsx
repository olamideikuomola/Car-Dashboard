import { Icon } from "./icons/Icon";

/** Control/Temp stepper (Figma 3:73). */
export function TempStepper({
  label,
  value,
  onStep,
}: {
  label: string;
  value: number;
  onStep?: (delta: number) => void;
}) {
  return (
    <div className="temp-stepper" role="group" aria-label={`${label} temperature`}>
      <button type="button" className="temp-btn" aria-label={`Lower ${label.toLowerCase()} temperature`} onClick={() => onStep?.(-0.5)}>
        <Icon name="minus" />
      </button>
      <output className="temp-value" aria-live="polite">
        {value.toFixed(1)}°
      </output>
      <button type="button" className="temp-btn" aria-label={`Raise ${label.toLowerCase()} temperature`} onClick={() => onStep?.(0.5)}>
        <Icon name="plus" />
      </button>
    </div>
  );
}
