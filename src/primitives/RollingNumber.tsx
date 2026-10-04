import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  animate,
  isMotionValue,
  motion,
  motionValue,
  useMotionValueEvent,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { rollSpring, springOptions, type SpringToken } from "../motion/tokens";
import { useMotionPrefs } from "../motion/MotionProfileProvider";
import "./primitives.css";

type Props = {
  /** A plain number (React state) or a live motion value. */
  value: number | MotionValue<number>;
  /** Turns the number into the displayed string. Digits roll; every other character is static. */
  format?: (n: number) => string;
  /**
   * Smooth the value itself through a spring before formatting, so it counts through the
   * numbers in between (speed, wake-up roll-ups). Omit to roll straight to the new value.
   */
  smooth?: SpringToken;
  /** Start the smoothed value from here on mount, e.g. 0 for a roll-up. */
  from?: number;
  className?: string;
  "aria-label"?: string;
};

const round = (n: number) => String(Math.round(n));
const isDigit = (c: string) => c >= "0" && c <= "9";

/**
 * A number whose digits each roll vertically in their own clipped slot, in the direction of
 * change, on tabular figures. The value can be a live motion value: React only re-renders when
 * the displayed string changes, never per frame.
 */
export function RollingNumber({ value, format = round, smooth, from, className = "", ...rest }: Props) {
  const { reduced } = useMotionPrefs();

  // Source as a motion value, whether we were handed one or a number.
  const own = useRef<MotionValue<number> | null>(null);
  if (!isMotionValue(value) && !own.current) own.current = motionValue<number>(from ?? (value as number));
  const source: MotionValue<number> = isMotionValue(value) ? (value as MotionValue<number>) : own.current!;
  useEffect(() => {
    if (!isMotionValue(value)) source.set(value as number);
  }, [value, source]);

  // Optional value smoothing. Under reduced motion numbers swap instantly, so the spring is skipped.
  const smoothCfg = smooth && !reduced ? springOptions(smooth) : null;
  // When not smoothing, the value is jumped below, so the config here only matters with `smooth`.
  const smoothed = useSpring(from ?? source.get(), smoothCfg ?? springOptions("value"));
  useEffect(() => {
    if (!smoothCfg) {
      smoothed.jump(source.get());
      return source.on("change", (v) => smoothed.jump(v));
    }
    smoothed.set(source.get());
    return source.on("change", (v) => smoothed.set(v));
  }, [source, smoothed, smoothCfg]);

  const shown = smoothCfg ? smoothed : source;
  const [text, setText] = useState(() => format(shown.get()));
  const [dir, setDir] = useState<1 | -1>(1);
  const last = useRef({ text, n: shown.get() });

  useMotionValueEvent(shown, "change", (v) => {
    const t = format(v);
    if (t === last.current.text) return;
    setDir(v >= last.current.n ? 1 : -1);
    last.current = { text: t, n: v };
    setText(t);
  });

  // Keep in sync if the format function changes what it outputs.
  useEffect(() => {
    const t = format(shown.get());
    if (t !== last.current.text) {
      last.current = { text: t, n: shown.get() };
      setText(t);
    }
  }, [format, shown]);

  // Key digits from the right so units stay units when the length changes (9 to 10).
  const chars = text.split("");
  return (
    <span className={`rolling ${className}`}>
      <span className="sr-only">{rest["aria-label"] ?? text}</span>
      {chars.map((c, i) => {
        const place = chars.length - 1 - i;
        return isDigit(c) ? (
          <DigitSlot key={`d${place}`} digit={c} dir={dir} instant={reduced} />
        ) : (
          <span key={`s${place}${c}`} className="rolling__static" aria-hidden="true">
            {c}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Two fixed layers (outgoing and incoming) driven by one progress value, so nothing mounts or
 * unmounts per change. A change mid-roll restarts from the digit currently on screen: rapid
 * input never queues, it just lands on the latest digit.
 */
function DigitSlot({ digit, dir, instant }: { digit: string; dir: 1 | -1; instant: boolean }) {
  const [pair, setPair] = useState({ from: digit, to: digit, dir });
  const progress = useMotionValue(1);

  useLayoutEffect(() => {
    if (digit === pair.to) return;
    // Whichever layer is mostly visible right now becomes the outgoing digit.
    const visible = progress.get() < 0.5 ? pair.from : pair.to;
    setPair({ from: visible, to: digit, dir });
    if (instant) {
      progress.jump(1);
      setPair({ from: digit, to: digit, dir });
      return;
    }
    progress.jump(0);
    const c = animate(progress, 1, { ...rollSpring, onComplete: () => setPair((p) => ({ ...p, from: p.to })) });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digit]);

  const d = pair.dir;
  const outT = useTransform(progress, (p) => `translateY(${-d * p * 100}%)`);
  const inT = useTransform(progress, (p) => `translateY(${d * (1 - p) * 100}%)`);

  return (
    <span className="rolling__slot" aria-hidden="true">
      <span className="rolling__ghost">0</span>
      {pair.from !== pair.to && (
        <motion.span className="rolling__digit" style={{ transform: outT }}>
          {pair.from}
        </motion.span>
      )}
      <motion.span className="rolling__digit" style={{ transform: inT }}>
        {pair.to}
      </motion.span>
    </span>
  );
}
