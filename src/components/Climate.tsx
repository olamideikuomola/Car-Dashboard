import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { Icon, type IconName } from "./icons/Icon";
import { IconButton } from "./IconButton";
import { PressScale } from "../primitives/PressScale";
import { SharedIndicator } from "../primitives/SharedIndicator";
import { RollingText } from "../primitives/RollingNumber";
import { ease, fanDegPerSecPerLevel, tween } from "../motion/tokens";
import { useMotionPrefs } from "../motion/MotionProfileProvider";
import type { Dock } from "../sim/types";

/** A/C. Turning it on grows the accent fill out from where it was tapped; off shrinks it back there. */
export function AcButton({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const { reduced } = useMotionPrefs();
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const at = `${origin.x}% ${origin.y}%`;
  return (
    <PressScale
      className={`climate__pill climate__ac ${on ? "is-on" : ""}`}
      aria-pressed={on}
      onPointerDown={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
      }}
      onClick={(e) => {
        // Keyboard: grow from the centre.
        if (e.detail === 0) setOrigin({ x: 50, y: 50 });
        onToggle();
      }}
    >
      <motion.span
        className="climate__fill"
        aria-hidden="true"
        initial={false}
        animate={reduced ? { opacity: on ? 1 : 0, clipPath: `circle(150% at ${at})` } : { opacity: 1, clipPath: `circle(${on ? 150 : 0}% at ${at})` }}
        transition={reduced ? tween("short") : tween("normal")}
      />
      <Icon name="snowflake" />
      <span>A/C</span>
    </PressScale>
  );
}

/**
 * Fan. The icon turns at a speed set by the level. One infinite WAAPI rotation runs on the
 * compositor; a level change only sets its playbackRate, so it speeds up without restarting.
 * Constant motion, so linear. Stops under reduced motion and at level 0.
 */
export function FanButton({ level, onCycle }: { level: number; onCycle: () => void }) {
  const { reduced } = useMotionPrefs();
  const icon = useRef<HTMLSpanElement>(null);
  const spin = useRef<Animation | null>(null);
  useEffect(() => {
    const el = icon.current;
    if (!el) return;
    spin.current = el.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
      duration: (360 / fanDegPerSecPerLevel) * 1000,
      iterations: Infinity,
      easing: ease.linear,
    });
    return () => spin.current?.cancel();
  }, []);
  useEffect(() => {
    const a = spin.current;
    if (!a) return;
    if (reduced || level <= 0) a.pause();
    else {
      a.playbackRate = level;
      a.play();
    }
  }, [level, reduced]);
  return (
    <PressScale className="climate__pill climate__fan" aria-label={level === 0 ? "Fan off" : `Fan level ${level}`} onClick={onCycle}>
      <span ref={icon} className="fan-icon">
        <Icon name="fan" />
      </span>
      <RollingText className="mono" text={String(level)} />
    </PressScale>
  );
}

/** Rear defrost and seat heating. Switching on sends the heat lines up once. */
export function HeatButton({ icon, label, on, onToggle }: { icon: IconName; label: string; on: boolean; onToggle: () => void }) {
  return <IconButton icon={icon} label={label} variant={on ? "accent" : "tile"} aria-pressed={on} className={on ? "heat-on" : ""} onClick={onToggle} />;
}

const DOCK_ITEMS: { id: Dock; icon: IconName; label: string }[] = [
  { id: "nav", icon: "navigation", label: "Navigation" },
  { id: "media", icon: "media", label: "Media" },
  { id: "phone", icon: "phone", label: "Phone" },
  { id: "car", icon: "car", label: "Car" },
];
const DOCK_IDS = DOCK_ITEMS.map((d) => d.id);

/** Dock. The active background slides between items; the icon dips to 0.92 on press. */
export function DockBar({ active, onSelect }: { active: Dock; onSelect: (d: Dock) => void }) {
  const items = useRef(new Map(DOCK_ITEMS.map((d) => [d.id, d]))).current;
  return (
    <nav aria-label="Shortcuts">
      <SharedIndicator
        items={DOCK_IDS}
        active={active}
        className="dock"
        pillClassName="dock__pill"
        renderItem={(id, selected, bind) => {
          const d = items.get(id)!;
          return (
            <PressScale
              {...bind}
              key={id}
              strength="dock"
              className={`dock__item ${selected ? "is-active" : ""}`}
              aria-label={d.label}
              aria-current={selected ? "page" : undefined}
              onClick={() => onSelect(id)}
            >
              <Icon name={d.icon} />
            </PressScale>
          );
        }}
      />
    </nav>
  );
}
