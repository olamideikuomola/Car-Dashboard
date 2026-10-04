import { motion, useTransform, type MotionValue, type SVGMotionProps } from "motion/react";
import { tween, type DurationToken } from "../motion/tokens";
import { useMotionPrefs } from "../motion/MotionProfileProvider";

type Common = Omit<SVGMotionProps<SVGPathElement>, "style" | "initial" | "animate" | "transition">;

/**
 * An SVG path that draws itself with pathLength.
 * - `progress`: tie the drawn length to a live motion value (route ahead of the car).
 * - `draw`: a one-shot draw on mount, from 0 to full (wake-up route line, limit ring).
 * `start` offsets the visible stretch, so a path can show only the part after the car.
 */
export function DrawPath({
  progress,
  start,
  draw,
  ...rest
}: Common & {
  progress?: MotionValue<number>;
  start?: MotionValue<number>;
  draw?: { duration: DurationToken; delay?: number; key?: string | number };
}) {
  const { reduced } = useMotionPrefs();
  const zero = useTransform(() => 0);
  const offset = start ?? zero;
  const length = useTransform(() => {
    const s = offset.get();
    const p = progress ? progress.get() : 1;
    return Math.max(0, p - s);
  });

  if (draw) {
    return (
      <motion.path
        key={draw.key}
        initial={reduced ? { opacity: 0 } : { pathLength: 0 }}
        animate={reduced ? { opacity: 1 } : { pathLength: 1 }}
        transition={reduced ? tween("short") : { ...tween(draw.duration, "inOutQuart"), delay: draw.delay ?? 0 }}
        {...rest}
      />
    );
  }
  return <motion.path style={{ pathLength: length, pathOffset: offset }} {...rest} />;
}
