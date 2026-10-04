import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useIsPresent,
  useMotionValueEvent,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { Icon, type IconName } from "../components/icons/Icon";
import { IconButton } from "../components/IconButton";
import { ModeSegment } from "../components/ModeSegment";
import { TempStepper } from "../components/TempStepper";
import { TripStat } from "../components/TripStat";
import { RollingNumber } from "../primitives/RollingNumber";
import { SpringBar } from "../primitives/SpringBar";
import { SharedIndicator } from "../primitives/SharedIndicator";
import { DrawPath } from "../primitives/DrawPath";
import { WakeRise } from "../motion/WakeRise";
import { useWakeGate, useWaking, wakeDelay } from "../motion/wake";
import { amp, spring, staggerDelay, tween } from "../motion/tokens";
import { useMotionPrefs } from "../motion/MotionProfileProvider";
import { live, useVehicle } from "../sim/useVehicleSim";
import type { Dock, Gear } from "../sim/types";
import { MapView } from "./MapView";
import "./drive.css";

const GEARS: Gear[] = ["P", "R", "N", "D"];
const DOCK: { id: Dock; icon: IconName; label: string }[] = [
  { id: "nav", icon: "navigation", label: "Navigation" },
  { id: "media", icon: "media", label: "Media" },
  { id: "phone", icon: "phone", label: "Phone" },
  { id: "car", icon: "car", label: "Car" },
];
const NEAR_TURN_M = 100;

const km = (n: number) => n.toLocaleString("en-GB");
const fmtDistance = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m >= 100 ? Math.round(m / 10) * 10 : Math.floor(m)} m`);
const fmtInt = (n: number) => String(Math.round(n));
const fmtPct = (n: number) => `${Math.round(n)}%`;

/** Drive screen, Figma 4:2 (Night) and 5:66 (Day). One structure, the theme switches the tokens. */
export function Drive() {
  const waking = useWaking();
  const gear = useVehicle((s) => s.gear);
  const [sweep, setSweep] = useState(0);

  // Gear into D: one accent sweep along the battery bar (the numeral swell lives in SpeedReadout).
  const prevGear = useRef(gear);
  useEffect(() => {
    if (gear === "D" && prevGear.current !== "D") setSweep((n) => n + 1);
    prevGear.current = gear;
  }, [gear]);

  return (
    <div className="drive" data-gear={gear}>
      <div className="drive__main">
        <WakeRise as="section" waking={waking} delay={staggerDelay("dramatic", 0)} className="panel driving" aria-label="Driving">
          <header className="driving__header">
            <GearSelector />
            <Clock />
          </header>
          <div className="speed">
            <SpeedReadout waking={waking} />
            <LimitSign waking={waking} />
          </div>
          <div className="mode-battery">
            <ModeControl />
            <Battery waking={waking} sweep={sweep} />
          </div>
        </WakeRise>

        <WakeRise as="section" waking={waking} delay={staggerDelay("dramatic", 1)} className="navigation park-lift" aria-label="Navigation">
          <MapView waking={waking} />
          <NextTurn waking={waking} />
          <Trip />
        </WakeRise>

        <div className="status-media">
          <WakeRise as="section" waking={waking} delay={staggerDelay("dramatic", 2)} className="panel vehicle park-lift" aria-label="Vehicle">
            <VehicleCard />
          </WakeRise>
          <WakeRise as="section" waking={waking} delay={staggerDelay("dramatic", 3)} className="panel media park-lift" aria-label="Media">
            <Media />
          </WakeRise>
        </div>
      </div>

      <WakeRise as="footer" waking={waking} delay={staggerDelay("dramatic", 4)} className="panel controls" aria-label="Climate and shortcuts">
        <Controls waking={waking} />
      </WakeRise>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function GearSelector() {
  const gear = useVehicle((s) => s.gear);
  const setGear = useVehicle((s) => s.setGear);
  return (
    <div role="radiogroup" aria-label="Gear">
      <SharedIndicator
        items={GEARS}
        active={gear}
        mode={gear === "D" ? "dramatic" : "expressive"}
        className="gears"
        pillClassName="gear-pill"
        radius={10}
        renderItem={(g, selected, bind) => (
          <button {...bind} key={g} type="button" role="radio" aria-checked={selected} className="gear hit-56" onClick={() => setGear(g)}>
            {g}
          </button>
        )}
        renderActiveLabel={(g) => (
          <span key={g} className="gear gear--on">
            {g}
          </span>
        )}
      />
    </div>
  );
}

/** The clock and outside temperature stay still. */
function Clock() {
  const clock = useVehicle((s) => s.clock);
  const outside = useVehicle((s) => s.outsideTemp);
  return (
    <div className="clock">
      <span>{clock}</span>
      <span className="clock__rule" aria-hidden="true" />
      <span>{outside}°C</span>
    </div>
  );
}

/**
 * The hero. Digits roll on spring-value and retarget every tick. Into D: swells to 1.06 and
 * settles on spring-dramatic. Sport: weight 200 to 300 on the variable axis.
 */
function SpeedReadout({ waking }: { waking: boolean }) {
  const gear = useVehicle((s) => s.gear);
  const mode = useVehicle((s) => s.mode);
  const { reduced } = useMotionPrefs();
  const speed = useWakeGate(live.speed, "speed", waking);

  const scale = useMotionValue(1);
  const transform = useTransform(scale, (s) => `scale(${s})`);
  const prev = useRef(gear);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  useEffect(() => {
    const intoD = gear === "D" && prev.current !== "D";
    prev.current = gear;
    if (!intoD || reduced) return;
    anim.current?.stop();
    anim.current = animate(scale, amp.scalePeakStrong, {
      ...tween("short"),
      onComplete: () => void (anim.current = animate(scale, 1, spring.dramatic)),
    });
  }, [gear, reduced, scale]);
  useEffect(() => () => anim.current?.stop(), []);

  return (
    <div className="speed__readout">
      <motion.div className="speed__scale" style={{ transform }}>
        <motion.div
          className="speed__value"
          initial={false}
          animate={{ fontWeight: mode === "Sport" ? 300 : 200 }}
          transition={reduced ? { duration: 0 } : spring.expressive}
        >
          <RollingNumber value={speed} from={waking ? 0 : undefined} smooth="value" format={fmtInt} aria-label="Speed" />
        </motion.div>
      </motion.div>
      <span className="speed__unit">KM/H</span>
    </div>
  );
}

const RING = "M42 4A38 38 0 1 1 41.99 4";

/** Speed limit sign. The ring strokes on during wake-up. */
function LimitSign({ waking }: { waking: boolean }) {
  const limit = useVehicle((s) => s.limit);
  return (
    <div className="limit">
      <div className="limit__sign">
        <svg className="limit__svg" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
          <circle cx="42" cy="42" r="38" fill="var(--sign-bg)" />
          {waking ? (
            <DrawPath d={RING} draw={{ duration: "slow", delay: wakeDelay("limitRing") }} stroke="var(--sign-ring)" strokeWidth={8} fill="none" />
          ) : (
            <path d={RING} stroke="var(--sign-ring)" strokeWidth={8} fill="none" />
          )}
        </svg>
        <span className="limit__value">{limit}</span>
      </div>
      <span className="limit__label">Limit</span>
    </div>
  );
}

function ModeControl() {
  const mode = useVehicle((s) => s.mode);
  const setMode = useVehicle((s) => s.setMode);
  return <ModeSegment value={mode} onChange={setMode} />;
}

function Battery({ waking, sweep }: { waking: boolean; sweep: number }) {
  const battery = useVehicle((s) => s.battery);
  const range = useVehicle((s) => s.range);
  const { reduced } = useMotionPrefs();
  const level = useMotionValue(battery);
  useEffect(() => level.set(battery), [battery, level]);
  const gated = useWakeGate(level, "battery", waking);
  const fill = useTransform(gated, (b) => b / 100);

  return (
    <div className="battery">
      <div className="battery__row">
        <div className="battery__pct">
          <RollingNumber className="battery__value" value={gated} from={waking ? 0 : undefined} smooth="value" format={fmtPct} aria-label="Battery" />
          <span className="battery__label">Battery</span>
        </div>
        <div className="battery__range">
          <RollingNumber className="battery__range-value" value={range} smooth="expressive" aria-label="Range" />
          <span className="battery__label">km range</span>
        </div>
      </div>
      <SpringBar
        value={fill}
        from={waking ? 0 : undefined}
        className="battery__bar"
        fillClassName={`battery__fill ${battery < 20 ? "is-low" : ""}`}
        fillChildren={
          sweep > 0 && !reduced ? (
            <motion.span
              key={sweep}
              className="battery__sweep"
              initial={{ transform: "translateX(-100%)" }}
              animate={{ transform: "translateX(100%)" }}
              transition={tween("slow", "inOutQuart")}
            />
          ) : null
        }
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Next turn. The distance counts down live. Under 100 m the card swells to 1.03 and the icon
 * fill brightens; after the turn it slides up and out as the next instruction rises from below.
 */
function NextTurn({ waking }: { waking: boolean }) {
  const turn = useVehicle((s) => s.turn);
  const turnIndex = useVehicle((s) => s.turnIndex);
  const { reduced } = useMotionPrefs();
  const [near, setNear] = useState(() => live.turnDistance.get() < NEAR_TURN_M);
  useMotionValueEvent(live.turnDistance, "change", (m) => {
    const n = m < NEAR_TURN_M;
    if (n !== near) setNear(n);
  });

  const shift = amp.rise;
  return (
    <WakeRise kind="item" waking={waking} delay={wakeDelay("navCard")} className="next-turn-slot">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={turnIndex}
          className="next-turn-swap"
          initial={reduced ? { opacity: 0 } : { opacity: 0, transform: `translateY(${shift}px)` }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px)" }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, transform: `translateY(${-shift}px)`, transition: tween("normal") }}
          transition={reduced ? tween("short") : { transform: spring.expressive, opacity: tween("normal") }}
        >
          <TurnCard near={near} still={reduced} direction={turn.direction} road={turn.road} />
        </motion.div>
      </AnimatePresence>
    </WakeRise>
  );
}

/** One instruction. When it leaves, its distance freezes instead of showing the next turn's. */
function TurnCard({ near, still, direction, road }: { near: boolean; still: boolean; direction: "left" | "right"; road: string }) {
  const present = useIsPresent();
  return (
    <motion.div
      className={`next-turn ${near ? "is-near" : ""}`}
      initial={false}
      animate={{ transform: near && present && !still ? `scale(${amp.scalePeak})` : "scale(1)" }}
      transition={spring.expressive}
    >
      <div className="next-turn__icon">
        <Icon name="turn-right" style={direction === "left" ? { transform: "scaleX(-1)" } : undefined} />
      </div>
      <div className="next-turn__text">
        <RollingNumber className="next-turn__distance" value={present ? live.turnDistance : 0} format={fmtDistance} />
        <span className="next-turn__road">
          Turn {direction} onto {road}
        </span>
      </div>
    </motion.div>
  );
}

function Trip() {
  const s = useVehicle();
  return (
    <div className="trip">
      <div className="trip__arrive">
        <span className="trip__arrive-label">Arrive</span>
        <span className="trip__arrive-time">{s.arrive}</span>
      </div>
      <div className="trip__route">
        <span>NOW</span>
        <SpringBar value={live.tripProgress} className="trip__track" fillClassName="trip__fill" />
        <span>HOME</span>
      </div>
      <div className="trip__stats">
        <TripStat label="Time" value={`${s.minutesLeft} min`} />
        <TripStat label="Distance" value={`${s.kmLeft.toFixed(1)} km`} />
        <TripStat label="On arrival" value={`${s.arrivalBattery}%`} />
      </div>
    </div>
  );
}

function VehicleCard() {
  const s = useVehicle();
  const open = () => s.setScreen("health");
  return (
    <>
      <div className="vehicle__head">
        <h2 className="vehicle__title">Vehicle</h2>
        <button type="button" className="vehicle__link hit-56" onClick={open}>
          View all
        </button>
      </div>
      {s.tyreAlert && (
        <button type="button" className="alert pressable" onClick={open}>
          <span className="alert__dot" aria-hidden="true" />
          <span className="alert__text">
            <span className="alert__title">Front left tyre low</span>
            <span className="alert__sub">
              <span className="mono">{s.tyres.fl.toFixed(1)} BAR</span>
              <span>· check at your next stop</span>
            </span>
          </span>
        </button>
      )}
      <div className="service">
        <div className="service__left">
          <span className="service__dot" aria-hidden="true" />
          <span>Service due</span>
        </div>
        <span className="service__km">IN {km(s.serviceKm)} KM</span>
      </div>
    </>
  );
}

function Media() {
  const s = useVehicle();
  return (
    <>
      <div className="media__now">
        <div className="media__art" style={{ background: s.track.art }} />
        <div className="media__meta">
          <span className="media__title">{s.track.title}</span>
          <span className="media__sub">{s.track.subtitle}</span>
        </div>
      </div>
      <SpringBar value={live.trackProgress} className="media__progress" fillClassName="media__progress-fill" />
      <div className="media__transport">
        <IconButton icon="skip-back" label="Previous track" variant="ghost" size={56} round onClick={() => s.changeTrack(-1)} />
        <IconButton icon={s.playing ? "pause" : "play"} label={s.playing ? "Pause" : "Play"} variant="solid" round onClick={s.togglePlaying} />
        <IconButton icon="skip-forward" label="Next track" variant="ghost" size={56} round onClick={() => s.changeTrack(1)} />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

/** Climate and dock. During wake-up the items cascade in, 50ms apart, from 700ms. */
function Controls({ waking }: { waking: boolean }) {
  const s = useVehicle();
  const base = wakeDelay("climateDock");
  const at = (i: number) => base + staggerDelay("dramatic", i);
  return (
    <>
      <WakeRise kind="item" waking={waking} delay={at(0)}>
        <TempStepper label="Driver" value={s.tempDriver} onStep={(d) => s.stepTemp("driver", d)} />
      </WakeRise>
      <div className="climate">
        <WakeRise kind="item" waking={waking} delay={at(1)}>
          <button type="button" className={`climate__pill pressable ${s.ac ? "is-on" : ""}`} aria-pressed={s.ac} onClick={s.toggleAc}>
            <Icon name="snowflake" />
            <span>A/C</span>
          </button>
        </WakeRise>
        <WakeRise kind="item" waking={waking} delay={at(2)}>
          <button type="button" className="climate__pill climate__fan pressable" aria-label={`Fan level ${s.fan}`} onClick={s.cycleFan}>
            <Icon name="fan" />
            <span className="mono">{s.fan}</span>
          </button>
        </WakeRise>
        <WakeRise kind="item" waking={waking} delay={at(3)}>
          <IconButton icon="defrost" label="Rear defrost" variant={s.defrost ? "accent" : "tile"} aria-pressed={s.defrost} onClick={s.toggleDefrost} />
        </WakeRise>
        <WakeRise kind="item" waking={waking} delay={at(4)}>
          <IconButton icon="seat-heat" label="Seat heating" variant={s.seatHeat ? "accent" : "tile"} aria-pressed={s.seatHeat} onClick={s.toggleSeatHeat} />
        </WakeRise>
      </div>
      <WakeRise kind="item" waking={waking} delay={at(5)}>
        <nav className="dock" aria-label="Shortcuts">
          {DOCK.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`dock__item pressable ${d.id === s.dock ? "is-active" : ""}`}
              aria-label={d.label}
              aria-current={d.id === s.dock ? "page" : undefined}
              onClick={() => s.setDock(d.id)}
            >
              <Icon name={d.icon} />
            </button>
          ))}
        </nav>
      </WakeRise>
      <WakeRise kind="item" waking={waking} delay={at(6)}>
        <TempStepper label="Passenger" value={s.tempPassenger} onStep={(d) => s.stepTemp("passenger", d)} />
      </WakeRise>
    </>
  );
}
