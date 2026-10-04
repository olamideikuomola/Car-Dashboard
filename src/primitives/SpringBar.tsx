import { useEffect, useRef, type ReactNode } from "react";
import { animate, isMotionValue, motion, motionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import { ease, springOptions } from "../motion/tokens";
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
  follow = "spring",
  linearStep = 0.1,
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
  /**
   * spring (default): spring-value. linear: constant motion between updates arriving every
   * `linearStep` seconds (media progress); a step backwards (new track) jumps.
   */
  follow?: "spring" | "linear";
  linearStep?: number;
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
    let run: { stop: () => void } | null = null;
    const update = (v: number) => {
      if (follow === "linear") {
        run?.stop();
        if (v < level.get()) level.jump(v);
        else run = animate(level, v, { duration: linearStep, ease: ease.linear });
      } else if (reduced) level.jump(v);
      else level.set(v);
    };
    update(source.get());
    const off = source.on("change", update);
    return () => {
      off();
      run?.stop();
    };
  }, [source, level, reduced, follow, linearStep]);

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
