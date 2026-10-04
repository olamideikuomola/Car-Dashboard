import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useMotionValue, type Variants } from "motion/react";
import { Icon } from "../components/icons/Icon";
import { ListRow, type RowTone } from "../components/ListRow";
import { PressScale } from "../primitives/PressScale";
import { MorphIcon } from "../primitives/MorphIcon";
import { RollingNumber, RollingText } from "../primitives/RollingNumber";
import { amp, duration, ease, healthSchedule as at, spring, tween } from "../motion/tokens";
import { useMotionPrefs } from "../motion/MotionProfileProvider";
import { getCardRect, type StageRect } from "../motion/sharedCard";
import type { Tyres } from "../sim/types";
import { useVehicle } from "../sim/useVehicleSim";
import { CarTopView, isLow } from "./CarTopView";
import "./health.css";

/* ------------------------------------------------------------------ */
/* Shared element and first-visit bookkeeping                          */
/* ------------------------------------------------------------------ */

const MAIN: StageRect = { x: 24, y: 24, w: 1216, h: 672 };
const R = 24;
const inset = (r: StageRect) => `inset(${r.y}px ${1920 - r.x - r.w}px ${720 - r.y - r.h}px ${r.x}px round ${R}px)`;

const SEEN_KEY = "car-dash:health-seen";
function firstVisit() {
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false;
    sessionStorage.setItem(SEEN_KEY, "1");
  } catch {
    // Storage blocked: treat every visit as a later visit, so nothing replays endlessly.
    return false;
  }
  return true;
}

const s = (ms: number) => ms / 1000;

/* ------------------------------------------------------------------ */

type Corner = keyof Tyres;
const LABEL: Record<Corner, string> = { fl: "FRONT LEFT", fr: "FRONT RIGHT", rl: "REAR LEFT", rr: "REAR RIGHT" };
/** Clockwise from front left. */
const ORDER: Corner[] = ["fl", "fr", "rr", "rl"];

/**
 * Vehicle health, Figma 5:186. The vehicle card expands into the main panel (a clip-path morph on
 * a full-stage surface, so nothing scales); on the first visit of a session the content follows
 * the health schedule tokens. Back reverses the morph in about 60% of the time.
 */
export function VehicleHealth() {
  const st = useVehicle();
  const { reduced } = useMotionPrefs();
  const [first] = useState(firstVisit);
  const seq = first && !reduced;
  const card = getCardRect();
  const back = useRef<HTMLButtonElement>(null);

  // Focus moves into the new screen as its entry starts.
  useEffect(() => back.current?.focus({ preventScroll: true }), []);

  const lowCount = (Object.values(st.tyres) as number[]).filter(isLow).length;
  const attention = st.reminded ? 0 : lowCount;

  // FL turns amber at 550ms on the first visit; straight away on later visits.
  const [flagged, setFlagged] = useState(!seq);
  useEffect(() => {
    if (!seq) return;
    const id = window.setTimeout(() => setFlagged(true), at.alert);
    return () => window.clearTimeout(id);
  }, [seq]);

  const surface: Variants = reduced
    ? { from: { opacity: 0, clipPath: inset(MAIN) }, in: { opacity: 1, clipPath: inset(MAIN), transition: tween("short") }, out: { opacity: 0, transition: tween("short") } }
    : {
        from: { clipPath: inset(card) },
        in: { clipPath: inset(MAIN), transition: tween("xslow", "inOutQuart") },
        // Back: shrink onto the card, and hand over to the real card underneath over the last stretch.
        out: {
          clipPath: inset(card),
          opacity: [1, 1, 0],
          transition: {
            clipPath: { duration: duration.xslow * amp.backRatio, ease: ease.inOutQuart },
            opacity: { duration: duration.xslow * amp.backRatio, times: [0, 0.7, 1], ease: ease.outQuint },
          },
        },
      };
  // Content inside the surface leaves quickly on the way back so the card shrinks clean.
  const contentOut: Variants = { out: { opacity: 0, transition: tween("short") } };
  const side: Variants = reduced
    ? { from: { opacity: 0 }, in: { opacity: 1, transition: tween("short") }, out: { opacity: 0, transition: tween("short") } }
    : {
        from: { opacity: 0, transform: `translateX(${amp.rise}px)` },
        // Held back a beat so the card visibly grows out of their corner first (the surface stacks above them).
        in: {
          opacity: 1,
          transform: "translateX(0px)",
          transition: { opacity: { ...tween("normal"), delay: duration.normal }, transform: { ...spring.expressive, delay: duration.normal } },
        },
        out: { opacity: 0, transition: tween("short") },
      };

  return (
    <motion.div className="health" initial="from" animate="in" exit="out">
      <motion.div className="health__surface" variants={surface}>
        <motion.section className="health__main" aria-label="Tyres and status" variants={contentOut}>
          <Rise as="header" className="health__header" seq={seq} delay={at.header} from="left">
            <PressScale ref={back} className="icon-btn icon-btn--tile health__back" style={{ width: 56, height: 56 }} aria-label="Back to Drive" onClick={() => st.setScreen("drive")}>
              <Icon name="chevron-left" />
            </PressScale>
            <div className="health__titles">
              <h1 className="health__title">Vehicle health</h1>
              <p className="health__sub">
                <RollingText text={String(attention)} /> {attention === 1 ? "item needs" : "items need"} attention · {st.reminded ? "reminder set" : "checked 2 min ago"}
              </p>
            </div>
          </Rise>

          <div className="tyres">
            <div className="tyres__col tyres__col--left">
              <TyreReadout corner="fl" bar={st.tyres.fl} align="end" seq={seq} flagged={flagged} />
              <TyreReadout corner="rl" bar={st.tyres.rl} align="end" seq={seq} flagged={flagged} />
            </div>
            <CarRise seq={seq}>
              <CarTopView tyres={st.tyres} glow={seq && flagged} />
            </CarRise>
            <div className="tyres__col tyres__col--right">
              <TyreReadout corner="fr" bar={st.tyres.fr} align="start" seq={seq} flagged={flagged} />
              <TyreReadout corner="rr" bar={st.tyres.rr} align="start" seq={seq} flagged={flagged} />
            </div>
          </div>

          <Rise className="tip" seq={seq} delay={at.tip}>
            <motion.span
              className="tip__icon"
              initial={false}
              animate={seq ? { transform: ["rotate(0deg)", `rotate(${amp.sparkleTurnDeg}deg)`, "rotate(0deg)"] } : undefined}
              transition={{ ...tween("slow", "inOutQuart"), delay: s(at.tip + 150) }}
            >
              <Icon name="sparkle" />
            </motion.span>
            <p className="tip__text">Pressure dropped 0.4 bar since yesterday. There is a tyre service 2.3 km ahead on your route.</p>
            <AddStop added={st.stopAdded} onToggle={st.addStop} />
          </Rise>
        </motion.section>
      </motion.div>

      <div className="health__side">
        <motion.section className="panel side-card" aria-label="Systems" variants={side}>
          <h2 className="side-card__title">Systems</h2>
          {[
            { name: "Tyres", state: lowCount ? `${lowCount} LOW` : "OK", tone: (lowCount ? "warning" : "ok") as RowTone },
            { name: "Battery", state: "98% HEALTH", tone: "ok" as RowTone },
            { name: "Brakes", state: "OK", tone: "ok" as RowTone },
            { name: "Lights", state: "OK", tone: "ok" as RowTone },
            { name: "Software", state: "UPDATE READY", tone: "accent" as RowTone, shimmer: true },
          ].map((r, i) => (
            <Row key={r.name} seq={seq} delay={at.systems + i * amp.stagger.expressive * 1000} dot>
              <ListRow name={r.name} state={r.shimmer && seq ? <span className="shimmer" style={{ animationDelay: `${at.systems + 400}ms` }}>{r.state}</span> : r.state} tone={r.tone} />
            </Row>
          ))}
        </motion.section>

        <motion.section className="panel side-card side-card--grow" aria-label="Maintenance" variants={side}>
          <h2 className="side-card__title">Maintenance</h2>
          {[
            { name: "Tyre rotation", state: `IN ${st.serviceKm.toLocaleString("en-GB")} KM` },
            { name: "Cabin air filter", state: "NOV 2026" },
            { name: "Brake fluid", state: "MAR 2027" },
          ].map((r, i) => (
            <Row key={r.name} seq={seq} delay={at.maintenance + i * amp.stagger.expressive * 1000}>
              <ListRow name={r.name} state={r.state} dot={false} />
            </Row>
          ))}
          <div className="side-card__spacer" />
          <Row seq={seq} delay={at.maintenance + 3 * amp.stagger.expressive * 1000}>
            <MaintenanceActions booked={st.serviceBooked} reminded={st.reminded} onBook={st.bookService} onRemind={st.remindLater} />
          </Row>
        </motion.section>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

/** Sequence entrance: rises (or slides from the left) at `delay` ms on the first visit only. */
function Rise({
  seq,
  delay,
  from = "below",
  as = "div",
  className,
  children,
}: {
  seq: boolean;
  delay: number;
  from?: "below" | "left";
  as?: "div" | "header";
  className?: string;
  children: React.ReactNode;
}) {
  const M = motion[as] as typeof motion.div;
  if (!seq) return <M className={className}>{children}</M>;
  const off = from === "left" ? `translateX(${-amp.rise}px)` : `translateY(${amp.rise / 2}px)`;
  const on = from === "left" ? "translateX(0px)" : "translateY(0px)";
  return (
    <M
      className={className}
      initial={{ opacity: 0, transform: off }}
      animate={{ opacity: 1, transform: on }}
      transition={{ opacity: { ...tween("normal"), delay: s(delay) }, transform: { ...spring.expressive, delay: s(delay) } }}
    >
      {children}
    </M>
  );
}

/** A list row in the stagger; its status dot scales up from 0.6. */
function Row({ seq, delay, dot = false, children }: { seq: boolean; delay: number; dot?: boolean; children: React.ReactNode }) {
  if (!seq) return <>{children}</>;
  return (
    <motion.div
      className={dot ? "row-rise row-rise--dot" : "row-rise"}
      style={{ ["--dot-delay" as string]: `${delay}ms` }}
      initial={{ opacity: 0, transform: `translateY(${amp.rise / 3}px)` }}
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ opacity: { ...tween("normal"), delay: s(delay) }, transform: { ...spring.expressive, delay: s(delay) } }}
    >
      {children}
    </motion.div>
  );
}

/** The car top view rises with a 3D tilt (rotateX 24 to 0) and settles on spring-dramatic. */
function CarRise({ seq, children }: { seq: boolean; children: React.ReactNode }) {
  if (!seq) return <div className="car-rise">{children}</div>;
  return (
    <motion.div
      className="car-rise"
      initial={{ opacity: 0, transform: `perspective(900px) translateY(${amp.rise * 2}px) rotateX(${amp.healthTiltDeg}deg)` }}
      animate={{ opacity: 1, transform: "perspective(900px) translateY(0px) rotateX(0deg)" }}
      transition={{ opacity: { ...tween("slow"), delay: s(at.car) }, transform: { ...spring.dramatic, delay: s(at.car) } }}
    >
      {children}
    </motion.div>
  );
}

function TyreReadout({ corner, bar, align, seq, flagged }: { corner: Corner; bar: number; align: "end" | "start"; seq: boolean; flagged: boolean }) {
  const low = isLow(bar) && flagged;
  const front = corner === "fl" || corner === "fr";
  // Roll 0.0 up to the value, clockwise from front left, 50ms apart.
  const value = useMotionValue(seq ? 0 : bar);
  useEffect(() => {
    if (!seq) {
      value.set(bar);
      return;
    }
    const id = window.setTimeout(() => value.set(bar), at.tyres + ORDER.indexOf(corner) * at.tyreStep);
    return () => window.clearTimeout(id);
  }, [seq, bar, corner, value]);

  return (
    <div className={`tyre tyre--${align} ${low ? "is-low" : ""}`}>
      {front &&
        (isLow(bar) ? (
          <span className="tyre-chip-slot">
            <AnimatePresence initial={false}>
              {low && (
                <motion.span
                  className="tyre-chip"
                  initial={seq ? { opacity: 0, transform: `scale(${amp.mediaScaleFrom})` } : false}
                  animate={{ opacity: 1, transform: seq ? ["scale(0.9)", `scale(${amp.scalePeakStrong})`, "scale(1)"] : "scale(1)" }}
                  transition={{ opacity: tween("short"), transform: tween("slow") }}
                >
                  <span className="tyre-chip__dot" aria-hidden="true" />
                  Low
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        ) : (
          <span className="tyre-chip-spacer" aria-hidden="true" />
        ))}
      <RollingNumber className="tyre__value" value={value} smooth="value" format={(v) => v.toFixed(1)} aria-label={`${LABEL[corner].toLowerCase()}, bar`} />
      <span className="tyre__label">{LABEL[corner]} · BAR</span>
    </div>
  );
}

/**
 * Add stop: press feedback, then the pill morphs to a check and "Added". The width animates
 * between the two measured widths; the icon swaps with a 2px blur.
 */
function AddStop({ added, onToggle }: { added: boolean; onToggle: () => void }) {
  const { reduced } = useMotionPrefs();
  const sizer = useRef<HTMLSpanElement>(null);
  const [widths, setWidths] = useState<{ off: number; on: number } | null>(null);
  useLayoutEffect(() => {
    const el = sizer.current;
    if (!el) return;
    const [off, on] = Array.from(el.children) as HTMLElement[];
    setWidths({ off: off.offsetWidth, on: on.offsetWidth });
  }, []);

  return (
    <>
      <PressScale
        className={`tip__action ${added ? "is-added" : ""}`}
        aria-pressed={added}
        onClick={onToggle}
        initial={false}
        animate={widths ? { width: added ? widths.on : widths.off } : undefined}
        transition={reduced ? { duration: 0 } : { width: spring.expressive }}
      >
        <AnimatePresence initial={false} mode="popLayout">
          {added && (
            <motion.span key="check" className="tip__check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={tween("short")}>
              <MorphIcon name="check" look="blur" size={20} />
            </motion.span>
          )}
        </AnimatePresence>
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={added ? "on" : "off"}
            initial={reduced ? { opacity: 0 } : { opacity: 0, filter: `blur(${amp.crossfadeBlur}px)` }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, filter: `blur(${amp.crossfadeBlur}px)` }}
            transition={tween("short")}
          >
            {added ? "Added" : "Add stop"}
          </motion.span>
        </AnimatePresence>
      </PressScale>
      {/* Invisible copies of both states, measured once for the width animation. */}
      <span ref={sizer} className="tip__sizer" aria-hidden="true">
        <span className="tip__action">Add stop</span>
        <span className="tip__action is-added">
          <Icon name="check" size={20} />
          Added
        </span>
      </span>
    </>
  );
}

/**
 * Book service: press, a short progress fill runs across, then it resolves to the booking.
 * Remind me later: the action row shrinks away and the header count rolls down.
 */
function MaintenanceActions({ booked, reminded, onBook, onRemind }: { booked: string | null; reminded: boolean; onBook: () => void; onRemind: () => void }) {
  const { reduced } = useMotionPrefs();
  const fill = useMotionValue(booked ? 1 : 0);
  const [busy, setBusy] = useState(false);
  const book = () => {
    if (booked || busy) return;
    if (reduced) return onBook();
    setBusy(true);
    animate(fill, 1, {
      ...tween("slow", "inOutQuart"),
      onComplete: () => {
        setBusy(false);
        onBook();
      },
    });
  };
  const transform = useMotionValue("translateX(-100%)");
  useEffect(() => fill.on("change", (p) => transform.set(`translateX(${(p - 1) * 100}%)`)), [fill, transform]);

  return (
    <AnimatePresence initial={false} mode="wait">
      {reminded ? (
        <motion.p key="note" className="side-card__note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={tween("normal")}>
          Reminder set for tomorrow morning
        </motion.p>
      ) : (
        <motion.div
          key="actions"
          className="side-card__actions"
          exit={reduced ? { opacity: 0, transition: tween("short") } : { opacity: 0, transform: "scale(0.96)", transition: tween("normal") }}
        >
          <PressScale className={`pill-btn pill-btn--solid book ${booked || busy ? "is-booking" : ""}`} aria-busy={busy} onClick={book}>
            <motion.span className="book__fill" style={{ transform }} aria-hidden="true" />
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={booked ?? "idle"}
                className="book__label"
                initial={reduced ? { opacity: 0 } : { opacity: 0, filter: `blur(${amp.crossfadeBlur}px)` }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0 }}
                transition={tween("short")}
              >
                {booked ? `Booked for ${booked}` : busy ? "Booking" : "Book service"}
              </motion.span>
            </AnimatePresence>
          </PressScale>
          <PressScale className="pill-btn pill-btn--outline" onClick={onRemind}>
            Remind me later
          </PressScale>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
