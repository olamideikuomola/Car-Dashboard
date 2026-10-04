import { Fragment, useLayoutEffect, useRef, type ReactNode } from "react";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { indicatorSpring, type StaggerMode } from "../motion/tokens";
import { useMotionPrefs } from "../motion/MotionProfileProvider";
import "./primitives.css";

type Props<T extends string> = {
  items: readonly T[];
  active: T;
  /** expressive by default; dramatic for gear into D. Read when `active` changes. */
  mode?: StaggerMode;
  /** Renders one item. Spread `bind` onto its root element so it can be measured. */
  renderItem: (item: T, selected: boolean, bind: { "data-ind": string }) => ReactNode;
  /**
   * Optional active-colour copy of each label. It is clipped to the pill's exact position every
   * frame, so the label colour changes under the pill instead of crossfading on a timer.
   */
  renderActiveLabel?: (item: T) => ReactNode;
  className?: string;
  pillClassName?: string;
  /** Pill corner radius, for the label clip. */
  radius?: number;
};

/**
 * One active pill that travels between items (gear letters, mode segments, dock items).
 * Position is a measured motion value, animated on a spring whose bounce is solved so the
 * overshoot equals the amplitude token for that travel. Interrupting retargets mid-flight.
 */
export function SharedIndicator<T extends string>({
  items,
  active,
  mode = "expressive",
  renderItem,
  renderActiveLabel,
  className = "",
  pillClassName = "",
  radius = 0,
}: Props<T>) {
  const { reduced } = useMotionPrefs();
  const root = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const w = useMotionValue(0);
  const h = useMotionValue(0);
  const W = useMotionValue(0);
  const H = useMotionValue(0);
  const ready = useRef(false);

  // Declared before the layout effect below: their subscriptions must exist before it sets x,
  // or the first position (and every jump under reduced motion) is missed.
  const pillTransform = useTransform([x, y], ([px, py]) => `translate(${px}px, ${py}px)`);
  const clip = useTransform([x, y, w, h, W, H], ([px, py, pw, ph, bw, bh]) =>
    `inset(${py}px ${(bw as number) - (px as number) - (pw as number)}px ${(bh as number) - (py as number) - (ph as number)}px ${px}px round ${radius}px)`,
  );


  useLayoutEffect(() => {
    const box = root.current;
    const el = box?.querySelector<HTMLElement>(`:scope > [data-ind="${active}"]`);
    if (!el || !box) return;
    // offsetLeft/Top ignore transforms, so press scales and stage scaling don't skew the target.
    const tx = el.offsetLeft;
    w.set(el.offsetWidth);
    h.set(el.offsetHeight);
    y.set(el.offsetTop);
    W.set(box.offsetWidth);
    H.set(box.offsetHeight);
    if (!ready.current || reduced) {
      x.jump(tx);
      ready.current = true;
      return;
    }
    const controls = animate(x, tx, indicatorSpring(mode, tx - x.get()));
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div ref={root} className={`indicator-group ${className}`}>
      <motion.div className={`indicator-group__pill ${pillClassName}`} style={{ transform: pillTransform, width: w, height: h }} aria-hidden="true" />
      {items.map((item) => (
        <Fragment key={item}>{renderItem(item, item === active, { "data-ind": item })}</Fragment>
      ))}
      {renderActiveLabel && (
        // Same layout class as the group, so every copied label sits exactly over its original.
        <motion.div className={`${className} indicator-group__labels`} style={{ clipPath: clip }} aria-hidden="true">
          {items.map((item) => (
            <Fragment key={item}>{renderActiveLabel(item)}</Fragment>
          ))}
        </motion.div>
      )}
    </div>
  );
}
