import { motion, useTransform, type MotionValue } from "motion/react";

/**
 * Renders a motion value as text without React re-renders. Phase 4 replaces the
 * numeric ones with RollingNumber; this stays for plain readouts.
 */
export function LiveText({ value, format, className }: { value: MotionValue<number>; format: (v: number) => string; className?: string }) {
  const text = useTransform(value, format);
  return <motion.span className={className}>{text}</motion.span>;
}
