import { useEffect, useRef } from "react";
import { Icon } from "./icons/Icon";
import { PressScale } from "../primitives/PressScale";
import { RollingText } from "../primitives/RollingNumber";
import { holdRepeat } from "../motion/tokens";

/**
 * Control/Temp stepper (Figma 3:73). Press scales to 0.94 on spring-press; the value rolls up
 * for plus and down for minus. Holding repeats and speeds up. Every step updates state straight
 * away and the roll retargets, so ten fast taps never queue.
 */
export function TempStepper({ label, value, onStep }: { label: string; value: number; onStep?: (delta: number) => void }) {
  return (
    <div className="temp-stepper" role="group" aria-label={`${label} temperature`}>
      <StepButton delta={-0.5} label={`Lower ${label.toLowerCase()} temperature`} icon="minus" onStep={onStep} />
      <output className="temp-value" aria-live="polite">
        <RollingText text={`${value.toFixed(1)}°`} />
      </output>
      <StepButton delta={0.5} label={`Raise ${label.toLowerCase()} temperature`} icon="plus" onStep={onStep} />
    </div>
  );
}

function StepButton({ delta, label, icon, onStep }: { delta: number; label: string; icon: "plus" | "minus"; onStep?: (d: number) => void }) {
  const timer = useRef<number | null>(null);
  const step = useRef(onStep);
  step.current = onStep;

  const stop = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const start = () => {
    stop();
    step.current?.(delta);
    let gap: number = holdRepeat.start;
    const repeat = () => {
      step.current?.(delta);
      gap = Math.max(holdRepeat.floor, gap * holdRepeat.accel);
      timer.current = window.setTimeout(repeat, gap);
    };
    timer.current = window.setTimeout(repeat, holdRepeat.delay);
  };

  return (
    <PressScale
      strength="strong"
      className="temp-btn"
      aria-label={label}
      onPointerDown={(e) => {
        // Motion's press gesture fires a synthetic (untrusted) pointerdown for keyboard presses;
        // keyboard is handled by onClick below, so only real pointers start the hold.
        if (e.isTrusted && e.button === 0) start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      // Keyboard activation arrives as a click with no pointer (detail 0): one step per press.
      onClick={(e) => {
        if (e.detail === 0) step.current?.(delta);
      }}
    >
      <Icon name={icon} />
    </PressScale>
  );
}
