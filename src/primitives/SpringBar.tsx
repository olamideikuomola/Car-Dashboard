import { useEffect, useRef, type ReactNode } from "react";
import { isMotionValue, motion, motionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { springOptions } from "../motion/tokens";
import { useMotionPrefs } from "../motion/MotionProfileProvider";
import "./primitives.css";

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * A level bar. The fill is full width and slides in from the left with translateX inside a
 * clipped, rounded track, so its rounded end never squashes the way scaleX would.
 * The level follows spring-value; colour changes ride a CSS transition at duration-slow.
 */
export function SpringBar({
  value,
  from,
  className = "",
  fillClassName = "",
  fillStyle,
  children,
  fillChildren,
}: {
  /** 0 to 1, as a number or a live motion value. */
  value: number | MotionValue<number>;
  /** Start level on mount, e.g. 0 for a fill-up. */
  from?: number;
  className?: string;
  fillClassName?: string;
  fillStyle?: React.CSSProperties;
  /** Overlays inside the clipped track. */
  children?: ReactNode;
  /** Overlays inside the fill itself, so they only show on the filled part (the accent sweep). */
  fillChildren?: ReactNode;
}) {
  const { reduced } = useMotionPrefs();
  const own = useRef<MotionValue<number> | null>(null);
  if (!isMotionValue(value) && !own.current) own.current = motionValue<number>(value as number);
  const source: MotionValue<number> = isMotionValue(value) ? (value as MotionValue<number>) : own.current!;
  useEffect(() => {
    if (!isMotionValue(value)) source.set(value as number);
  }, [value, source]);

  const level = useSpring(from ?? source.get(), springOptions("value"));
  useEffect(() => {
    const follow = (v: number) => (reduced ? level.jump(v) : level.set(v));
    follow(source.get());
    return source.on("change", follow);
  }, [source, level, reduced]);

  const transform = useTransform(level, (p) => `translateX(${(clamp01(p) - 1) * 100}%)`);

  return (
    <div className={`spring-bar ${className}`}>
      <motion.div className={`spring-bar__fill ${fillClassName}`} style={{ ...fillStyle, transform }}>
        {fillChildren}
      </motion.div>
      {children}
    </div>
  );
}
