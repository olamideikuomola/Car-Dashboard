import { AnimatePresence, motion } from "motion/react";
import { Icon, type IconName } from "../components/icons/Icon";
import { amp, tween } from "../motion/tokens";
import { useMotionPrefs } from "../motion/MotionProfileProvider";
import "./primitives.css";

type Style = "turn" | "blur";

const variants = {
  turn: {
    enter: { opacity: 0, transform: "rotate(-90deg) scale(0.9)" },
    center: { opacity: 1, transform: "rotate(0deg) scale(1)" },
    exit: { opacity: 0, transform: "rotate(90deg) scale(0.9)" },
  },
  blur: {
    enter: { opacity: 0, filter: `blur(${amp.crossfadeBlur}px)`, transform: "scale(0.9)" },
    center: { opacity: 1, filter: "blur(0px)", transform: "scale(1)" },
    exit: { opacity: 0, filter: `blur(${amp.crossfadeBlur}px)`, transform: "scale(0.9)" },
  },
};

const fade = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Swaps one icon for another in place at duration-short. turn: a quarter turn (play and pause).
 * blur: a 2px blur crossfade (Add stop to check). Both icons share one grid cell, so nothing
 * shifts, and a fast second swap retargets instead of queueing.
 */
export function MorphIcon({ name, look = "turn", size = 24 }: { name: IconName; look?: Style; size?: number }) {
  const { reduced } = useMotionPrefs();
  const v = reduced ? fade : variants[look];
  return (
    <span className="morph-icon" style={{ width: size, height: size }}>
      <AnimatePresence initial={false}>
        <motion.span key={name} style={{ display: "grid" }} variants={v} initial="enter" animate="center" exit="exit" transition={tween("short")}>
          <Icon name={name} size={size} />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
