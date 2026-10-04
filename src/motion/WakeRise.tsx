import { motion, type HTMLMotionProps } from "motion/react";
import { amp, spring, tween } from "./tokens";
import { useMotionPrefs } from "./MotionProfileProvider";

type Kind = "panel" | "item";
type Tag = "div" | "section" | "footer";

/**
 * Wake-up entrance. panel: rises 24px out of an 8px blur on spring-dramatic. item: rises a
 * third of that on spring-expressive, for the climate and dock cascade and the nav card.
 * Not waking: renders in place with no animation. Reduced or calm: opacity only, no delay.
 */
export function WakeRise({
  as = "div",
  kind = "panel",
  waking,
  delay = 0,
  ...rest
}: { as?: Tag; kind?: Kind; waking: boolean; delay?: number } & HTMLMotionProps<"div">) {
  const { reduced } = useMotionPrefs();
  const M = motion[as] as typeof motion.div;

  if (!waking) return <M {...rest} />;

  if (reduced) {
    return <M initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={tween("short")} {...rest} />;
  }

  const rise = kind === "panel" ? amp.rise : amp.rise / 3;
  const from = kind === "panel" ? { filter: `blur(${amp.riseBlur}px)` } : {};
  const to = kind === "panel" ? { filter: "blur(0px)", transitionEnd: { filter: "none" } } : {};
  return (
    <M
      initial={{ opacity: 0, transform: `translateY(${rise}px)`, ...from }}
      animate={{ opacity: 1, transform: "translateY(0px)", ...to }}
      transition={{
        transform: { ...(kind === "panel" ? spring.dramatic : spring.expressive), delay },
        opacity: { ...tween("slow"), delay },
        filter: { ...tween("slow"), delay },
      }}
      {...rest}
    />
  );
}
