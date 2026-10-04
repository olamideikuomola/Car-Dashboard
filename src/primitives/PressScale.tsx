import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { amp, spring } from "../motion/tokens";
import { useMotionPrefs } from "../motion/MotionProfileProvider";

const SCALE = { press: amp.pressScale, strong: amp.pressScaleStrong, dock: amp.dockPressScale } as const;

/**
 * A button with press feedback on spring-press: down within the first frames of contact,
 * released the moment the pointer lifts, interruptible both ways. Works for keyboard
 * activation too (Motion's tap gesture handles Enter and Space).
 * strength: press 0.96 (tiles), strong 0.94 (temperature), dock 0.92 (dock icons).
 */
export const PressScale = forwardRef<HTMLButtonElement, HTMLMotionProps<"button"> & { strength?: keyof typeof SCALE }>(
  function PressScale({ strength = "press", style, type = "button", ...rest }, ref) {
    const { reduced } = useMotionPrefs();
    return (
      <motion.button
        ref={ref}
        type={type}
        style={{ transform: "scale(1)", ...style }}
        whileTap={reduced ? undefined : { transform: `scale(${SCALE[strength]})` }}
        transition={spring.press}
        {...rest}
      />
    );
  },
);
