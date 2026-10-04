import { useEffect, useState } from "react";
import { useMotionValue, useTransform, type MotionValue } from "motion/react";
import { ms, wake } from "./tokens";
import { useMotionPrefs } from "./MotionProfileProvider";

/**
 * Wake-up clock. The sequence plays on the first load of a session and when the demo panel
 * replays it. Parts ask once, when they mount, whether a wake is in progress; remounting the
 * Drive screen later (coming back from Vehicle health) does not replay it.
 */
const SESSION_KEY = "car-dash:woke";

function firstLoadThisSession() {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return false;
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Storage blocked (private mode, previews): play it, it only costs one wake-up.
  }
  return true;
}

let startedAt = firstLoadThisSession() ? performance.now() : -Infinity;

export function startWake() {
  startedAt = performance.now();
}

/** True if a wake-up is in progress right now. Read it once, at mount. */
export function wakeInProgress() {
  return performance.now() - startedAt < ms.hero;
}

/** Captures, at mount, whether this component was born into a wake-up. */
export function useWaking() {
  const [waking] = useState(wakeInProgress);
  return waking;
}

export type WakePart = keyof typeof wake;

/** Delay in seconds before a part starts, measured from when the wake began. */
export function wakeDelay(part: WakePart) {
  const elapsed = performance.now() - startedAt;
  return Math.max(0, wake[part][0] - elapsed) / 1000;
}

/**
 * Holds a live value at `rest` until the part's wake-up start, then lets it through, so the
 * component's own spring rolls it up from rest (speed from 0, battery bar from empty).
 */
export function useWakeGate(source: MotionValue<number>, part: WakePart, wakingIn: boolean, rest = 0) {
  // Reduced motion and calm: numbers appear at their values with the fade, no roll-up.
  const { reduced } = useMotionPrefs();
  const waking = wakingIn && !reduced;
  const open = useMotionValue(waking ? 0 : 1);
  useEffect(() => {
    if (!waking) return;
    const id = window.setTimeout(() => open.set(1), wakeDelay(part) * 1000);
    return () => window.clearTimeout(id);
  }, [waking, part, open]);
  return useTransform(() => (open.get() ? source.get() : rest));
}
