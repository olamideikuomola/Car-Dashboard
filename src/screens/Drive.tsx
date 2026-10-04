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
import { Icon } from "../components/icons/Icon";
import { IconButton } from "../components/IconButton";
import { ModeSegment } from "../components/ModeSegment";
import { TempStepper } from "../components/TempStepper";
import { TripStat } from "../components/TripStat";
import { RollingNumber, RollingText } from "../primitives/RollingNumber";
import { PressScale } from "../primitives/PressScale";
import { MorphIcon } from "../primitives/MorphIcon";
import { AcButton, DockBar, FanButton, HeatButton } from "../components/Climate";
import { rememberCardRect, setOpener, takeOpener } from "../motion/sharedCard";
import { SpringBar } from "../primitives/SpringBar";
import { SharedIndicator } from "../primitives/SharedIndicator";
import { WakeRise } from "../motion/WakeRise";
import { useWakeGate, useWaking, wakeDelay } from "../motion/wake";
import { amp, duration, ease, spring, staggerDelay, tween } from "../motion/tokens";
import { useMotionPrefs } from "../motion/MotionProfileProvider";
import { TICK_MS, live, useVehicle } from "../sim/useVehicleSim";
import type { Gear } from "../sim/types";
import { MapView } from "./MapView";
import "./drive.css";

const GEARS: Gear[] = ["P", "R", "N", "D"];
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

const RING_R = 38;
const RING_W = 8;
const RING_W_OVER = 12;

/**
 * Speed limit sign. New limit: the sign flips on its Y axis to the new number. Over the limit:
 * the ring thickens and pulses twice, then holds; the label also changes, so it never relies
 * on motion alone. The ring strokes on during wake-up.
 */
function LimitSign({ waking }: { waking: boolean }) {
  const limit = useVehicle((s) => s.limit);
  const { reduced } = useMotionPrefs();
  const [shown, setShown] = useState(limit);
  const [over, setOver] = useState(false);
  const rot = useMotionValue(0);
  const pulse = useMotionValue(1);
  const transform = useTransform([rot, pulse], ([r, p]) => `perspective(400px) rotateY(${r}deg) scale(${p})`);

  // Over the limit, judged on the displayed (rounded) speed.
  useMotionValueEvent(live.speed, "change", (v) => {
    const o = Math.round(v) > limit;
    if (o !== over) setOver(o);
  });
  useEffect(() => setOver(Math.round(live.speed.get()) > limit), [limit]);

  // New limit: flip out edge-on, swap the number, flip back in on spring-expressive.
  useEffect(() => {
    if (limit === shown) return;
    if (reduced) {
      setShown(limit);
      return;
    }
    let inner: { stop: () => void } | null = null;
    const out = animate(rot, 90, {
      ...tween("short", "inOutQuart"),
      onComplete: () => {
        setShown(limit);
        rot.jump(-90);
        inner = animate(rot, 0, spring.expressive);
      },
    });
    return () => {
      out.stop();
      inner?.stop();
      rot.jump(0);
      setShown(limit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  // Two pulses when going over, then hold. Not user-reversible, so keyframes are fine here.
  useEffect(() => {
    if (!over || reduced) return;
    const c = animate(pulse, [1, amp.scalePeakStrong, 1, amp.scalePeakStrong, 1], { duration: duration.slow * 2, ease: ease.inOutQuart });
    return () => c.stop();
  }, [over, reduced, pulse]);

  const w = over ? RING_W_OVER : RING_W;
  return (
    <div className={`limit ${over ? "is-over" : ""}`}>
      <motion.div className="limit__sign" style={{ transform }}>
        <svg className="limit__svg" width="84" height="84" viewBox="0 0 84 84" aria-hidden="true">
          <circle cx="42" cy="42" r={RING_R} fill="var(--sign-bg)" />
          <motion.circle
            cx="42"
            cy="42"
            fill="none"
            stroke="var(--sign-ring)"
            transform="rotate(-90 42 42)"
            initial={waking ? (reduced ? { opacity: 0, r: 42 - w / 2, strokeWidth: w } : { pathLength: 0, r: 42 - w / 2, strokeWidth: w }) : false}
            animate={{ pathLength: 1, opacity: 1, r: 42 - w / 2, strokeWidth: w }}
            transition={{
              pathLength: { ...tween("slow", "inOutQuart"), delay: waking ? wakeDelay("limitRing") : 0 },
              opacity: tween("short"),
              r: reduced ? { duration: 0 } : spring.expressive,
              strokeWidth: reduced ? { duration: 0 } : spring.expressive,
            }}
          />
        </svg>
        <span className="limit__value">{shown}</span>
      </motion.div>
      <span className="limit__label">{over ? "Over limit" : "Limit"}</span>
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

  // The new card's arrow starts at the previous manoeuvre and rotates to the new one.
  const prevDir = useRef(turn.direction);
  const fromDir = useRef(turn.direction);
  if (prevDir.current !== turn.direction) {
    fromDir.current = prevDir.current;
    prevDir.current = turn.direction;
  }

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
          <TurnCard near={near} still={reduced} from={fromDir.current} direction={turn.direction} road={turn.road} />
        </motion.div>
      </AnimatePresence>
    </WakeRise>
  );
}

/**
 * One instruction. The arrow rotates (on its Y axis, which mirrors right into left) from the
 * previous manoeuvre to this one. When the card leaves, its distance freezes.
 */
function TurnCard({ near, still, from, direction, road }: { near: boolean; still: boolean; from: "left" | "right"; direction: "left" | "right"; road: string }) {
  const present = useIsPresent();
  const deg = (d: "left" | "right") => (d === "left" ? 180 : 0);
  return (
    <motion.div
      className={`next-turn ${near ? "is-near" : ""}`}
      initial={false}
      animate={{ transform: near && present && !still ? `scale(${amp.scalePeak})` : "scale(1)" }}
      transition={spring.expressive}
    >
      <div className="next-turn__icon">
        <motion.span
          className="next-turn__arrow"
          initial={{ transform: `perspective(200px) rotateY(${deg(still ? direction : from)}deg)` }}
          animate={{ transform: `perspective(200px) rotateY(${deg(direction)}deg)` }}
          transition={still ? { duration: 0 } : spring.expressive}
        >
          <Icon name="turn-right" />
        </motion.span>
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

/** Trip. The NOW to HOME line fills on spring-value; ETA, minutes, km and arrival % roll when they change. */
function Trip() {
  const s = useVehicle();
  return (
    <div className="trip">
      <div className="trip__arrive">
        <span className="trip__arrive-label">Arrive</span>
        <RollingText className="trip__arrive-time" text={s.arrive} aria-label="Arrive" />
      </div>
      <div className="trip__route">
        <span>NOW</span>
        <SpringBar value={live.tripProgress} className="trip__track" fillClassName="trip__fill" />
        <span>HOME</span>
      </div>
      <div className="trip__stats">
        <TripStat label="Time" value={<RollingText text={`${s.minutesLeft} min`} />} />
        <TripStat label="Distance" value={<RollingText text={`${s.kmLeft.toFixed(1)} km`} />} />
        <TripStat label="On arrival" value={<RollingText text={`${s.arrivalBattery}%`} />} />
      </div>
    </div>
  );
}

/**
 * Vehicle card. The tyre alert slides down and expands, and its amber dot sends out two rings;
 * dismissing it slides it left and collapses it. Opening Vehicle health records the card's rect
 * so the health panel can grow out of it.
 */
function VehicleCard() {
  const s = useVehicle();
  const { reduced } = useMotionPrefs();
  const card = useRef<HTMLDivElement>(null);
  const open = (from: "alert" | "link") => {
    const el = card.current?.closest("section");
    if (el) rememberCardRect(el);
    setOpener(from);
    s.setScreen("health");
  };
  // Rings only for an alert that arrives while the card is on screen, not on first render.
  const mounted = useRef(false);
  useEffect(() => void (mounted.current = true), []);
  // Coming back from Vehicle health: focus returns to whatever opened it.
  useEffect(() => {
    const from = takeOpener();
    if (!from) return;
    const target = card.current?.querySelector<HTMLElement>(from === "alert" ? ".alert" : ".vehicle__link") ?? card.current?.querySelector<HTMLElement>(".vehicle__link");
    target?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={card} className="vehicle__inner">
      <div className="vehicle__head">
        <h2 className="vehicle__title">Vehicle</h2>
        <button type="button" className="vehicle__link hit-56" onClick={() => open("link")}>
          View all
        </button>
      </div>
      <AnimatePresence initial={false}>
        {s.tyreAlert && (
          <motion.div
            key="alert"
            className="alert-wrap"
            initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0, transform: "translateY(-8px)" }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, height: "auto", transform: "translateY(0px)" }}
            exit={
              reduced
                ? { opacity: 0, transition: tween("short") }
                : { opacity: 0, height: 0, transform: `translateX(${-amp.rise}px)`, transition: tween("normal") }
            }
            transition={reduced ? tween("short") : { height: tween("normal"), opacity: tween("normal"), transform: spring.expressive }}
          >
            <PressScale className="alert" onClick={() => open("alert")}>
              <span className="alert__dot" aria-hidden="true">
                {mounted.current && !reduced && [0, 1].map((i) => (
                  <motion.span
                    key={i}
                    className="alert__ring"
                    initial={{ opacity: 0.6, transform: "scale(1)" }}
                    animate={{ opacity: 0, transform: "scale(3)" }}
                    transition={{ ...tween("slow"), delay: tween("normal").duration + i * duration.normal }}
                  />
                ))}
              </span>
              <span className="alert__text">
                <span className="alert__title">Front left tyre low</span>
                <span className="alert__sub">
                  <span className="mono">{s.tyres.fl.toFixed(1)} BAR</span>
                  <span>· check at your next stop</span>
                </span>
              </span>
            </PressScale>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="service">
        <div className="service__left">
          <span className="service__dot" aria-hidden="true" />
          <span>Service due</span>
        </div>
        <span className="service__km">IN {km(s.serviceKm)} KM</span>
      </div>
    </div>
  );
}

/**
 * Media. Track change: the art slides 24px in the skip direction from 0.96 and a 2px blur to
 * sharp, and the title slides up. Play and pause: the icon turns a quarter. Progress: linear.
 */
function Media() {
  const s = useVehicle();
  const { reduced } = useMotionPrefs();
  const d = s.trackDir;
  const art = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, filter: `blur(${amp.crossfadeBlur}px)`, transform: `translateX(${d * amp.mediaShift}px) scale(${amp.mediaScaleFrom})` },
        animate: { opacity: 1, filter: "blur(0px)", transform: "translateX(0px) scale(1)" },
        exit: { opacity: 0, transform: `translateX(${-d * amp.mediaShift}px) scale(${amp.mediaScaleFrom})`, transition: tween("normal") },
      };
  const text = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, transform: `translateY(${amp.rise / 3}px)` },
        animate: { opacity: 1, transform: "translateY(0px)" },
        exit: { opacity: 0, transform: `translateY(${-amp.rise / 3}px)`, transition: tween("short") },
      };
  const t = reduced ? tween("short") : { transform: spring.expressive, opacity: tween("normal"), filter: tween("normal") };
  return (
    <>
      <div className="media__now">
        <div className="media__art-slot">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div key={s.track.id} className="media__art" style={{ background: s.track.art }} {...art} transition={t} />
          </AnimatePresence>
        </div>
        <div className="media__meta">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div key={s.track.id} className="media__meta-inner" {...text} transition={t}>
              <span className="media__title">{s.track.title}</span>
              <span className="media__sub">{s.track.subtitle}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <SpringBar value={live.trackProgress} follow="linear" linearStep={TICK_MS / 1000} className="media__progress" fillClassName="media__progress-fill" />
      <div className="media__transport">
        <IconButton icon="skip-back" label="Previous track" variant="ghost" size={56} round onClick={() => s.changeTrack(-1)} />
        <IconButton label={s.playing ? "Pause" : "Play"} variant="solid" round onClick={s.togglePlaying}>
          <MorphIcon name={s.playing ? "pause" : "play"} />
        </IconButton>
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
          <AcButton on={s.ac} onToggle={s.toggleAc} />
        </WakeRise>
        <WakeRise kind="item" waking={waking} delay={at(2)}>
          <FanButton level={s.fan} onCycle={s.cycleFan} />
        </WakeRise>
        <WakeRise kind="item" waking={waking} delay={at(3)}>
          <HeatButton icon="defrost" label="Rear defrost" on={s.defrost} onToggle={s.toggleDefrost} />
        </WakeRise>
        <WakeRise kind="item" waking={waking} delay={at(4)}>
          <HeatButton icon="seat-heat" label="Seat heating" on={s.seatHeat} onToggle={s.toggleSeatHeat} />
        </WakeRise>
      </div>
      <WakeRise kind="item" waking={waking} delay={at(5)}>
        <DockBar active={s.dock} onSelect={s.setDock} />
      </WakeRise>
      <WakeRise kind="item" waking={waking} delay={at(6)}>
        <TempStepper label="Passenger" value={s.tempPassenger} onStep={(d) => s.stepTemp("passenger", d)} />
      </WakeRise>
    </>
  );
}
