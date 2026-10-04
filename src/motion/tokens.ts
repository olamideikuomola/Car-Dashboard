/**
 * Motion tokens, JS side. Mirrors src/styles/motion-tokens.css.
 * Motion takes seconds, so durations live here in seconds; `ms` holds the same values in ms
 * for timers and the wake-up schedule. No raw durations or cubic-beziers outside this file.
 */

export const ms = {
  press: 140,
  short: 150,
  normal: 250,
  slow: 400,
  xslow: 600,
  hero: 1400,
} as const;

export type DurationToken = keyof typeof ms;

export const duration = {
  press: ms.press / 1000,
  short: ms.short / 1000,
  normal: ms.normal / 1000,
  slow: ms.slow / 1000,
  xslow: ms.xslow / 1000,
  hero: ms.hero / 1000,
} as const satisfies Record<DurationToken, number>;

type Bezier = [number, number, number, number];

export const ease = {
  /** Everything entering or leaving. */
  outQuint: [0.23, 1, 0.32, 1] as Bezier,
  /** On-screen moves between two resting places, and the theme wipe. */
  inOutQuart: [0.77, 0, 0.175, 1] as Bezier,
  /** Constant motion only: media progress, fan rotation. */
  linear: "linear" as const,
};

export type EaseToken = keyof typeof ease;

/** One duration token plus one easing token, as a Motion tween. */
export function tween(d: DurationToken, e: EaseToken = "outQuint") {
  return { type: "tween" as const, duration: duration[d], ease: ease[e] };
}

export const spring = {
  /** Buttons and tiles. */
  press: { type: "spring", visualDuration: 0.16, bounce: 0 },
  /** Indicators, chips, cards. */
  expressive: { type: "spring", visualDuration: 0.4, bounce: 0.2 },
  /** Wake-up, health car, gear into Drive. */
  dramatic: { type: "spring", visualDuration: 0.6, bounce: 0.35 },
  /** Live values: speed, bars, map puck. Physics-based so it retargets with velocity on every tick. */
  value: { type: "spring", stiffness: 120, damping: 20, mass: 1 },
} as const;

export type SpringToken = keyof typeof spring;

/** A spring token in the shape useSpring takes (no `type` key). */
export function springOptions(t: SpringToken) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type, ...rest } = spring[t];
  return rest as { stiffness?: number; damping?: number; mass?: number; visualDuration?: number; bounce?: number };
}

/** Digit roll inside RollingNumber: as quick as press feedback, no bounce, so a digit is never mid-swap for long. */
export const rollSpring = { type: "spring", visualDuration: ms.press / 1000, bounce: 0 } as const;

/**
 * Spring for an indicator (gear pill, mode thumb, dock background) that overshoots by exactly the
 * amplitude token: 3% of travel up to 8px (expressive) or 6% up to 16px (dramatic). The visual
 * duration stays the token's; only bounce is solved from the wanted overshoot ratio, using
 * overshoot = exp(-z pi / sqrt(1 - z^2)) with damping ratio z = 1 - bounce.
 */
export function indicatorSpring(mode: StaggerMode, travelPx: number) {
  const base = mode === "dramatic" ? spring.dramatic : spring.expressive;
  const travel = Math.abs(travelPx);
  if (travel < 1) return base;
  const o = amp.overshoot[mode];
  const ratio = Math.min(o.ratio, o.maxPx / travel);
  const ln = Math.log(ratio);
  const zeta = -ln / Math.sqrt(Math.PI * Math.PI + ln * ln);
  return { type: "spring" as const, visualDuration: base.visualDuration, bounce: Math.max(0, Math.min(0.6, 1 - zeta)) };
}

/** Amplitudes. The only raw numbers allowed in component code come from here. */
export const amp = {
  pressScale: 0.96,
  pressScaleStrong: 0.94,
  dockPressScale: 0.92,
  scalePeak: 1.03,
  scalePeakStrong: 1.06,
  stagger: { expressive: 0.03, dramatic: 0.05, cap: 8 },
  overshoot: {
    expressive: { ratio: 0.03, maxPx: 8 },
    dramatic: { ratio: 0.06, maxPx: 16 },
  },
  rise: 24,
  riseBlur: 8,
  crossfadeBlur: 2,
  mediaShift: 24,
  mediaScaleFrom: 0.96,
  healthTiltDeg: 24,
  sparkleTurnDeg: 15,
  statusDotFrom: 0.6,
  /** Exit of Vehicle health back to Drive runs at about 60% of the entry. */
  backRatio: 0.6,
} as const;

export type StaggerMode = "expressive" | "dramatic";

/** Stagger delay in seconds for item i, capped at 8 items. */
export function staggerDelay(mode: StaggerMode, i: number) {
  return Math.min(i, amp.stagger.cap - 1) * amp.stagger[mode];
}

/** Overshoot distance in px for an indicator travelling `travel` px. */
export function overshootPx(mode: StaggerMode, travel: number) {
  const o = amp.overshoot[mode];
  return Math.min(Math.abs(travel) * o.ratio, o.maxPx) * Math.sign(travel);
}

/**
 * Hold to repeat (temperature): first repeat after duration-slow, then every 180ms, speeding
 * up by 20% per step to a floor of 60ms. Behaviour timings, kept here so they stay tunable.
 */
export const holdRepeat = { delay: ms.slow, start: 180, floor: 60, accel: 0.8 } as const;

/** Fan icon spin per fan level, degrees per second. Constant motion, so linear. */
export const fanDegPerSecPerLevel = 72;

/** Reduced motion and calm profile: opacity only, at duration-short. */
export const reducedTransition = tween("short", "outQuint");

/** Instant swap, for numbers under reduced motion. */
export const instant = { duration: 0 } as const;

/** Wake-up schedule, in ms after start. */
export const wake = {
  panels: [0, 700],
  speed: [250, 1000],
  limitRing: [350, 800],
  battery: [400, 1050],
  route: [450, 1250],
  navCard: [500, 900],
  climateDock: [700, 1400],
} as const satisfies Record<string, readonly [number, number]>;

/** Vehicle health entry schedule, in ms after the card starts expanding. */
export const healthSchedule = {
  header: 0,
  car: 80,
  tyres: 300,
  tyreStep: 50,
  alert: 550,
  systems: 600,
  maintenance: 750,
  tip: 900,
} as const;
